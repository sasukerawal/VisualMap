/**
 * DeliveryList — shows and manages the list of delivery destinations.
 */
import useStore from '../../store/useStore';
import { NODES } from '../../data/townGraph';

export function DeliveryList() {
    const { destinations, removeDestination, clearDestinations, deliveredNodes, isPlaying } = useStore();

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                    Delivery Stops ({destinations.length})
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => {
                        const arr = Object.keys(NODES).filter(k => NODES[k].type === 'address');
                        const rand = arr[Math.floor(Math.random() * arr.length)];
                        useStore.getState().addDestination(rand);
                    }}>
                        + Random Stop
                    </button>
                    {destinations.length > 0 && !isPlaying && (
                        <button className="btn btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={clearDestinations}>
                            Clear All
                        </button>
                    )}
                </div>
            </div>

            {destinations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                    <div style={{ fontSize: '28px', marginBottom: 6 }}>📍</div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                        Click any blue pin in the 3D scene to add a delivery stop
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {destinations.map((id, idx) => {
                        const node = NODES[id];
                        const delivered = deliveredNodes.includes(id);
                        return (
                            <div
                                key={id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '7px 10px',
                                    background: delivered
                                        ? 'rgba(0,255,133,0.07)'
                                        : 'rgba(99,120,255,0.05)',
                                    border: `1px solid ${delivered ? 'rgba(0,255,133,0.2)' : 'rgba(99,120,255,0.1)'}`,
                                    borderRadius: 8,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)', minWidth: 20 }}>
                                    {idx + 1}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '12px', fontWeight: 500, color: delivered ? 'var(--accent-green)' : 'var(--text-primary)', margin: 0 }}>
                                        {delivered ? '✓ ' : ''}{node?.label || id}
                                    </p>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '1px 0 0', fontFamily: 'var(--font-mono)' }}>
                                        {id} · [{node?.pos.join(', ')}]
                                    </p>
                                </div>
                                {!isPlaying && (
                                    <button
                                        className="btn btn-ghost btn-icon"
                                        onClick={() => removeDestination(id)}
                                        style={{ fontSize: '12px', width: 26, height: 26 }}
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
