/**
 * TopographyMap2DCanvas
 *
 * Deterministic 2D renderer for "Algorithm Topography Model" that avoids WebGL-in-modal
 * resize/viewport bugs. Provides pan/zoom like a map and draws roads/houses/labels.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { NODES, EDGES, ADDRESS_NODES } from '../../data/townGraph';
import { elevationAt } from '../../data/elevation';

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function isFiniteNumber(v) {
    return typeof v === 'number' && Number.isFinite(v);
}

function computeBounds(nodes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of nodes) {
        const x = n.pos[0];
        const y = n.pos[2]; // z -> y in 2D
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    if (!Number.isFinite(minX)) return { minX: -1, minY: -1, maxX: 1, maxY: 1 };
    return { minX, minY, maxX, maxY };
}

function niceDash(ctx, dashPx = 10) {
    ctx.setLineDash([dashPx, dashPx]);
    ctx.lineDashOffset = 0;
}

function clearDash(ctx) {
    ctx.setLineDash([]);
}

export const TopographyMap2DCanvas = memo(function TopographyMap2DCanvas({
    selectedOnly = true,
    onReadyApi,
    autoPauseAtNodes = false,
}) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const rafRef = useRef(0);
    const hasUserInteractedRef = useRef(false);
    const lastSizeRef = useRef({ w: 0, h: 0 });
    const terrainCacheRef = useRef({ key: '', canvas: null, w: 0, h: 0, dpr: 1 });
    const lastInteractionAtRef = useRef(0);
    const terrainDirtyRef = useRef(true);

    const {
        destinations,
        exploredEdges,
        routeResult,
        stepsResult,
        currentStepIndex,
        currentSegment,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
    } = useStore(
        (s) => ({
            destinations: s.destinations,
            exploredEdges: s.exploredEdges,
            routeResult: s.routeResult,
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
            currentSegment: s.currentSegment,
            isTimelinePlaying: s.isTimelinePlaying,
            isTimelinePaused: s.isTimelinePaused,
            animationSpeed: s.animationSpeed,
        }),
        shallow
    );

    const [view, setView] = useState(() => ({ scale: 1, tx: 0, ty: 0 }));
    const viewRef = useRef(view);
    useEffect(() => {
        viewRef.current = view;
    }, [view]);
    const draggingRef = useRef({ active: false, lastX: 0, lastY: 0 });
    const probeRef = useRef({ t: 0 });
    const panRafRef = useRef(0);
    const panDeltaRef = useRef({ dx: 0, dy: 0 });

    const selectedSet = useMemo(() => new Set(destinations || []), [destinations?.join('|')]);
    const visibleAddresses = useMemo(() => {
        if (!selectedOnly) return ADDRESS_NODES;
        return ADDRESS_NODES.filter((n) => selectedSet.has(n.id));
    }, [selectedOnly, selectedSet]);

    const worldNodesForBounds = useMemo(() => {
        // Keep bounds stable even before selection: use all intersections + warehouse.
        const arr = [];
        for (const [id, n] of Object.entries(NODES)) arr.push({ id, pos: n.pos });
        return arr;
    }, []);

    const bounds = useMemo(() => computeBounds(worldNodesForBounds), [worldNodesForBounds]);

    const finalEdgeSet = useMemo(() => {
        const s = new Set();

        // In the Algorithm Topography Model, prefer highlighting ONLY the active segment path
        // (warehouse->dest0, dest0->dest1, ...). This avoids showing multiple segments at once.
        const segPath = routeResult?.segments?.[currentSegment]?.path;
        if (Array.isArray(segPath) && segPath.length > 1) {
            for (let i = 0; i < segPath.length - 1; i++) {
                const a = segPath[i];
                const b = segPath[i + 1];
                s.add(`${a}-${b}`);
                s.add(`${b}-${a}`);
            }
            return s;
        }

        (routeResult?.edges_traversed || []).forEach(([a, b]) => {
            s.add(`${a}-${b}`);
            s.add(`${b}-${a}`);
        });
        return s;
    }, [routeResult, currentSegment]);

    const exploredSet = useMemo(() => {
        const s = new Set();
        (exploredEdges || []).forEach((k) => {
            s.add(k);
            s.add(k.split('-').reverse().join('-'));
        });
        return s;
    }, [exploredEdges]);

    const step = stepsResult?.steps?.[currentStepIndex] || null;
    const activeRelaxed = useMemo(() => {
        const s = new Set();
        if (step?.node && Array.isArray(step.neighbors_updated)) {
            const u = step.node;
            step.neighbors_updated.forEach((nb) => {
                const v = nb.node;
                s.add(`${u}-${v}`);
                s.add(`${v}-${u}`);
            });
        }
        return s;
    }, [step?.node, step?.neighbors_updated]);

    const edgeSet = useMemo(() => {
        const s = new Set();
        for (const e of EDGES) {
            s.add(`${e.source}-${e.target}`);
            s.add(`${e.target}-${e.source}`);
        }
        return s;
    }, []);

    const carRef = useRef({ idx: -1, from: null, to: null, t: 1, pausedAt: -1, duration: 0.6, hasEdge: false });

    const fitToView = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);

        const pad = 60;
        const worldW = Math.max(1, bounds.maxX - bounds.minX);
        const worldH = Math.max(1, bounds.maxY - bounds.minY);
        const availW = Math.max(1, w - pad * 2);
        const availH = Math.max(1, h - pad * 2);
        const scale = clamp(Math.min(availW / worldW, availH / worldH), 0.5, 120);

        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        const tx = w / 2 - cx * scale;
        const ty = h / 2 - cy * scale;
        setView({ scale, tx, ty });
    }, [bounds]);

    useEffect(() => {
        // Defer to allow layout (especially fixed modals / resizable panels) to settle.
        let id2 = 0;
        const id1 = requestAnimationFrame(() => {
            fitToView();
            id2 = requestAnimationFrame(() => fitToView());
        });
        return () => {
            cancelAnimationFrame(id1);
            if (id2) cancelAnimationFrame(id2);
        };
    }, [fitToView]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;

        let raf = 0;
        const ro = new ResizeObserver((entries) => {
            const r = entries?.[0]?.contentRect;
            const w = Math.max(1, r?.width ?? el.clientWidth ?? 1);
            const h = Math.max(1, r?.height ?? el.clientHeight ?? 1);

            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const prev = lastSizeRef.current;
                lastSizeRef.current = { w, h };

                // If the user hasn't panned/zoomed yet, keep it fitted on resize.
                if (!hasUserInteractedRef.current) {
                    fitToView();
                    return;
                }

                // Otherwise, preserve the world point at the center of the screen.
                const vw = viewRef.current;
                if (!isFiniteNumber(vw.scale) || vw.scale === 0) return;
                const dx = (w - prev.w) / 2;
                const dy = (h - prev.h) / 2;
                if (dx === 0 && dy === 0) return;
                setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
            });
        });

        ro.observe(el);
        return () => {
            if (raf) cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [fitToView]);

    useEffect(() => {
        if (typeof onReadyApi !== 'function') return;
        onReadyApi({ recenter: fitToView });
    }, [onReadyApi, fitToView]);

    const worldToScreen = useCallback((x, y) => {
        return [x * view.scale + view.tx, y * view.scale + view.ty];
    }, [view]);

    const draw = useCallback((dtSec = 0) => {
        const canvas = canvasRef.current;
        const el = containerRef.current;
        if (!canvas || !el) return;

        const rect = el.getBoundingClientRect();
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));
        const dpr = clamp(window.devicePixelRatio || 1, 1, 2);

        const needResize = canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr);
        if (needResize) {
            canvas.width = Math.floor(cssW * dpr);
            canvas.height = Math.floor(cssH * dpr);
            canvas.style.width = `${cssW}px`;
            canvas.style.height = `${cssH}px`;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Background
        ctx.clearRect(0, 0, cssW, cssH);
        const bg = ctx.createLinearGradient(0, 0, 0, cssH);
        bg.addColorStop(0, '#0b1220');
        bg.addColorStop(1, '#070a12');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cssW, cssH);

        // Terrain hint: cache a cheap elevation heat layer (grid sampling)
        // so timeline playback doesn't recompute it every frame.
        {
            const cell = 34;
            const zoomKey = Math.round(view.scale * 100) / 100;
            const key = `${cssW}x${cssH}@${dpr}|${zoomKey}|${cell}`;
            const cache = terrainCacheRef.current;

            // While the user is actively dragging/zooming, keep using the last cached terrain layer.
            // Regenerate only after the interaction settles to avoid expensive redraws during pan.
            const now = performance.now();
            const isInteracting = draggingRef.current.active || (now - lastInteractionAtRef.current) < 140;
            const shouldRegen = (!cache.canvas) || cache.key !== key || (!isInteracting && terrainDirtyRef.current);

            if (shouldRegen) {
                const off = cache.canvas || document.createElement('canvas');
                off.width = Math.floor(cssW * dpr);
                off.height = Math.floor(cssH * dpr);
                const octx = off.getContext('2d');
                if (octx) {
                    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
                    octx.clearRect(0, 0, cssW, cssH);
                    for (let y = 0; y < cssH; y += cell) {
                        for (let x = 0; x < cssW; x += cell) {
                            const wx = (x - view.tx) / view.scale;
                            const wy = (y - view.ty) / view.scale;
                            const e = elevationAt(wx, wy);
                            const t = clamp((e + 1.5) / 5.0, 0, 1);
                            const r = Math.floor(20 + t * 40);
                            const g = Math.floor(40 + t * 70);
                            const b = Math.floor(30 + (1 - t) * 60);
                            octx.fillStyle = `rgba(${r},${g},${b},0.25)`;
                            octx.fillRect(x, y, cell, cell);
                        }
                    }

                    terrainCacheRef.current = { key, canvas: off, w: cssW, h: cssH, dpr };
                    terrainDirtyRef.current = false;
                }
            }

            const cached = terrainCacheRef.current;
            if (cached.canvas) {
                ctx.drawImage(cached.canvas, 0, 0, Math.floor(cssW * dpr), Math.floor(cssH * dpr), 0, 0, cssW, cssH);
            }
        }

        // Roads
        for (const e of EDGES) {
            const a = NODES[e.source];
            const b = NODES[e.target];
            if (!a || !b) continue;

            const key = `${e.source}-${e.target}`;
            const isFinal = finalEdgeSet.has(key);
            // In topography mode we want clarity: base roads + final path + current options.
            // Suppress "explored" and "active relaxed" highlighting here to avoid clutter.
            const isExplored = autoPauseAtNodes ? false : exploredSet.has(key);
            const isActive = autoPauseAtNodes ? false : activeRelaxed.has(key);
            const isMain = e.road_type === 'main';
            const isAlley = e.road_type === 'alley';

            const [x1, y1] = worldToScreen(a.pos[0], a.pos[2]);
            const [x2, y2] = worldToScreen(b.pos[0], b.pos[2]);

            let stroke = 'rgba(203,213,225,0.72)';
            let width = isMain ? 7 : isAlley ? 4.5 : 5.5;

            if (isFinal) { stroke = 'rgba(59,130,246,1)'; width = 9; }
            else if (isActive) { stroke = 'rgba(251,191,36,1)'; width = 7.5; }
            else if (isExplored) { stroke = 'rgba(99,102,241,0.85)'; width = 7; }

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            clearDash(ctx);
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = width + 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.strokeStyle = stroke;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Center dash for non-alley roads if not highlighted.
            if (!isFinal && !isActive && !isExplored && !isAlley) {
                ctx.strokeStyle = 'rgba(251,191,36,0.55)';
                ctx.lineWidth = Math.max(1.5, width * 0.2);
                niceDash(ctx, 10);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                clearDash(ctx);
            }
        }

        // Neighbor options from the current step (edges + nodes).
        if (step?.node && Array.isArray(step.neighbors_updated)) {
            const u = NODES[step.node];
            if (u) {
                const [ux, uy] = worldToScreen(u.pos[0], u.pos[2]);

                for (const nb of step.neighbors_updated) {
                    const v = nb?.node ? NODES[nb.node] : null;
                    if (!v) continue;
                    const relaxed = !!nb.relaxed;
                    const [vx, vy] = worldToScreen(v.pos[0], v.pos[2]);

                    // Option edge: green if relaxed, orange if rejected.
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    clearDash(ctx);
                    ctx.strokeStyle = relaxed ? 'rgba(34,197,94,0.95)' : 'rgba(249,115,22,0.9)';
                    ctx.lineWidth = relaxed ? 6.5 : 5.5;
                    ctx.beginPath();
                    ctx.moveTo(ux, uy);
                    ctx.lineTo(vx, vy);
                    ctx.stroke();

                    // Option node marker
                    ctx.fillStyle = relaxed ? 'rgba(34,197,94,0.95)' : 'rgba(249,115,22,0.9)';
                    ctx.strokeStyle = 'rgba(7,10,18,0.75)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(vx, vy, 8.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }

                // Active node marker
                ctx.fillStyle = 'rgba(168,85,247,0.98)';
                ctx.strokeStyle = 'rgba(7,10,18,0.75)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(ux, uy, 10.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(168,85,247,0.28)';
                ctx.lineWidth = 14;
                ctx.beginPath();
                ctx.arc(ux, uy, 14.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // "Car" marker: animate along an edge between previous and current step if possible.
        if (stepsResult?.steps?.length) {
            const curNode = step?.node;
            const prevNode = currentStepIndex > 0 ? stepsResult.steps[currentStepIndex - 1]?.node : curNode;
            const st = carRef.current;

            if (st.idx !== currentStepIndex) {
                st.idx = currentStepIndex;
                st.from = prevNode;
                st.to = curNode;
                st.t = 0;
                st.pausedAt = -1;
                st.hasEdge = !!(prevNode && curNode && edgeSet.has(`${prevNode}-${curNode}`));

                if (st.hasEdge && NODES[prevNode] && NODES[curNode]) {
                    const a = NODES[prevNode].pos;
                    const b = NODES[curNode].pos;
                    const dist = Math.hypot(b[0] - a[0], b[2] - a[2]);
                    const speed = clamp(animationSpeed || 1, 0.25, 4);
                    st.duration = clamp(dist / 18, 0.25, 1.25) / speed;
                } else {
                    st.duration = 0.001;
                    st.t = 1;
                }
            }

            if (st.hasEdge && isTimelinePlaying && !isTimelinePaused && st.t < 1) {
                st.t = clamp(st.t + dtSec / Math.max(0.001, st.duration), 0, 1);
            }

            // Auto-pause once the car reaches the node (requested behavior for topography model).
            if (autoPauseAtNodes && isTimelinePlaying && !isTimelinePaused && st.t >= 1 && st.pausedAt !== currentStepIndex) {
                st.pausedAt = currentStepIndex;
                useStore.getState().pauseSimulation();
            }

            const fromPos = st.from && NODES[st.from] ? NODES[st.from].pos : null;
            const toPos = st.to && NODES[st.to] ? NODES[st.to].pos : null;
            if (fromPos && toPos) {
                const t = st.hasEdge ? st.t : 1;
                const px = fromPos[0] + (toPos[0] - fromPos[0]) * t;
                const py = fromPos[2] + (toPos[2] - fromPos[2]) * t;
                const [sx, sy] = worldToScreen(px, py);

                ctx.fillStyle = 'rgba(168,85,247,0.98)';
                ctx.beginPath();
                ctx.arc(sx, sy, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(168,85,247,0.35)';
                ctx.lineWidth = 18;
                ctx.beginPath();
                ctx.arc(sx, sy, 16, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Houses (selected only)
        for (const n of visibleAddresses) {
            const [sx, sy] = worldToScreen(n.pos[0], n.pos[2]);
            const isSelected = selectedSet.has(n.id);
            const onPath = (routeResult?.path || []).includes(n.id);

            const size = 10;
            ctx.fillStyle = onPath ? 'rgba(34,197,94,0.95)' : isSelected ? 'rgba(251,191,36,0.95)' : 'rgba(148,163,184,0.85)';
            ctx.strokeStyle = 'rgba(15,23,42,0.65)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx - size, sy - size, size * 2, size * 2, 4);
            ctx.fill();
            ctx.stroke();

            // Label
            ctx.font = '11px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
            ctx.fillStyle = 'rgba(226,232,240,0.95)';
            ctx.strokeStyle = 'rgba(7,10,18,0.7)';
            ctx.lineWidth = 3;
            const text = n.label || n.id;
            ctx.strokeText(text, sx + 14, sy - 10);
            ctx.fillText(text, sx + 14, sy - 10);
        }

        // Warehouse
        const wh = NODES.warehouse;
        if (wh) {
            const [sx, sy] = worldToScreen(wh.pos[0], wh.pos[2]);
            ctx.fillStyle = 'rgba(249,115,22,0.95)';
            ctx.strokeStyle = 'rgba(15,23,42,0.65)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(sx - 12, sy - 12, 24, 24, 6);
            ctx.fill();
            ctx.stroke();
            ctx.font = '12px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial';
            ctx.fillStyle = 'rgba(255,237,213,0.98)';
            ctx.strokeStyle = 'rgba(7,10,18,0.75)';
            ctx.lineWidth = 3;
            ctx.strokeText('Warehouse', sx + 16, sy - 12);
            ctx.fillText('Warehouse', sx + 16, sy - 12);
        }
    }, [
        view,
        bounds,
        worldToScreen,
        visibleAddresses,
        selectedSet,
        exploredSet,
        finalEdgeSet,
        activeRelaxed,
        routeResult,
        step,
        isTimelinePlaying,
        isTimelinePaused,
        animationSpeed,
        autoPauseAtNodes,
        currentStepIndex,
        stepsResult,
        edgeSet,
    ]);

    const tick = useCallback((tNow) => {
        const last = tick.last || tNow;
        tick.last = tNow;
        const dtSec = clamp((tNow - last) / 1000, 0, 0.05);

        draw(dtSec);
        if (isTimelinePlaying && !isTimelinePaused) {
            rafRef.current = requestAnimationFrame(tick);
        } else {
            rafRef.current = 0;
        }
    }, [draw, isTimelinePlaying, isTimelinePaused]);
    // eslint-disable-next-line
    tick.last = 0;

    useEffect(() => {
        // Draw once on changes; animate only while playing.
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (isTimelinePlaying && !isTimelinePaused) {
            rafRef.current = requestAnimationFrame(tick);
        } else {
            draw(0);
        }
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (panRafRef.current) cancelAnimationFrame(panRafRef.current);
        };
    }, [draw, tick, isTimelinePlaying, isTimelinePaused, currentStepIndex, stepsResult]);

    const onPointerDown = useCallback((e) => {
        const el = containerRef.current;
        if (!el) return;
        draggingRef.current.active = true;
        hasUserInteractedRef.current = true;
        lastInteractionAtRef.current = performance.now();
        draggingRef.current.lastX = e.clientX;
        draggingRef.current.lastY = e.clientY;
        el.setPointerCapture?.(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!draggingRef.current.active) return;
        lastInteractionAtRef.current = performance.now();
        terrainDirtyRef.current = true;
        const dx = e.clientX - draggingRef.current.lastX;
        const dy = e.clientY - draggingRef.current.lastY;
        draggingRef.current.lastX = e.clientX;
        draggingRef.current.lastY = e.clientY;

        // Batch pan updates to once-per-frame to avoid React state churn.
        panDeltaRef.current.dx += dx;
        panDeltaRef.current.dy += dy;
        if (!panRafRef.current) {
            panRafRef.current = requestAnimationFrame(() => {
                panRafRef.current = 0;
                const { dx: ddx, dy: ddy } = panDeltaRef.current;
                panDeltaRef.current.dx = 0;
                panDeltaRef.current.dy = 0;
                if (ddx === 0 && ddy === 0) return;
                setView((v) => ({ ...v, tx: v.tx + ddx, ty: v.ty + ddy }));
            });
        }
    }, []);

    const onPointerUp = useCallback((e) => {
        draggingRef.current.active = false;
        lastInteractionAtRef.current = performance.now();
    }, []);

    const onWheel = useCallback((e) => {
        e.preventDefault();
        const el = containerRef.current;
        if (!el) return;
        hasUserInteractedRef.current = true;
        lastInteractionAtRef.current = performance.now();
        terrainDirtyRef.current = true;
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const zoomFactor = Math.exp(-e.deltaY * 0.0015);
        setView((v) => {
            const nextScale = clamp(v.scale * zoomFactor, 2, 80);
            const wx = (mx - v.tx) / v.scale;
            const wy = (my - v.ty) / v.scale;
            const tx = mx - wx * nextScale;
            const ty = my - wy * nextScale;
            return { scale: nextScale, tx, ty };
        });
    }, []);

    return (
        <div
            ref={containerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            style={{ position: 'absolute', inset: 0, cursor: draggingRef.current.active ? 'grabbing' : 'grab', touchAction: 'none' }}
        >
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
    );
});
