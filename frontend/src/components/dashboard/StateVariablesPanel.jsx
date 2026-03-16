import React from 'react';

export function StateVariablesPanel({ f_score, distance, heuristic, nodeLabel, minimal = false }) {
    const fmt = (v) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(2) : '[]');
    const vars = [
        { name: 'f', value: fmt(f_score), color: '#818cf8', comment: 'total cost' },
        { name: 'g', value: fmt(distance), color: '#6366f1', comment: 'dist from start' },
        { name: 'h', value: fmt(heuristic), color: '#10b981', comment: 'estimated to goal' },
    ];

    const containerStyle = minimal ? { height: '100%', display: 'flex', flexDirection: 'column' } : {
        height: '100%', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(10px)',
        borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
    };

    return (
        <div style={containerStyle}>
            {!minimal && (
                <div style={{
                    padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    fontSize: '10px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                    State Inspector: {nodeLabel || 'null'}
                </div>
            )}

            <div style={{
                flex: 1, padding: minimal ? '12px' : '20px', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 10
            }}>
                <div style={{ color: '#6366f1', fontWeight: 700 }}>node.in_progress(&#123;</div>
                {vars.map((v, i) => (
                    <div key={i} style={{ paddingLeft: 16, display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: v.color, width: 14 }}>{v.name}</span>
                        <span style={{ margin: '0 8px' }}>=</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 800 }}>{v.value};</span>
                        <span style={{ marginLeft: 'auto', opacity: 0.3, fontSize: '9px' }}>// {v.comment}</span>
                    </div>
                ))}
                <div style={{ paddingLeft: 16 }}>
                    <span style={{ color: '#666', fontSize: '9px' }}>...</span>
                </div>
                <div style={{ color: '#6366f1', fontWeight: 700 }}>&#125;)</div>
            </div>

            {!minimal && (
                <div style={{
                    padding: '10px 16px', background: 'rgba(0,0,0,0.2)', fontSize: '9px', color: '#475569',
                    display: 'flex', justifyContent: 'space-between'
                }}>
                    <span>MEMORY_HEARTBEAT: OK</span>
                    <span>v3.0.1</span>
                </div>
            )}
        </div>
    );
}
