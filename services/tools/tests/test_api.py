from fastapi.testclient import TestClient

from jarvis_tools.api import create_app


def test_health() -> None:
    with TestClient(create_app()) as client:
        res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
