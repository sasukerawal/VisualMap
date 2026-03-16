/**
 * Zustand global store for VisualMap
 * Manages: destinations, algorithm selection, route result, animation state
 */
import { create } from 'zustand';

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
    showLabels: true,
    darkMode: true,
    cameraAngle: 'perspective', // 'perspective' | 'top'
    isLoading: false,
    error: null,

    setShowLabels: (v) => set({ showLabels: v }),
    toggleDarkMode: () => set({ darkMode: !get().darkMode }),
    setCameraAngle: (v) => set({ cameraAngle: v }),
    setIsLoading: (v) => set({ isLoading: v }),
    setError: (e) => set({ error: e }),

    // ── Full Reset ────────────────────────────────────────────────────────
    resetAll: () => set({
        destinations: [],
        routeResult: null,
        stepsResult: null,
        isPlaying: false,
        isPaused: false,
        currentPathIndex: 0,
        currentSegment: 0,
        deliveredNodes: [],
        exploredNodes: [],
        exploredEdges: [],
        error: null,
    }),

    resetAnimation: () => set({
        isPlaying: false,
        isPaused: false,
        currentPathIndex: 0,
        currentSegment: 0,
        deliveredNodes: [],
        exploredNodes: [],
        exploredEdges: [],
    }),
}));

export default useStore;
