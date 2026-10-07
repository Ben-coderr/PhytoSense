import json
import logging
from pathlib import Path
from typing import Dict, Any

from ..providers.registry import llm_router
from ..domain.schemas import ResearchResponse, SimilarPlant

logger = logging.getLogger("phytosense.research")

def _load_local_plants_json() -> list[dict]:
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    path = project_root / "data" / "curated" / "plants.json"
    if not path.exists():
        path = project_root / "plants.json"
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

async def conduct_deep_research(scientific_name: str) -> Dict[str, Any]:
    """
    Two-tier Deep Research:
    1. Extract active chemical compounds of unknown plant via LLM.
    2. Cross-reference against local Algerian dataset to find top 5 chemically similar plants.
    3. Synthesize pharmacological hypothesis.
    """
    # Step 1: Extract compounds
    step1_res = await llm_router.run({
        "task": "research_compounds",
        "scientific_name": scientific_name
    })
    compounds: list[str] = step1_res.value

    # Step 2: Cross-reference against local DB
    plants_db = _load_local_plants_json()
    scored_plants = []
    compounds_lower = [c.lower() for c in compounds]

    for plant in plants_db:
        score = 0
        shared = []
        plant_comp = str(plant.get("composition", "")).lower()
        plant_tags = str(plant.get("composition_tags", "")).lower()

        for c in compounds_lower:
            if c in plant_comp or c in plant_tags:
                score += 1
                shared.append(c)

        if score > 0:
            scored_plants.append({
                "scientific_name": plant.get("scientific_name"),
                "composition": plant.get("composition"),
                "biological_activity": plant.get("biological_activity"),
                "score": score,
                "shared": shared
            })

    scored_plants.sort(key=lambda x: x["score"], reverse=True)
    top_matches = scored_plants[:5]

    # Step 3: Pharmacological synthesis
    prompt = (
        f"You are an expert pharmacognosist. I have a plant: {scientific_name}.\n"
        f"Its active compounds are: {', '.join(compounds)}.\n\n"
        "Here are the top most chemically similar plants from my local Algerian database:\n"
        f"{json.dumps(top_matches, indent=2, ensure_ascii=False)}\n\n"
        f"Based on the known therapeutic properties of these similar plants and your knowledge of the compounds, "
        f"predict the therapeutic properties of {scientific_name} and explain the similarity matches.\n"
    )

    step3_res = await llm_router.run({
        "task": "research_synthesis",
        "prompt": prompt,
        "scientific_name": scientific_name
    })

    result: ResearchResponse = step3_res.value
    result.scientific_name = scientific_name
    result.researched_compounds = compounds

    return {
        "data": result,
        "meta": {
            "provider": step3_res.provider,
            "degraded": step3_res.degraded,
            "latency_ms": step3_res.latency_ms
        }
    }
