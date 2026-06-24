from typing import Optional
from pydantic import BaseModel

class PlantBase(BaseModel):
    arabic_name: Optional[str] = None
    arabic_notes: Optional[str] = None
    french_name: Optional[str] = None
    french_notes: Optional[str] = None
    scientific_name: Optional[str] = None
    region: Optional[str] = None
    part_used: Optional[str] = None
    composition: Optional[str] = None
    composition_tags: Optional[str] = None
    biological_activity: Optional[str] = None
    activity_tags: Optional[str] = None
    family: Optional[str] = None
    author: Optional[str] = None

class PlantResponse(PlantBase):
    id: int

    class Config:
        from_attributes = True

class PlantSearchResponse(PlantResponse):
    similarity_score: float

class AIPredictionResponse(BaseModel):
    predicted_activities: list[str]
    reasoning: str

class SimilarPlant(BaseModel):
    name: str
    shared_compounds: list[str]
    match_reason: str

class ResearchResponse(BaseModel):
    scientific_name: str
    region: str
    researched_compounds: list[str]
    similar_local_plants: list[SimilarPlant]
    predicted_activities: list[str]

