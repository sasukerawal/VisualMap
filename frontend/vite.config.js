import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                // Reduce initial JS parse/exec by splitting big libraries.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('/three')) return 'three';
                    if (id.includes('@react-three')) return 'r3f';
                    if (id.includes('/react-dom') || id.includes('/react/')) return 'react';
                    if (id.includes('zustand')) return 'state';
                    if (id.includes('axios')) return 'net';
                    return 'vendor';
                },
            },
        },
    },
});
