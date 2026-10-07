from fastapi.testclient import TestClient
from services.api.app.main import app

client = TestClient(app)

def test_get_symptoms_list():
    res = client.get("/v1/diagnose/symptoms")
    assert res.status_code == 200
    data = res.json()
    assert "symptoms" in data
    assert len(data["symptoms"]) >= 10
    ids = [s["id"] for s in data["symptoms"]]
    assert "white_spots" in ids
    assert "sticky_leaves" in ids
    assert "pale_leaves" in ids

def test_diagnose_powdery_mildew():
    payload = {
        "symptoms": ["white_spots", "powdery_coating"],
        "plant_name": "Rosmarinus officinalis"
    }
    res = client.post("/v1/diagnose", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["diagnoses_count"] >= 1
    top_match = data["results"][0]
    assert top_match["disease_id"] == "powdery_mildew"
    assert len(top_match["organic_treatment"]) > 0
    assert "prevention" in top_match

def test_diagnose_aphids_pest():
    payload = {
        "symptoms": ["sticky_leaves", "tiny_insects"],
        "plant_name": "Mentha piperita"
    }
    res = client.post("/v1/diagnose", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert any(d["disease_id"] == "aphids" for d in data["results"])
    aphid_match = next(d for d in data["results"] if d["disease_id"] == "aphids")
    assert aphid_match["category"] == "pest"
    assert any("savon noir" in t.lower() for t in aphid_match["organic_treatment"])
