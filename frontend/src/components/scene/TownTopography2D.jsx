/**
 * TownTopography2D — the "Algorithm Topography Model" view rendered using the SAME 3D town world,
 * but with an orthographic top-down camera (2D-like) and free pan/zoom like the main map.
 */
import { forwardRef, memo, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';
import { TownWorld } from './TownScene';
import { NODES } from '../../data/townGraph';
import { groundHeightAt } from '../../data/elevation';

const HOME_TARGET = new THREE.Vector3(0, 0, -2);
const HOME_POS = new THREE.Vector3(0, 80, 0.01);
const HOME_ZOOM = 12;

function forceHomeView(controls) {
    if (!controls?.object) return;
    const cam = controls.object;
    controls.target?.set?.(HOME_TARGET.x, HOME_TARGET.y, HOME_TARGET.z);
    cam.position.copy(HOME_POS);
    cam.zoom = HOME_ZOOM;
    cam.near = 0.1;
    cam.far = 500;
    cam.lookAt(HOME_TARGET);
    cam.updateProjectionMatrix?.();
    controls.update?.();
    controls.saveState?.();
}

function isBadNumber(v) {
    return typeof v !== 'number' || !Number.isFinite(v);
}

function ControlsSanityGuard({ controlsRef }) {
    const lastOkRef = useRef(performance.now());

    useFrame(() => {
        const controls = controlsRef.current;
        const cam = controls?.object;
        const t = controls?.target;
        if (!controls || !cam || !t) return;

        const badTarget =
            isBadNumber(t.x) || isBadNumber(t.y) || isBadNumber(t.z) ||
            Math.abs(t.x) > 250 || Math.abs(t.z) > 250;

        const badCam =
            isBadNumber(cam.position.x) || isBadNumber(cam.position.y) || isBadNumber(cam.position.z) ||
            cam.position.y < 5 || cam.position.y > 250 ||
            (cam.isOrthographicCamera && (isBadNumber(cam.zoom) || cam.zoom < 2 || cam.zoom > 60));

        const now = performance.now();
        if (!badTarget && !badCam) {
            lastOkRef.current = now;
            return;
        }

        // Only auto-reset if we've been in a bad state long enough to not fight user input.
        if (now - lastOkRef.current < 250) return;
        forceHomeView(controls);
        lastOkRef.current = now;
    });

    return null;
}

function CanvasResizeFix({ depsKey }) {
    const { gl, camera, size, invalidate } = useThree();

    useEffect(() => {
        // In modals/flex layouts, the canvas can end up with a stale internal buffer size
        // even though CSS size looks correct. Force-sync with the parent box.
        const parent = gl.domElement?.parentElement;
        if (!parent) return;

        const apply = () => {
            const rect = parent.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect.width));
            const h = Math.max(1, Math.floor(rect.height));

            // Only touch if mismatch to avoid thrash.
            const cur = gl.getSize(new THREE.Vector2());
            if (Math.floor(cur.x) !== w || Math.floor(cur.y) !== h) {
                gl.setSize(w, h, false);
            }

            camera.updateProjectionMatrix?.();
            invalidate();
        };

        // Two RAFs handles the "layout just changed" case reliably.
        const id1 = requestAnimationFrame(() => {
            apply();
            const id2 = requestAnimationFrame(apply);
            // eslint-disable-next-line consistent-return
            return () => cancelAnimationFrame(id2);
        });
        return () => cancelAnimationFrame(id1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [depsKey, size.width, size.height]);

    return null;
}

const DecisionCallout3D = memo(function DecisionCallout3D() {
    const { stepsResult, currentStepIndex } = useStore(
        (s) => ({ stepsResult: s.stepsResult, currentStepIndex: s.currentStepIndex }),
        shallow
    );

    const step = stepsResult?.steps?.[currentStepIndex] || null;
    if (!step?.node) return null;
    const node = NODES[step.node];
    if (!node) return null;

    const x = node.pos[0];
    const z = node.pos[2];
    const y = groundHeightAt(x, z) + 0.25;

    const neighbors = Array.isArray(step.neighbors_updated) ? step.neighbors_updated.slice(0, 4) : [];

    return (
        <Html position={[x, y, z]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
            <div
                style={{
                    width: 360,
                    maxWidth: 'min(380px, 60vw)',
                    background: 'rgba(7, 10, 20, 0.88)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    borderRadius: 14,
                    padding: '10px 12px',
                    color: '#e5eefc',
                    boxShadow: '0 22px 50px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9fb0ca' }}>
                        Current Decision
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#fbbf24' }}>{node.label || step.node}</div>
                </div>

                {step.explanation && (
                    <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: '#dbeafe', lineHeight: 1.25 }}>
                        {step.explanation}
                    </div>
                )}

                {neighbors.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {neighbors.map((nb) => (
                            <div
                                key={nb.node}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                    padding: '6px 8px',
                                    borderRadius: 12,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(148,163,184,0.12)',
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div style={{ fontSize: 11, fontWeight: 850, color: nb.relaxed ? '#86efac' : '#cbd5e1' }}>
                                        {NODES[nb.node]?.label || nb.node}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#8ea3c2' }}>{nb.note || ''}</div>
                                </div>
                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cbd5e1' }}>
                                    {nb.edge_time != null && <div>+{Number(nb.edge_time).toFixed(1)} s</div>}
                                    {nb.edge_dist != null && <div>+{Number(nb.edge_dist).toFixed(1)} u</div>}
                                    {nb.edge_fuel_cost != null && <div>+{Number(nb.edge_fuel_cost).toFixed(2)} fuel</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Html>
    );
});

function ActiveEdgeProbe3D() {
    const ref = useRef();
    const tRef = useRef(0);

    const { stepsResult, currentStepIndex, isTimelinePlaying, isTimelinePaused, animationSpeed } = useStore(
        (s) => ({
            stepsResult: s.stepsResult,
            currentStepIndex: s.currentStepIndex,
            isTimelinePlaying: s.isTimelinePlaying,
            isTimelinePaused: s.isTimelinePaused,
            animationSpeed: s.animationSpeed,
        }),
        shallow
    );

    const step = stepsResult?.steps?.[currentStepIndex] || null;
    const edge = useMemo(() => {
        if (!step?.node || !Array.isArray(step.neighbors_updated) || step.neighbors_updated.length === 0) return null;
        const from = NODES[step.node];
        const to = NODES[step.neighbors_updated[0].node];
        if (!from || !to) return null;
        return { from, to };
    }, [step?.node, step?.neighbors_updated?.[0]?.node]);

    useFrame((_, delta) => {
        if (!ref.current || !edge || !isTimelinePlaying || isTimelinePaused) return;
        tRef.current = (tRef.current + delta * (animationSpeed || 1)) % 1;
        const t = tRef.current;

        const ax = edge.from.pos[0];
        const az = edge.from.pos[2];
        const bx = edge.to.pos[0];
        const bz = edge.to.pos[2];

        const x = THREE.MathUtils.lerp(ax, bx, t);
        const z = THREE.MathUtils.lerp(az, bz, t);
        const y = groundHeightAt(x, z) + 0.22;
        ref.current.position.set(x, y, z);
    });

    if (!edge) return null;

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[0.18, 10, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2.2} />
        </mesh>
    );
}

export const TownTopography2D = forwardRef(function TownTopography2D({ selectedOnly = true }, ref) {
    const controlsRef = useRef(null);
    const stepsLen = useStore((s) => s.stepsResult?.steps?.length || 0);

    useImperativeHandle(ref, () => ({
        recenter: () => forceHomeView(controlsRef.current),
    }), []);

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
                orthographic
                shadows={false}
                dpr={[1, 1.25]}
                camera={{ zoom: HOME_ZOOM, position: [HOME_POS.x, HOME_POS.y, HOME_POS.z], near: 0.1, far: 500 }}
                gl={{ antialias: true, failIfMajorPerformanceCaveat: false, powerPreference: 'high-performance' }}
                resize={{ debounce: { resize: 0, scroll: 0 } }}
                style={{ width: '100%', height: '100%' }}
                onCreated={({ gl }) => {
                    gl.setClearColor('#0b0e14', 1);
                }}
            >
                <CanvasResizeFix depsKey={stepsLen} />
                <ControlsSanityGuard controlsRef={controlsRef} />
                <TownWorld
                    forcedCameraAngle="top"
                    selectedOnlyAddresses={selectedOnly}
                    // show labels inside this overlay canvas; do NOT treat this canvas as "ui overlay open"
                    forceShowLabels={true}
                    forceUiOverlayOpen={false}
                    showVan={false}
                    showBlocks={true}
                    controlsRef={controlsRef}
                />
                <DecisionCallout3D />
                <ActiveEdgeProbe3D />
            </Canvas>
        </div>
    );
});
