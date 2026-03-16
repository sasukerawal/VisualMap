import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("VisualMap Error Interface:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: 20,
                    background: 'rgba(220, 50, 50, 0.05)',
                    border: '1px solid rgba(220, 50, 50, 0.2)',
                    borderRadius: 8,
                    color: '#e05555',
                    fontSize: '12px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '24px', marginBottom: 8 }}>⚠️</span>
                    <p style={{ fontWeight: 700, margin: '0 0 4px 0' }}>Component Crash</p>
                    <p style={{ opacity: 0.8, margin: 0 }}>{this.state.error?.message || "An unexpected error occurred"}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
