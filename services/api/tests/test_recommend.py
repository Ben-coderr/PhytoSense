from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_needs_catalog():
    res = client.get("/v1/recommend/needs")
    assert res.status_code == 200
    data = res.json()
    assert "needs" in data
    assert len(data["needs"]) > 0

    keys = [item["key"] for item in data["needs"]]
    assert "skin.acne" in keys
    assert "skin.dry_skin" in keys
    assert "pain.joint_muscle" in keys

def test_recommend_skin_acne():
    payload = {
        "needs": ["skin.acne"],
        "route": "topical",
        "limit": 5
    }
    res = client.post("/v1/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert len(data["results"]) > 0

    top_plant = data["results"][0]
    assert top_plant["score"] > 0
    assert "score_breakdown" in top_plant
    assert "matched_activities" in top_plant
    # Check that matched activities include antibacterial or anti-inflammatory
    assert any(act in ["antibactérien", "anti-inflammatoire", "antimicrobien"] for act in top_plant["matched_activities"])

def test_recommend_safety_pregnancy_exclusion():
    # Scenario 1: Without pregnancy flag
    res_normal = client.post("/v1/recommend", json={
        "needs": ["pain.joint_muscle"],
        "profile": {"pregnant": False},
        "limit": 20
    })
    data_normal = res_normal.json()

    # Scenario 2: With pregnancy flag
    res_pregnant = client.post("/v1/recommend", json={
        "needs": ["pain.joint_muscle"],
        "profile": {"pregnant": True},
        "limit": 20
    })
    data_pregnant = res_pregnant.json()

    # The number of safety exclusions must increase when pregnancy is flagged
    assert data_pregnant["excluded_for_safety"] > data_normal["excluded_for_safety"]

    # Verify no returned plant has a pregnancy_avoid contraindication
    for plant in data_pregnant["results"]:
        for banner in plant.get("safety_banners", []):
            assert banner["flag"] != "pregnancy_avoid"

def test_recommend_safety_allergy_exclusion():
    res_allergy = client.post("/v1/recommend", json={
        "needs": ["skin.acne"],
        "profile": {"allergy_families": ["Asteraceae"]},
        "limit": 20
    })
    data_allergy = res_allergy.json()

    # Verify no Asteraceae plants appear in results
    for plant in data_allergy["results"]:
        assert "asteraceae" not in plant["family"].lower()
