from typing import List, Dict, Any
from sqlalchemy.orm import Session
from rapidfuzz import process, fuzz
from ..db import models

def search_plants_in_db(q: str, db: Session, threshold: float = 60.0) -> List[Dict[str, Any]]:
    """
    Multilingual fuzzy matching across Latin scientific names, French vernacular, and Arabic names.
    Returns list of matching plants sorted by descending similarity score.
    """
    plants = db.query(models.Plant).all()
    if not plants:
        return []

    results = []
    for plant in plants:
        names_to_check = [
            plant.scientific_name,
            plant.french_name,
            plant.arabic_name
        ]
        valid_names = [name for name in names_to_check if name]
        if not valid_names:
            continue

        match_result = process.extractOne(q, valid_names, scorer=fuzz.WRatio)
        if match_result:
            _, score, _ = match_result
            if score >= threshold:
                plant_dict = {col: getattr(plant, col) for col in plant.__table__.columns.keys()}
                plant_dict['similarity_score'] = score
                results.append(plant_dict)

    results.sort(key=lambda x: x['similarity_score'], reverse=True)
    return results
