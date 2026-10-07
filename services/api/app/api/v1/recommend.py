from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from ...services.recommend_service import recommend_plants_for_need, load_ontology

router = APIRouter(prefix="/recommend", tags=["recommend"])

class Profile(BaseModel):
    pregnant: bool = False
    child: bool = False
    allergy_families: List[str] = Field(default_factory=list)

class RecommendRequest(BaseModel):
    needs: List[str] = Field(..., description="List of need keys, e.g. ['skin.acne']")
    profile: Optional[Profile] = None
    route: Optional[str] = Field(None, description="'topical', 'oral', or 'any'")
    limit: int = 5
    lang: str = "fr"

@router.get("/needs")
def list_available_needs():
    """Returns the full catalog of supported health/care needs with multilingual titles."""
    ontology = load_ontology()
    result = []
    for key, data in ontology.items():
        result.append({
            "key": key,
            "category": data.get("category"),
            "label_en": data.get("label_en"),
            "label_fr": data.get("label_fr"),
            "label_ar": data.get("label_ar"),
            "route_preference": data.get("route_preference")
        })
    return {"needs": result}

@router.post("")
def recommend_plants(req: RecommendRequest):
    """
    Ranks plants matching user symptoms/needs.
    Applies multi-criteria biological activity scoring and strictly enforces
    safety contraindications (e.g. pregnancy, Asteraceae allergies).
    """
    profile_dict = req.profile.model_dump() if req.profile else {}
    outcome = recommend_plants_for_need(
        needs=req.needs,
        profile=profile_dict,
        route=req.route,
        limit=req.limit,
        lang=req.lang
    )

    return {
        "results": outcome["results"],
        "excluded_for_safety": outcome["excluded_for_safety"],
        "total_matches": outcome["total_matches"]
    }
