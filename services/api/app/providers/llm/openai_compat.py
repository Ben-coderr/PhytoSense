import json
import logging
import re
from typing import Any, Optional
import httpx

from ..base import Provider, RateLimited, BadResponse, ProviderError
from ...domain.schemas import AIPredictionResponse, ResearchResponse, SimilarPlant

logger = logging.getLogger("phytosense.providers.openai_compat")

def clean_json_text(text: str) -> str:
    """Strips markdown code fences (```json ... ```) from LLM responses."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

class OpenAICompatLLM(Provider):
    """
    Generic adapter for OpenAI-compatible REST APIs.
    Powers Groq, Cerebras, OpenRouter, Mistral, and self-hosted Ollama.
    """
    def __init__(
        self,
        name: str,
        base_url: str,
        api_key: Optional[str] = None,
        model: str = "llama-3.3-70b-versatile",
        timeout_s: float = 15.0,
        priority: int = 20,
    ):
        self.name = name
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout_s = timeout_s
        self.priority = priority

    async def call(self, request: Any) -> Any:
        if not self.api_key:
            raise ProviderError(f"{self.name} API key is not configured")

        task = request.get("task")
        system_msg, user_msg = self._build_prompts(task, request)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        # OpenRouter optional identification headers
        if "openrouter" in self.base_url:
            headers["HTTP-Referer"] = "https://phytosense.app"
            headers["X-Title"] = "PhytoSense Botanical AI"

        async with httpx.AsyncClient(timeout=self.timeout_s) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers=headers,
                )
            except httpx.TimeoutException as e:
                raise TimeoutError(f"{self.name} request timed out after {self.timeout_s}s") from e
            except httpx.HTTPError as e:
                raise ProviderError(f"{self.name} HTTP connection error: {str(e)}") from e

        if response.status_code == 429:
            retry_after = response.headers.get("retry-after")
            raise RateLimited(
                retry_after=float(retry_after) if retry_after and retry_after.isdigit() else 30.0,
                message=f"{self.name} rate limited (429)",
            )

        if response.status_code >= 500:
            raise ProviderError(f"{self.name} server error {response.status_code}")

        if response.status_code != 200:
            raise BadResponse(f"{self.name} returned error {response.status_code}: {response.text}")

        res_json = response.json()
        try:
            raw_text = res_json["choices"][0]["message"]["content"]
            cleaned = clean_json_text(raw_text)
            parsed_data = json.loads(cleaned)
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            raise BadResponse(f"{self.name} returned unparseable JSON: {str(e)}") from e

        return self._format_output(task, parsed_data, request)

    def _build_prompts(self, task: str, request: dict) -> tuple[str, str]:
        if task == "predict":
            system_msg = (
                "You are an expert phytochemist and pharmacologist. "
                "Analyze the provided plant chemical composition and return a JSON object with: "
                "'predicted_activities' (list of strings) and 'reasoning' (a clear scientific paragraph). "
                "Output ONLY valid JSON."
            )
            tags = request.get("composition_tags", "None")
            text = request.get("composition_text", "None")
            user_msg = f"Composition Tags: {tags}\nDetailed Composition: {text}"
            return system_msg, user_msg

        elif task == "research_compounds":
            system_msg = (
                "You are an expert botanical researcher. "
                "Identify the primary active chemical compounds (alkaloids, flavonoids, terpenes, etc.) "
                "of the specified plant. Return a JSON object with key 'researched_compounds' (list of strings)."
            )
            sci_name = request.get("scientific_name", "")
            user_msg = f"Plant: {sci_name}"
            return system_msg, user_msg

        elif task == "research_synthesis":
            system_msg = (
                "You are an expert pharmacognosist. Synthesize the pharmacological relationship between the "
                "unknown plant and similar local plants. Return a JSON object with: 'scientific_name', "
                "'region', 'researched_compounds' (list), 'similar_local_plants' (list of {name, shared_compounds, match_reason}), "
                "and 'predicted_activities' (list)."
            )
            user_msg = request.get("prompt", "")
            return system_msg, user_msg

        return "You are an AI assistant. Return JSON.", "Provide plant information in JSON."

    def _format_output(self, task: str, parsed: dict, request: dict) -> Any:
        if task == "predict":
            return AIPredictionResponse(
                predicted_activities=parsed.get("predicted_activities", []),
                reasoning=parsed.get("reasoning", "Hypothèse pharmacologique déduite de la composition chimique."),
            )
        elif task == "research_compounds":
            return parsed.get("researched_compounds", [])
        elif task == "research_synthesis":
            similar = []
            for s in parsed.get("similar_local_plants", []):
                similar.append(SimilarPlant(
                    name=s.get("name", "Local species"),
                    shared_compounds=s.get("shared_compounds", []),
                    match_reason=s.get("match_reason", "Partage de composés chimiques biosimilaires."),
                ))
            return ResearchResponse(
                scientific_name=parsed.get("scientific_name", request.get("scientific_name", "Specimen")),
                region=parsed.get("region", "Région inconnue"),
                researched_compounds=parsed.get("researched_compounds", []),
                similar_local_plants=similar,
                predicted_activities=parsed.get("predicted_activities", []),
            )
        return parsed
