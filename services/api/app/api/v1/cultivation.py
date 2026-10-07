from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from ...services.cultivation_service import cultivation_service

router = APIRouter(prefix="/cultivation", tags=["cultivation"])

class SuitabilityRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")
    plant_id: Optional[int] = None
    scientific_name: Optional[str] = None
    soil_ph: Optional[float] = Field(7.2, ge=3.5, le=11.0, description="Soil pH value")

@router.post("/suitability")
async def get_suitability(req: SuitabilityRequest):
    try:
        return await cultivation_service.evaluate_suitability(
            lat=req.lat,
            lon=req.lon,
            plant_id=req.plant_id,
            scientific_name=req.scientific_name,
            soil_ph=req.soil_ph or 7.2
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate suitability: {str(e)}")

@router.get("/calendar")
async def get_calendar(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    plant_id: Optional[int] = Query(None),
    scientific_name: Optional[str] = Query(None)
):
    try:
        return await cultivation_service.get_planting_calendar(
            lat=lat,
            lon=lon,
            plant_id=plant_id,
            scientific_name=scientific_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate calendar: {str(e)}")

@router.get("/irrigation")
async def get_irrigation(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    plant_id: Optional[int] = Query(None),
    scientific_name: Optional[str] = Query(None)
):
    try:
        return await cultivation_service.get_irrigation_plan(
            lat=lat,
            lon=lon,
            plant_id=plant_id,
            scientific_name=scientific_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate irrigation plan: {str(e)}")

@router.get("/crops")
def list_crops():
    crops = cultivation_service.crop_params.get("crops", {})
    return [
        {
            "key": k,
            "names": v.get("names", [k]),
            "kc_mid": v.get("kc_mid"),
            "harvest_months": v.get("harvest_months")
        }
        for k, v in crops.items()
    ]
