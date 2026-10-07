from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ...db.connection import get_db
from ...db import models
from ...domain.schemas import PlantResponse, PlantSearchResponse, AIPredictionResponse
from ...services.search_service import search_plants_in_db
from ...services.prediction_service import predict_plant_properties

router = APIRouter(prefix="/plants", tags=["plants"])

@router.get("")
@router.get("/")
def list_plants(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    items = db.query(models.Plant).offset(offset).limit(limit).all()
    total = db.query(models.Plant).count()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": p.id,
                "scientific_name": p.scientific_name,
                "accepted_name": p.scientific_name,
                "french_name": p.french_name,
                "arabic_name": p.arabic_name,
                "family": p.family,
                "region": p.region,
                "part_used": p.part_used,
            }
            for p in items
        ]
    }


@router.get("/search")

def search_plants(
    q: str = Query(..., min_length=2, description="Plant name query in Latin, French, or Arabic"),
    db: Session = Depends(get_db)
):
    results = search_plants_in_db(q, db)
    if not results:
        return {
            "found_local": False,
            "scientific_name": q,
            "message": "Plant not found in local database. Deep research required."
        }
    return {
        "found_local": True,
        "results": results
    }

@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant_by_id(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@router.get("/{plant_id}/predict")
async def predict_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")

    composition_tags = plant.composition_tags or "None"
    composition_text = plant.composition or "None"

    try:
        res = await predict_plant_properties(composition_tags, composition_text)
        prediction: AIPredictionResponse = res["prediction"]
        return {
            "predicted_activities": prediction.predicted_activities,
            "reasoning": prediction.reasoning,
            "meta": res["meta"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
