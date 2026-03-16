import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { displayNodeName } from '../../data/townGraph';

const BLOCK_COLORS = {
    'A': { bg: '#fbbf24', border: '#f59e0b', text: '#000', label: 'Apple St' },
    'B': { bg: '#f8fafc', border: '#cbd5e1', text: '#334155', label: 'Baker Ave' },
    'C': { bg: '#fda4af', border: '#f43f5e', text: '#fff', label: 'Cedar Ln' },
    'D': { bg: '#fbbf24', border: '#f59e0b', text: '#000', label: 'Daisy Rd' },
    'E': { bg: '#bef264', border: '#84cc16', text: '#334155', label: 'Elm Way' },
    'F': { bg: '#a5f3fc', border: '#06b6d4', text: '#083344', label: 'Fig Blvd' },
    'G': { bg: '#d8b4fe', border: '#a855f7', text: '#fff', label: 'Grove Ct' },
    'W': { bg: '#f97316', border: '#ea580c', text: '#fff', label: 'Warehouse' },
    'DEFAULT': { bg: '#94a3b8', border: '#475569', text: '#fff', label: 'Road' }
};

const STATE_STYLES = {
    active: { glow: '0 0 20px rgba(99, 102, 241, 0.8)', scale: 1.2, zIndex: 10 },
    candidate: { opacity: 0.8, scale: 0.95 },
    visited: { opacity: 0.6, scale: 0.9 },
    goal: { glow: '0 0 25px rgba(16, 185, 129, 0.7)', scale: 1.15 },
    start: { glow: '0 0 25px rgba(249, 115, 22, 0.7)', scale: 1.15 },
};

export function BubbleNode({ data }) {
    const { label, state, distance, block, learningMode, heuristic, f_score, explanation, via, edge_time_cost, edge_distance } = data;
    const [isHovered, setIsHovered] = useState(false);

    const hasDistance = typeof distance === 'number' && Number.isFinite(distance);
    const hasHeuristic = typeof heuristic === 'number' && Number.isFinite(heuristic);
    const hasFScore = typeof f_score === 'number' && Number.isFinite(f_score);

    const blockKey = block || (label === 'Warehouse' ? 'W' : 'DEFAULT');
    const bColor = BLOCK_COLORS[blockKey] || BLOCK_COLORS.DEFAULT;
    const sStyle = STATE_STYLES[state] || {};

    const isWarehouse = label === 'Warehouse';
    const isIntersection = !block && !isWarehouse;

    // Schematic nodes are circular
    const size = isIntersection ? 45 : 70;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: size,
                height: size,
                background: isHovered ? '#fff' : bColor.bg,
                border: `2px solid ${isHovered ? '#6366f1' : bColor.border}`,
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isHovered ? '0 0 30px rgba(99, 102, 241, 0.6)' : (sStyle.glow || '0 2px 10px rgba(0,0,0,0.3)'),
                transform: `scale(${isHovered ? 1.3 : (sStyle.scale || 1)})`,
                opacity: sStyle.opacity || 1,
                zIndex: isHovered ? 1000 : (sStyle.zIndex || 1),
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                cursor: 'pointer'
            }}
        >
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />

            {/* Main Label */}
            <div style={{
                fontSize: isIntersection ? '8px' : '10px',
                fontWeight: 900,
                color: isHovered ? '#000' : bColor.text,
                textAlign: 'center',
                lineHeight: 1.1,
                padding: '0 4px',
                wordBreak: 'break-word',
            }}>
                {String(label).replace('St', '').replace('Ave', '').replace('Ln', '').replace('Rd', '').replace('Blvd', '').replace('Way', '').replace('Ct', '').trim()}
            </div>

            {/* Active decision rationale */}
            {state === 'active' && explanation && (
                <div style={{
                    position: 'absolute',
                    top: size + 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 210,
                    background: 'rgba(12, 18, 30, 0.82)',
                    border: '1px solid rgba(148,163,184,0.22)',
                    borderRadius: 12,
                    padding: '8px 10px',
                    color: '#d6e4ff',
                    fontSize: '9px',
                    lineHeight: 1.35,
                    boxShadow: '0 14px 30px rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(10px)',
                    pointerEvents: 'none',
                    zIndex: 9999
                }}>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#35d7e8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        Why This Node
                    </div>
                    <div style={{ opacity: 0.95 }}>
                        {String(explanation).slice(0, 140)}{String(explanation).length > 140 ? '…' : ''}
                    </div>
                </div>
            )}

            {/* Hover Formula Pop-up (Glassmorphism + High Z-index) */}
            {isHovered && hasDistance && (
                <div style={{
                    position: 'absolute',
                    top: -70,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    padding: '10px 16px',
                    borderRadius: 14,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.8)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    pointerEvents: 'none',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px' }}>Efficiency Logic</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                        {hasHeuristic ? (
                            <span>
                                f = {distance.toFixed(1)} + {heuristic.toFixed(1)} ={' '}
                                <span style={{ color: '#fbbf24' }}>{hasFScore ? f_score.toFixed(1) : '[]'}</span>
                            </span>
                        ) : (
                            <span>cost = <span style={{ color: '#10b981' }}>{distance.toFixed(1)}s</span></span>
                        )}
                    </div>
                    {(typeof via === 'string' || typeof edge_time_cost === 'number' || typeof edge_distance === 'number') && (
                        <div style={{ fontSize: '10px', color: '#9fb0ca', fontWeight: 700 }}>
                            {via ? `via ${displayNodeName(via)}` : ''}
                            {typeof edge_time_cost === 'number' ? `  +${edge_time_cost.toFixed(2)}s` : ''}
                            {typeof edge_distance === 'number' ? `  +${edge_distance.toFixed(1)}m` : ''}
                        </div>
                    )}
                </div>
            )}

            {/* Metric Badge (Static) */}
            {!isHovered && state !== 'candidate' && hasDistance && (
                <div style={{
                    position: 'absolute',
                    bottom: -8,
                    background: '#121826',
                    color: '#fff',
                    padding: '2px 5px',
                    borderRadius: 4,
                    fontSize: '8px',
                    fontWeight: 800,
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                }}>
                    {distance.toFixed(1)}s
                </div>
            )}

            <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
        </div>
    );
}
