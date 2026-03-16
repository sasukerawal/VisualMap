import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReasoningPanel({ steps, currentIndex, title = "Algorithmic Logic", variant = "default" }) {
    const scrollRef = useRef(null);
    const isMinimal = variant.includes('minimal');
    const isTechnical = variant.includes('technical');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentIndex]);

    const currentLogs = steps.slice(0, currentIndex + 1).map((step, idx) => {
        const isLast = idx === currentIndex;
        let text = "";
        const time = new Date(1773646808544 + idx * 2000).toLocaleTimeString();

        if (idx === 0) {
            text = "Initializing search space. Setting start distances to 0.";
        } else {
            const nodeLabel = step.node_label || step.node;
            if (step.action === 'extract') {
                text = isTechnical
                    ? `Priority queue check. Node ${nodeLabel} (cost ${step.distance.toFixed(0)}) is optimal.`
                    : `Extracting ${nodeLabel}: Found node with minimum accumulated cost. Expanding search frontier.`;
            } else if (step.neighbors_updated?.length) {
                const count = step.neighbors_updated.length;
                text = isTechnical
                    ? `Re-evaluating optimal path based on heuristic. ${count} neighbors checked.`
                    : `Evaluating ${count} neighbors from ${nodeLabel}. Relaxing edges based on ${step.algorithm === 'astar' ? 'f(n) = g(n) + h(n)' : 'distance weights'}.`;
            } else {
                text = `Processing ${nodeLabel}: Analyzing path efficiency...`;
            }
        }

        return { id: idx, text, isLast, node: step.node, time };
    });

    const containerStyle = isMinimal ? { height: '100%', display: 'flex', flexDirection: 'column' } : {
        height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(10px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden'
    };

    return (
        <div style={containerStyle}>
            {!isMinimal && (
                <div style={{
                    padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: 10
                }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isTechnical ? '#22d3ee' : '#10b981', boxShadow: `0 0 10px ${isTechnical ? '#22d3ee' : '#10b981'}` }} />
                    <h3 style={{ margin: 0, fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#fff', letterSpacing: '1px' }}>{title}</h3>
                </div>
            )}

            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'none' }}>
                <AnimatePresence initial={false}>
                    {currentLogs.map((log) => (
                        <motion.div
                            key={log.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: log.isLast ? 1 : 0.45, y: 0 }}
                            style={{
                                padding: '10px', background: log.isLast ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
                                borderRadius: 8, borderLeft: log.isLast ? '2px solid #22d3ee' : 'none', transition: 'background 0.3s ease'
                            }}
                        >
                            {log.isLast && (
                                <div style={{ fontSize: '9px', fontWeight: 900, color: '#22d3ee', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>(Current step - active)</div>
                            )}
                            <span style={{ fontSize: '9px', color: '#64748b', display: 'block', fontStyle: 'italic', marginBottom: 2 }}>(Timestamp {log.time})</span>
                            <p style={{ margin: 0, fontSize: '11px', color: log.isLast ? '#e2e8f0' : '#64748b', lineHeight: 1.6, fontWeight: log.isLast ? 600 : 400 }}>{log.text}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
