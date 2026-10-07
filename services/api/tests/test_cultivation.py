import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.services.cultivation_service import trapezoid

client = TestClient(app)

def test_trapezoid_function():
    # Trapezoid: a=0, b=10, c=20, d=30
    assert trapezoid(-5, 0, 10, 20, 30) == 0.0
    assert trapezoid(35, 0, 10, 20, 30) == 0.0
    assert trapezoid(15, 0, 10, 20, 30) == 1.0
    assert trapezoid(5, 0, 10, 20, 30) == 0.5
    assert trapezoid(25, 0, 10, 20, 30) == 0.5

def test_cultivation_crops_endpoint():
    res = client.get("/v1/cultivation/crops")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5
    crop_keys = [c["key"] for c in data]
    assert "thymus_vulgaris" in crop_keys
    assert "rosmarinus_officinalis" in crop_keys

def test_suitability_endpoint_algiers():
    # Coordinates for Algiers (36.75, 3.05)
    payload = {
        "lat": 36.75,
        "lon": 3.05,
        "scientific_name": "Thymus vulgaris",
        "soil_ph": 7.4
    }
    res = client.post("/v1/cultivation/suitability", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "suitability_score" in data
    assert "suitability_percent" in data
    assert "category" in data
    assert "limiting_factor" in data
    assert "mitigation_tip" in data["limiting_factor"]
    assert 0.0 <= data["suitability_score"] <= 1.0

def test_cultivation_calendar_endpoint():
    res = client.get("/v1/cultivation/calendar?lat=36.75&lon=3.05&scientific_name=Rosmarinus")
    assert res.status_code == 200
    data = res.json()
    assert "current_month" in data
    assert "calendar_grid" in data
    assert len(data["calendar_grid"]) == 12
    assert "sowing_months" in data
    assert "harvest_months" in data

def test_cultivation_irrigation_endpoint():
    res = client.get("/v1/cultivation/irrigation?lat=35.69&lon=-0.63&scientific_name=Lavandula") # Oran
    assert res.status_code == 200
    data = res.json()
    assert "crop_coefficient_kc" in data
    assert "daily_plan" in data
    assert len(data["daily_plan"]) >= 1
    assert "weekly_total_litres_m2" in data
    first_day = data["daily_plan"][0]
    assert "water_need_litres_per_m2" in first_day
    assert "recommendation" in first_day
