/**
 * AlgoSelector — choose between Dijkstra, A*, and Bellman-Ford.
 * Premium tabbed buttons with description previews.
 */
import useStore from '../../store/useStore';
import { shallow } from 'zustand/shallow';

const ALGOS = [
    {
        id: 'dijkstra',
        name: "Dijkstra",
        icon: '⚖️',
        tagline: 'Guaranteed shortest path',
        color: '#00e87a',
        glow: 'rgba(0,232,122,0.25)',
    },
    {
        id: 'astar',
        name: "A*",
        icon: '🎯',
        tagline: 'Heuristic-guided, faster',
        color: '#00d4ff',
        glow: 'rgba(0,212,255,0.25)',
    },
    {
        id: 'bellman_ford',
        name: "Bellman-Ford",
        icon: '🔁',
        tagline: 'Handles negative weights',
        color: '#ff8c3a',
        glow: 'rgba(255,140,58,0.25)',
    },
];

export function AlgoSelector() {
    const { algorithm, setAlgorithm, isPlaying } = useStore(
        (s) => ({
            algorithm: s.algorithm,
            setAlgorithm: s.setAlgorithm,
            isPlaying: s.isPlaying,
        }),
        shallow
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#3f4c6b',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 2,
            }}>
                Algorithm
            </p>
            <div style={{ display: 'flex', gap: 5 }}>
                {ALGOS.map((algo) => {
                    const active = algorithm === algo.id;
                    return (
                        <button
                            key={algo.id}
                            onClick={() => !isPlaying && setAlgorithm(algo.id)}
                            disabled={isPlaying}
                            title={algo.tagline}
                            style={{
                                flex: 1,
                                padding: '7px 4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 3,
                                cursor: isPlaying ? 'not-allowed' : 'pointer',
                                border: `1.5px solid ${active ? algo.color : 'rgba(99,120,255,0.13)'}`,
                                borderRadius: 9,
                                background: active
                                    ? `linear-gradient(160deg, ${algo.glow}, transparent)`
                                    : 'rgba(255,255,255,0.02)',
                                color: active ? algo.color : '#3f4c6b',
                                boxShadow: active ? `0 0 14px ${algo.glow}` : 'none',
                                transition: 'all 0.2s',
                                opacity: isPlaying ? 0.5 : 1,
                            }}
                        >
                            <span style={{ fontSize: '14px' }}>{algo.icon}</span>
                            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2px' }}>
                                {algo.name}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Selected algo tagline */}
            {ALGOS.find(a => a.id === algorithm) && (
                <p style={{
                    fontSize: '10px',
                    color: '#3f4c6b',
                    textAlign: 'center',
                    marginTop: 1,
                }}>
                    {ALGOS.find(a => a.id === algorithm).tagline}
                </p>
            )}
        </div>
    );
}
