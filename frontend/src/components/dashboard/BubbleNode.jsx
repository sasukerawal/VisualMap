/**
 * BubbleNode — a readable card-style node for the decision tree.
 * Shows the node name, state label, and key scores clearly.
 */
import { Handle, Position } from 'reactflow';

const STATE_CONFIG = {
    active: {
        bg: 'linear-gradient(135deg, #4f46e5, #6366f1)',
        border: '2px solid #818cf8',
        textColor: '#fff',
        badge: '🔵 Processing',
        badgeBg: 'rgba(255,255,255,0.2)',
        glow: '0 0 20px rgba(99,102,241,0.6), 0 4px 12px rgba(0,0,0,0.2)',
    },
    settled: {
        bg: 'linear-gradient(135deg, #16a34a, #22c55e)',
        border: '2px solid #4ade80',
        textColor: '#fff',
        badge: '✅ Settled',
        badgeBg: 'rgba(255,255,255,0.2)',
        glow: '0 4px 12px rgba(34,197,94,0.4)',
    },
    candidate: {
        bg: 'linear-gradient(135deg, #d97706, #f59e0b)',
        border: '2px dashed #fbbf24',
        textColor: '#fff',
        badge: '⏳ Candidate',
        badgeBg: 'rgba(255,255,255,0.2)',
        glow: '0 4px 8px rgba(245,158,11,0.3)',
    },
    goal: {
        bg: 'linear-gradient(135deg, #b45309, #d97706)',
        border: '3px solid #fbbf24',
        textColor: '#fff',
        badge: '⭐ Goal!',
        badgeBg: 'rgba(255,255,255,0.25)',
        glow: '0 0 24px rgba(251,191,36,0.7)',
    },
    skipped: {
        bg: '#f1f5f9',
        border: '1px dashed #cbd5e1',
        textColor: '#94a3b8',
        badge: 'Skipped',
        badgeBg: '#e2e8f0',
        glow: 'none',
    },
};

export function BubbleNode({ data }) {
    const { label, state, distance, heuristic, f_score } = data;
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.skipped;
    const isActive = state === 'active';

    return (
        <div
            className={isActive ? 'pulse-anim' : ''}
            style={{
                width: 120,
                background: cfg.bg,
                border: cfg.border,
                borderRadius: 10,
                boxShadow: cfg.glow,
                color: cfg.textColor,
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />

            {/* Node name */}
            <div style={{
                padding: '8px 8px 4px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '12px',
                lineHeight: 1.2,
                borderBottom: '1px solid rgba(255,255,255,0.15)'
            }}>
                {label}
            </div>

            {/* State badge */}
            <div style={{
                padding: '3px 6px',
                background: cfg.badgeBg,
                textAlign: 'center',
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.3px',
            }}>
                {cfg.badge}
            </div>

            {/* Score row */}
            <div style={{
                display: 'flex',
                gap: 0,
                borderTop: '1px solid rgba(255,255,255,0.12)',
            }}>
                <div style={{ flex: 1, padding: '4px 2px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: 2 }}>Time</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                        {distance !== undefined ? Number(distance).toFixed(1) + 's' : '?'}
                    </div>
                </div>
                {heuristic !== undefined && heuristic !== null && (
                    <div style={{ flex: 1, padding: '4px 2px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: 2 }}>h</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}>
                            {Number(heuristic).toFixed(1)}
                        </div>
                    </div>
                )}
                {f_score !== undefined && f_score !== null && (
                    <div style={{ flex: 1, padding: '4px 2px', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', opacity: 0.7, marginBottom: 2 }}>f</div>
                        <div style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'monospace' }}>
                            {Number(f_score).toFixed(1)}
                        </div>
                    </div>
                )}
                {!heuristic && !f_score && (
                    // For Dijkstra — show just the distance wider
                    <div style={{ flex: 1, padding: '4px 2px', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', opacity: 0.5 }}>g-score</div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
        </div>
    );
}
