from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)
payload = {
    "start": "warehouse",
    "destinations": ["a1", "g1"],
    "algorithm": "dijkstra",
    "order_mode": "manual",
}


def main():
    health = client.get("/health")
    print(f"Health: {health.status_code} {health.json()}")

    response = client.post("/api/path", json=payload)
    print(f"Path status: {response.status_code}")
    if response.status_code != 200:
        print(response.text)
        raise SystemExit(1)

    data = response.json()
    print(f"Algorithm: {data['algorithm']}")
    print(f"Stops in path: {len(data['path'])}")
    print(f"Distance: {data['total_distance']}")


if __name__ == "__main__":
    main()
