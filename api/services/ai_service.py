import os
import json
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class PredictionResult(BaseModel):
    predicted_activities: list[str] = Field(description="List of predicted therapeutic activities based on the chemical compounds.")
    reasoning: str = Field(description="A brief explanation of why these activities were predicted.")

def predict_therapeutic_properties(composition_tags: str, composition_text: str) -> PredictionResult:
    """
    Predicts therapeutic properties using the Gemini API based on a plant's composition.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Cannot use AI prediction.")

    client = genai.Client(api_key=api_key)
    
    prompt = (
        "You are an expert phytochemist and pharmacologist.\n"
        "Based on the following chemical composition of a medicinal plant, "
        "predict its most likely therapeutic properties (biological activities). \n\n"
        f"Composition Tags: {composition_tags}\n"
        f"Detailed Composition: {composition_text}\n"
    )
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=PredictionResult,
            temperature=0.2,
        ),
    )
    
    return PredictionResult.model_validate_json(response.text)

class InitialResearchResult(BaseModel):
    researched_compounds: list[str]

class SimilarPlantResult(BaseModel):
    name: str = Field(description="Scientific name of the local plant")
    shared_compounds: list[str] = Field(description="Compounds it shares with the unknown plant")
    match_reason: str = Field(description="Reasoning for why this plant is similar")

class ResearchResult(BaseModel):
    scientific_name: str
    region: str = Field(description="The geographic region where this plant is commonly found")
    researched_compounds: list[str]
    similar_local_plants: list[SimilarPlantResult]
    predicted_activities: list[str]

def research_unknown_plant(scientific_name: str) -> ResearchResult:
    """
    Research an unknown plant by extracting its compounds, cross-referencing against local DB, and predicting properties.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)
    
    # Step 1: Extract compounds (Fast, small prompt)
    prompt1 = (
        f"You are an expert botanical researcher. I have identified a plant: {scientific_name}.\n"
        "Identify its primary active chemical compounds (e.g., specific alkaloids, terpenes, flavonoids, etc.).\n"
        "Return ONLY a JSON list of these compounds."
    )
    
    resp1 = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt1,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=InitialResearchResult,
            temperature=0.1,
        ),
    )
    initial_res = InitialResearchResult.model_validate_json(resp1.text)
    compounds = initial_res.researched_compounds
    
    # Step 2: Locally filter the database for plants that share these compounds (Very fast)
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "plants.json")
    with open(db_path, "r", encoding="utf-8") as f:
        plants_db = json.load(f)
        
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
    top_matches = scored_plants[:5]  # Take top 5 closest matches

    # Step 3: Final analysis and prediction (Fast, small prompt)
    prompt2 = (
        f"You are an expert pharmacognosist. I have a plant: {scientific_name}.\n"
        f"Its active compounds are: {', '.join(compounds)}.\n\n"
        "Here are the top most chemically similar plants from my local database:\n"
        f"{json.dumps(top_matches, indent=2)}\n\n"
        f"Based on the known therapeutic properties of these similar plants and your knowledge of the compounds, "
        f"predict the therapeutic properties of {scientific_name} and explain the similarity matches.\n"
    )

    resp2 = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt2,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ResearchResult,
            temperature=0.2,
        ),
    )
    
    final_res = ResearchResult.model_validate_json(resp2.text)
    # Ensure compounds and scientific name match
    final_res.scientific_name = scientific_name
    final_res.researched_compounds = compounds
    return final_res
