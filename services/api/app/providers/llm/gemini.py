import os
from typing import Any, Optional
from google import genai
from google.genai import types

from ..base import Provider, RateLimited, BadResponse, ProviderError
from ...domain.schemas import AIPredictionResponse, ResearchResponse

class GeminiLLMProvider(Provider):
    name = "gemini"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout_s: float = 12.0, priority: int = 1):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        self.timeout_s = timeout_s
        self.priority = priority

    async def call(self, request: Any) -> Any:
        """
        request should be a dict:
          {"task": "predict", "composition_tags": str, "composition_text": str}
          or
          {"task": "research_compounds", "scientific_name": str}
          or
          {"task": "research_synthesis", "prompt": str}
        """
        if not self.api_key:
            raise ProviderError("GEMINI_API_KEY is not configured")

        client = genai.Client(api_key=self.api_key)
        task = request.get("task")

        try:
            if task == "predict":
                tags = request.get("composition_tags", "None")
                text = request.get("composition_text", "None")
                prompt = (
                    "You are an expert phytochemist and pharmacologist.\n"
                    "Based on the following chemical composition of a medicinal plant, "
                    "predict its most likely therapeutic properties (biological activities).\n\n"
                    f"Composition Tags: {tags}\n"
                    f"Detailed Composition: {text}\n"
                )
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AIPredictionResponse,
                        temperature=0.2,
                    ),
                )
                return AIPredictionResponse.model_validate_json(response.text)

            elif task == "research_compounds":
                scientific_name = request.get("scientific_name", "")
                prompt = (
                    f"You are an expert botanical researcher. I have identified a plant: {scientific_name}.\n"
                    "Identify its primary active chemical compounds (e.g., specific alkaloids, terpenes, flavonoids, etc.).\n"
                    "Return ONLY a JSON list of these compounds under key 'researched_compounds'."
                )
                from pydantic import BaseModel
                class CompoundList(BaseModel):
                    researched_compounds: list[str]

                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=CompoundList,
                        temperature=0.1,
                    ),
                )
                data = CompoundList.model_validate_json(response.text)
                return data.researched_compounds

            elif task == "research_synthesis":
                prompt = request.get("prompt", "")
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=ResearchResponse,
                        temperature=0.2,
                    ),
                )
                return ResearchResponse.model_validate_json(response.text)

            else:
                raise BadResponse(f"Unknown task type: {task}")

        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str:
                raise RateLimited(retry_after=60.0, message="Gemini quota exhausted") from e
            raise ProviderError(f"Gemini API failure: {str(e)}") from e
