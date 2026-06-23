from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from rapidfuzz import process, fuzz

from .. import models, schemas
from ..db import get_db
from ..services import ai_service, plantnet_service

router = APIRouter(prefix="/api/plants", tags=["plants"])

@router.get("/search", response_model=List[schemas.PlantSearchResponse])
def search_plants(
    q: str = Query(..., min_length=2, description="Search query for plant name"),
    db: Session = Depends(get_db)
):
    plants = db.query(models.Plant).all()
    if not plants:
        raise HTTPException(status_code=404, detail="No plants found in database")

    results = []
    
    # We will search against scientific_name, french_name, and arabic_name
    for plant in plants:
        names_to_check = [
            plant.scientific_name,
            plant.french_name,
            plant.arabic_name
        ]
        
        # Remove None values
        valid_names = [name for name in names_to_check if name]
        
        if not valid_names:
            continue
            
        # Find the best match among the valid names
        match_result = process.extractOne(q, valid_names, scorer=fuzz.WRatio)
        if match_result:
            best_match_str, score, best_match_index = match_result
            
            # Add a threshold to avoid low confidence matches
            if score >= 60.0:
                plant_dict = {k: getattr(plant, k) for k in plant.__table__.columns.keys()}
                plant_dict['similarity_score'] = score
                results.append(plant_dict)
                
    # Sort by score descending
    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    if not results:
        raise HTTPException(status_code=404, detail="No matching plants found")
        
    return results

@router.get("/{plant_id}", response_model=schemas.PlantResponse)
def get_plant(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    return plant

@router.get("/{plant_id}/predict", response_model=schemas.AIPredictionResponse)
def predict_plant_properties(plant_id: int, db: Session = Depends(get_db)):
    plant = db.query(models.Plant).filter(models.Plant.id == plant_id).first()
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
        
    composition_tags = plant.composition_tags or "None"
    composition_text = plant.composition or "None"
    
    try:
        prediction = ai_service.predict_therapeutic_properties(
            composition_tags=composition_tags,
            composition_text=composition_text
        )
        return schemas.AIPredictionResponse(
            predicted_activities=prediction.predicted_activities,
            reasoning=prediction.reasoning
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI prediction failed: {str(e)}")

@router.post("/identify", response_model=List[schemas.PlantSearchResponse])
async def identify_plant(image: UploadFile = File(...), db: Session = Depends(get_db)):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    try:
        contents = await image.read()
        scientific_names = await plantnet_service.identify_plant(contents)
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pl@ntNet API error: {str(e)}")
        
    if not scientific_names:
        raise HTTPException(status_code=404, detail="Could not identify any plant from the image")
        
    # We will search our DB for the identified scientific names
    plants = db.query(models.Plant).all()
    results = []
    
    # Try to find the first good match for the identified names in our DB
    for plant in plants:
        if not plant.scientific_name:
            continue
            
        match_result = process.extractOne(plant.scientific_name, scientific_names, scorer=fuzz.WRatio)
        if match_result:
            _, score, _ = match_result
            if score >= 70.0:
                plant_dict = {k: getattr(plant, k) for k in plant.__table__.columns.keys()}
                plant_dict['similarity_score'] = score
                results.append(plant_dict)
                
    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    
    if not results:
        raise HTTPException(status_code=404, detail=f"Identified as {scientific_names[0]} but not found in our local database.")
        
    return results

