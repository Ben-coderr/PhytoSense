from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ...services.research_service import conduct_deep_research

router = APIRouter(tags=["research"])

class ResearchRequest(BaseModel):
    scientific_name: str

@router.post("/research")
async def research_plant(req: ResearchRequest):
    try:
        res = await conduct_deep_research(req.scientific_name)
        data = res["data"]
        return {
            "scientific_name": data.scientific_name,
            "region": data.region,
            "researched_compounds": data.researched_compounds,
            "similar_local_plants": [
                {
                    "name": sim.name,
                    "shared_compounds": sim.shared_compounds,
                    "match_reason": sim.match_reason
                }
                for sim in data.similar_local_plants
            ],
            "predicted_activities": data.predicted_activities,
            "meta": res["meta"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deep research failed: {str(e)}")
