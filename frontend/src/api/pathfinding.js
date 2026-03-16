/**
 * API abstraction layer — all backend calls go through here.
 * Uses the Vite proxy (dev) or VITE_API_URL env var (production).
 */
import axios from 'axios';

const API_BASE =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch the full town graph from the backend.
 * @returns {Promise<{nodes: Array, edges: Array}>}
 */
export async function fetchGraph() {
    const res = await api.get('/api/graph');
    return res.data;
}

/**
 * Calculate the shortest path through all delivery destinations.
 * @param {string} algorithm - 'dijkstra' | 'astar' | 'bellman_ford'
 * @param {string} start - starting node ID
 * @param {string[]} destinations - ordered destination IDs
 * @param {string} orderMode - 'manual' | 'optimized'
 * @returns {Promise<PathResponse>}
 */
export async function computePath({ algorithm, start, destinations, orderMode }) {
    const res = await api.post('/api/path', {
        algorithm,
        start,
        destinations,
        order_mode: orderMode,
    });
    return res.data;
}

/**
 * Fetch step-by-step algorithm exploration data.
 * @param {string} algorithm
 * @param {string} start
 * @param {string[]} destinations
 * @param {string} orderMode
 * @returns {Promise<StepsResponse>}
 */
export async function computePathSteps({ algorithm, start, destinations, orderMode, segmentIndex }) {
    const res = await api.post('/api/path/steps', {
        algorithm,
        start,
        destinations,
        order_mode: orderMode,
        ...(typeof segmentIndex === 'number' ? { segment_index: segmentIndex } : {}),
    });
    return res.data;
}

/**
 * Health check — useful for dev verification
 */
export async function healthCheck() {
    const res = await api.get('/health');
    return res.data;
}
