# VisualMap 🗺️
> 3D Delivery Routing & Shortest-Path Algorithm Visualizer

An interactive, educational full-stack web app that simulates real-world delivery routing in a 3D town. Visualizes **Dijkstra's**, **A\***, and **Bellman-Ford** algorithms with animated route traversal, decision-tree diagrams, and a live algorithm dashboard.

---

## Screenshots

| 3D Town Scene | Algorithm Dashboard |
|---|---|
| `npm run dev` → see the live scene | Right panel with stats & decision tree |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| 3D Rendering | React Three Fiber + Three.js |
| State | Zustand |
| Graph Diagram | React Flow |
| Backend | FastAPI (Python) |
| Graph Logic | Custom Dijkstra / A\* / Bellman-Ford |
| Deploy (FE) | Vercel |
| Deploy (BE) | Render |

---

## Project Structure

```
VisualMap/
├── frontend/           # React + R3F app
│   ├── src/
│   │   ├── components/
│   │   │   ├── scene/      # 3D scene components
│   │   │   ├── dashboard/  # Right-side panel
│   │   │   └── controls/   # Playback controls
│   │   ├── store/          # Zustand global state
│   │   ├── data/           # Town graph data
│   │   └── api/            # Axios API layer
│   └── package.json
│
└── backend/            # FastAPI Python API
    ├── app/
    │   ├── algorithms/ # Dijkstra, A*, Bellman-Ford
    │   ├── graph/      # Town road network
    │   ├── models/     # Pydantic schemas
    │   ├── routers/    # API endpoints
    │   └── main.py
    └── requirements.txt
```

---

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend

# Create virtual environment (recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
# API runs at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/graph` | Full town graph (nodes + edges) |
| `POST` | `/api/path` | Compute shortest path through all destinations |
| `POST` | `/api/path/steps` | Step-by-step algorithm exploration data |
| `GET` | `/health` | Health check |

### Example: POST /api/path

**Request:**
```json
{
  "algorithm": "dijkstra",
  "start": "warehouse",
  "destinations": ["addr_2", "addr_7", "addr_15"],
  "order_mode": "optimized"
}
```

**Response:**
```json
{
  "algorithm": "dijkstra",
  "path": ["warehouse", "int_A0", "addr_2", ...],
  "total_distance": 22.5,
  "visited_nodes": [...],
  "exploration_order": [...],
  "computation_time_ms": 1.4,
  "segments": [...]
}
```

---

## How to Use the App

1. **Select Algorithm** — Choose Dijkstra, A\*, or Bellman-Ford in the right panel
2. **Add Delivery Stops** — Click any blue floating pin in the 3D scene
3. **Choose Order Mode** — Manual (your order) or Optimized (nearest-neighbor TSP)
4. **Start Navigation** — Click the green button; the van animates along the route
5. **View Algorithm** — Switch to the "Algorithm" tab to read the explanation
6. **View Tree** — Switch to "Tree" tab to see the decision tree diagram

**Controls:**
- 🖱️ Drag → Rotate camera
- 🖱️ Scroll → Zoom
- 📐 Button → Toggle perspective / top-down view
- 🏷️ Button → Toggle node labels

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
# Create .env.local
echo "VITE_API_URL=https://your-backend.onrender.com" > .env.local
npm run build
# Push to GitHub and connect to Vercel
```

Or via Vercel CLI:
```bash
npx vercel --prod
```

**Vercel environment variable:** `VITE_API_URL` = your Render backend URL

---

### Backend → Render

1. Create a new **Web Service** on [Render](https://render.com)
2. Connect your GitHub repo, set root directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variable: `FRONTEND_URL` = your Vercel app URL

---

## Algorithms Explained

### Dijkstra's Algorithm
- Guarantees shortest path on non-negative weight graphs
- Uses a min-priority queue
- Complexity: O((V + E) log V)

### A* Search
- Extends Dijkstra with a heuristic h(n) = Euclidean distance to goal
- Explores fewer nodes than Dijkstra — faster in practice
- Optimal when heuristic is admissible

### Bellman-Ford
- Relaxes all edges V-1 times
- Handles negative edge weights
- Detects negative-weight cycles
- Complexity: O(V · E)

---

## Graph Data Model

- **Nodes**: Intersections, delivery addresses, and the warehouse (32 total)
- **Edges**: Road segments weighted by Euclidean distance (~50 edges)
- **Coordinates**: 3D world coordinates — `[x, y, z]` directly mapped to Three.js

---

## License

MIT — built for educational purposes.
