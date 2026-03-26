/**
 * Zustand global store for VisualMap
 * Manages: destinations, algorithm selection, route result, animation state
 */
import { create } from 'zustand';

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

// Keep rAF ids out of Zustand state to avoid per-frame store updates.
let timelineRafId = 0;

const useStore = create((set, get) => ({
    // ── Algorithm ────────────────────────────────────────────────────────────
    algorithm: 'dijkstra',  // 'dijkstra' | 'astar' | 'bellman_ford'
    setAlgorithm: (algo) => set({ algorithm: algo }),

    orderMode: 'optimized', // 'manual' | 'optimized'
    setOrderMode: (mode) => set({ orderMode: mode }),

    // ── Delivery Destinations ─────────────────────────────────────────────
    destinations: [],  // array of node IDs e.g. ['addr_1', 'addr_3']
    addDestination: (nodeId) => {
        const { destinations } = get();
        if (!destinations.includes(nodeId)) {
            set({ destinations: [...destinations, nodeId] });
        }
    },
    removeDestination: (nodeId) => {
        set({ destinations: get().destinations.filter((d) => d !== nodeId) });
    },
    reorderDestinations: (newOrder) => set({ destinations: newOrder }),
    clearDestinations: () => set({ destinations: [] }),

    // ── Route Result (from API) ───────────────────────────────────────────
    routeResult: null,  // full PathResponse from backend
    stepsResult: null,  // StepsResponse from backend
    setRouteResult: (r) => set({ routeResult: r }),
    setStepsResult: (s) => set({ stepsResult: s }),
    clearResults: () => set({ routeResult: null, stepsResult: null }),

    // ── Tutor (LLM overlay) ────────────────────────────────────────────────
    tutorOpen: false,
    setTutorOpen: (open) => set({ tutorOpen: !!open }),
    tutorHistory: [], // [{ role: 'user'|'assistant', content }]
    tutorAddMessage: (m) => set((state) => ({ tutorHistory: [...(state.tutorHistory || []), m] })),
    tutorClear: () => set({ tutorHistory: [] }),

    // ── Animation State ───────────────────────────────────────────────────
    isPlaying: false,
    isPaused: false,
    animationSpeed: 1,    // multiplier (0.5x → 2x)
    currentPathIndex: 0,  // position of van along path[] array
    currentSegment: 0,    // which delivery segment the van is on
    deliveredNodes: [],   // node IDs the van has visited so far
    exploredNodes: [],    // nodes explored by the algorithm (for highlighting)
    exploredEdges: [],    // edges explored
    currentStepIndex: 0,  // active step in the algorithm playback

    setIsPlaying: (v) => set({ isPlaying: v }),
    setIsPaused: (v) => set({ isPaused: v }),
    setAnimationSpeed: (v) => set({ animationSpeed: v }),
    setCurrentPathIndex: (i) => set({ currentPathIndex: i }),
    setCurrentSegment: (i) => set({ currentSegment: i }),
    setCurrentStepIndex: (i) => set({ currentStepIndex: i }),
    addDelivered: (nodeId) => {
        if (!get().deliveredNodes.includes(nodeId)) {
            set({ deliveredNodes: [...get().deliveredNodes, nodeId] });
        }
    },
    setExploredNodes: (nodes) => set({ exploredNodes: nodes }),
    setExploredEdges: (edges) => set({ exploredEdges: edges }),

    // ── UI State ──────────────────────────────────────────────────────────
    showLabels: false,
    darkMode: true,
    cameraAngle: 'perspective', // 'perspective' | 'top'
    isLoading: false,
    error: null,

    // Hover coordination between panels and the 2D/3D maps
    hoveredEdgeKey: null, // `${from}-${to}`
    setHoveredEdgeKey: (k) => set({ hoveredEdgeKey: k || null }),

    learningMode: 'intermediate', // 'beginner' | 'intermediate' | 'advanced' | 'professor'
    setLearningMode: (mode) => set({ learningMode: mode }),

    setShowLabels: (v) => set({ showLabels: v }),
    toggleDarkMode: () => set({ darkMode: !get().darkMode }),
    setCameraAngle: (v) => set({ cameraAngle: v }),
    setIsLoading: (v) => set({ isLoading: v }),
    setError: (e) => set({ error: e }),

    // Modal/overlay coordination (prevents 3D Html labels bleeding through)
    isUiOverlayOpen: false,
    uiOverlayLockCount: 0,
    setUiOverlayOpen: (v) => set({ isUiOverlayOpen: !!v }),
    pushUiOverlayLock: () =>
        set((state) => ({
            uiOverlayLockCount: (state.uiOverlayLockCount || 0) + 1,
            isUiOverlayOpen: true,
        })),
    popUiOverlayLock: () =>
        set((state) => {
            const next = Math.max(0, (state.uiOverlayLockCount || 0) - 1);
            return { uiOverlayLockCount: next, isUiOverlayOpen: next > 0 };
        }),
    clearUiOverlayLocks: () => set({ uiOverlayLockCount: 0, isUiOverlayOpen: false }),

    // Timeline playback (Theory / Topography)
    isTimelinePlaying: false,
    isTimelinePaused: false,
    timelineTimerId: null,

    runSimulation: () => {
        const { stepsResult, timelineTimerId } = get();
        if (!stepsResult?.steps?.length) return;

        // Cancel any existing loop without causing extra store churn.
        if (timelineRafId) cancelAnimationFrame(timelineRafId);
        if (timelineTimerId) cancelAnimationFrame(timelineTimerId);
        set({ isTimelinePlaying: true, isTimelinePaused: false });

        // rAF-driven timeline: smoother and honors speed changes immediately.
        let lastTs = 0;
        let accumMs = 0;

        const tick = (ts) => {
            const state = get();
            if (!state.isTimelinePlaying || state.isTimelinePaused) return;

            const stepsLen = state.stepsResult?.steps?.length || 0;
            const lastIndex = Math.max(0, stepsLen - 1);
            const speed = clamp(state.animationSpeed || 1, 0.25, 4);
            const stepMs = 1000 / speed;

            if (!lastTs) lastTs = ts;
            const dt = clamp(ts - lastTs, 0, 64);
            lastTs = ts;
            accumMs += dt;

            let idx = state.currentStepIndex || 0;
            while (accumMs >= stepMs && idx < lastIndex) {
                accumMs -= stepMs;
                idx += 1;
            }
            if (idx !== state.currentStepIndex) set({ currentStepIndex: idx });

            if (idx >= lastIndex) {
                get().pauseSimulation();
                return;
            }

            timelineRafId = requestAnimationFrame(tick);
        };

        timelineRafId = requestAnimationFrame(tick);
        // Keep this for UI/debugging only (not updated per-frame).
        set({ timelineTimerId: timelineRafId });
    },

    pauseSimulation: () => {
        const { timelineTimerId } = get();
        if (timelineRafId) cancelAnimationFrame(timelineRafId);
        timelineRafId = 0;
        if (timelineTimerId) cancelAnimationFrame(timelineTimerId);
        set({ isTimelinePlaying: false, isTimelinePaused: true, timelineTimerId: null });
    },

    resetSimulation: () => {
        const { timelineTimerId } = get();
        if (timelineRafId) cancelAnimationFrame(timelineRafId);
        timelineRafId = 0;
        if (timelineTimerId) cancelAnimationFrame(timelineTimerId);
        set({
            isTimelinePlaying: false,
            isTimelinePaused: false,
            currentStepIndex: 0,
            timelineTimerId: null
        });
    },

    // ── Full Reset ────────────────────────────────────────────────────────
    resetAll: () => {
        const { timerId, timelineTimerId } = get();
        if (timerId) clearInterval(timerId);
        if (timelineRafId) cancelAnimationFrame(timelineRafId);
        timelineRafId = 0;
        if (timelineTimerId) cancelAnimationFrame(timelineTimerId);
        set({
            destinations: [],
            routeResult: null,
            stepsResult: null,
            isPlaying: false,
            isPaused: false,
            currentPathIndex: 0,
            currentSegment: 0,
            currentStepIndex: 0,
            deliveredNodes: [],
            exploredNodes: [],
            exploredEdges: [],
            error: null,
            timerId: null,
            isTimelinePlaying: false,
            isTimelinePaused: false,
            timelineTimerId: null,
        });
    },

    resetAnimation: () => {
        const { timerId, timelineTimerId } = get();
        if (timerId) clearInterval(timerId);
        if (timelineRafId) cancelAnimationFrame(timelineRafId);
        timelineRafId = 0;
        if (timelineTimerId) cancelAnimationFrame(timelineTimerId);
        set({
            isPlaying: false,
            isPaused: false,
            currentPathIndex: 0,
            currentSegment: 0,
            currentStepIndex: 0,
            deliveredNodes: [],
            exploredNodes: [],
            exploredEdges: [],
            timerId: null,
            isTimelinePlaying: false,
            isTimelinePaused: false,
            timelineTimerId: null,
        });
    },
}));

export default useStore;
