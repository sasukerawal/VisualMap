import React, { useEffect, useMemo, useRef } from 'react';
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

    const currentLogs = useMemo(() => {
        const safeSteps = Array.isArray(steps) ? steps : [];
        const upto = Math.max(0, Math.min(currentIndex ?? 0, safeSteps.length - 1));
        return safeSteps.slice(0, upto + 1).map((step, idx) => {
            const isLast = idx === upto;
            const narr = step?.narration || null;
            const time = new Date(1773646808544 + idx * 2000).toLocaleTimeString();

            let headline = narr?.action_title || step?.explanation || step?.description || `Step ${idx + 1}`;
            let body = '';
            if (narr) {
                body = isTechnical
                    ? `${narr.why}\n\n${narr.summary}`
                    : narr.summary || narr.why;
            } else {
                body = step?.explanation || step?.description || '';
            }

            return { id: idx, headline, body, isLast, time };
        });
    }, [steps, currentIndex, isTechnical]);

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
                            <p style={{ margin: 0, fontSize: '11px', color: log.isLast ? '#e2e8f0' : '#64748b', lineHeight: 1.55, fontWeight: log.isLast ? 750 : 500 }}>
                                <span style={{ display: 'block', marginBottom: 6 }}>{log.headline}</span>
                                <span style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{log.body}</span>
                            </p>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
