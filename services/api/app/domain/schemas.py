from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

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
    model_config = ConfigDict(from_attributes=True)

class PlantSearchResponse(PlantResponse):
    similarity_score: float

class AIPredictionResponse(BaseModel):
    predicted_activities: List[str] = Field(description="Predicted biological/therapeutic activities.")
    reasoning: str = Field(description="Scientific pharmacology justification.")

class SimilarPlant(BaseModel):
    name: str
    shared_compounds: List[str]
    match_reason: str

class ResearchResponse(BaseModel):
    scientific_name: str
    region: str = "Unknown"
    researched_compounds: List[str]
    similar_local_plants: List[SimilarPlant]
    predicted_activities: List[str]

class MetaResponse(BaseModel):
    provider: str
    degraded: bool = False
    cached: bool = False
    latency_ms: Optional[float] = None
