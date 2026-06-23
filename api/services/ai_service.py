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
