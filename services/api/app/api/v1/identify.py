import base64
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from rapidfuzz import process, fuzz

from ...db.connection import get_db
from ...db import models
from ...providers.registry import plant_id_router

router = APIRouter(tags=["identify"])

@router.post("/identify")
async def identify_plant(
    request: Request,
    db: Session = Depends(get_db)
):
    content_type = request.headers.get("content-type", "")
    contents: Optional[bytes] = None
    organ: Optional[str] = None

    # 1. Handle JSON base64 payload (Preferred for React Native / Mobile)
    if "application/json" in content_type:
        try:
            body = await request.json()
            b64_str = body.get("image_base64") or body.get("image") or ""
            if "," in b64_str:
                b64_str = b64_str.split(",")[1]
            if not b64_str:
                raise HTTPException(status_code=400, detail="Missing image_base64 in request payload")
            contents = base64.b64decode(b64_str)
            organ = body.get("organ")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 payload: {str(e)}")

    # 2. Handle Multipart Form Data (Web / Curl / Postman)
    else:
        try:
            form = await request.form()
            image_file = form.get("image")
            if not image_file or not hasattr(image_file, "read"):
                raise HTTPException(status_code=400, detail="Missing 'image' file in multipart form data")
            contents = await image_file.read()
            organ = form.get("organ")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse multipart form data: {str(e)}")

    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded image is empty")

    try:
        router_res = await plant_id_router.run({
            "image_bytes": contents,
            "organ": organ
        })
        scientific_names: list[str] = router_res.value
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Identification service error: {str(e)}")

    if not scientific_names:
        raise HTTPException(status_code=404, detail="Could not identify plant from image")

    # Cross-reference against local database
    plants = db.query(models.Plant).all()
    results = []

    for plant in plants:
        if not plant.scientific_name:
            continue
        match_result = process.extractOne(plant.scientific_name, scientific_names, scorer=fuzz.WRatio)
        if match_result:
            _, score, _ = match_result
            if score >= 70.0:
                plant_dict = {col: getattr(plant, col) for col in plant.__table__.columns.keys()}
                plant_dict['similarity_score'] = score
                results.append(plant_dict)

    results.sort(key=lambda x: x['similarity_score'], reverse=True)

    if not results:
        return {
            "found_local": False,
            "scientific_name": scientific_names[0],
            "message": "Plant not found in local catalog. Deep research required.",
            "meta": {
                "provider": router_res.provider,
                "degraded": router_res.degraded,
                "latency_ms": router_res.latency_ms
            }
        }

    return {
        "found_local": True,
        "results": results,
        "meta": {
            "provider": router_res.provider,
            "degraded": router_res.degraded,
            "latency_ms": router_res.latency_ms
        }
    }
