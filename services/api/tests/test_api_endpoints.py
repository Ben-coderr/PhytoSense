from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoints():
    res = client.get("/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_providers = client.get("/v1/health/providers")
    assert res_providers.status_code == 200
    data = res_providers.json()
    assert "plant_id" in data
    assert "llm" in data
    assert any(p["name"] == "gemini" for p in data["llm"])
    assert any(p["name"] == "rule_based" for p in data["llm"])

def test_search_plant_endpoint():
    res = client.get("/v1/plants/search?q=Nigella")
    assert res.status_code == 200
    data = res.json()
    assert data["found_local"] is True
    assert len(data["results"]) > 0
    assert "Nigella" in data["results"][0]["scientific_name"]

def test_get_plant_by_id():
    res = client.get("/v1/plants/1")
    assert res.status_code == 200
    assert res.json()["id"] == 1

def test_legacy_routes_compatibility():
    # Tests that the Next.js web app's legacy route /api/plants/search still works
    res = client.get("/api/plants/search?q=Nigella")
    assert res.status_code == 200
    assert res.json()["found_local"] is True

def test_sync_manifest_and_db():
    res = client.get("/v1/sync/manifest")
    assert res.status_code == 200
    manifest = res.json()
    assert "db_version" in manifest
    assert "sha256" in manifest
    assert "total_plants" in manifest

    db_res = client.get("/v1/sync/db")
    assert db_res.status_code == 200
    assert len(db_res.content) > 100000 # ~600KB SQLite binary
