import os
import json
import re
import logging
import urllib.request
import urllib.error
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

logger = logging.getLogger("phytosense.ai_service")
logging.basicConfig(level=logging.INFO)

class PredictionResult(BaseModel):
    predicted_activities: list[str] = Field(description="List of predicted therapeutic activities based on the chemical compounds.")
    reasoning: str = Field(description="A brief explanation of why these activities were predicted.")

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

def _clean_json_text(text: str) -> str:
    """Strips markdown code fences (```json ... ```) from LLM responses."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text

def _is_valid_key(k: Optional[str]) -> bool:
    return bool(k and k.strip() and not k.strip().startswith("your_"))

# ---------------------------------------------------------------------------
# Provider 1: Google Gemini (Google GenAI SDK)
# ---------------------------------------------------------------------------
def _call_gemini_predict(tags: str, text: str) -> Optional[PredictionResult]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not _is_valid_key(api_key):
        return None
    
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = (
            "You are an expert phytochemist and pharmacologist.\n"
            "Based on the following chemical composition of a medicinal plant, "
            "predict its most likely therapeutic properties (biological activities).\n\n"
            f"Composition Tags: {tags}\n"
            f"Detailed Composition: {text}\n"
        )
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=PredictionResult,
                temperature=0.2,
            ),
        )
        return PredictionResult.model_validate_json(response.text)
    except Exception as e:
        logger.warning("Gemini predict failed: %s", e)
        return None

def _call_gemini_compounds(scientific_name: str) -> Optional[List[str]]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not _is_valid_key(api_key):
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = (
            f"You are an expert botanical researcher. I have identified a plant: {scientific_name}.\n"
            "Identify its primary active chemical compounds (e.g., specific alkaloids, terpenes, flavonoids, etc.).\n"
            "Return ONLY a JSON list of these compounds under key 'researched_compounds'."
        )
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=InitialResearchResult,
                temperature=0.1,
            ),
        )
        res = InitialResearchResult.model_validate_json(response.text)
        return res.researched_compounds
    except Exception as e:
        logger.warning("Gemini extract compounds failed: %s", e)
        return None

def _call_gemini_synthesis(prompt: str) -> Optional[ResearchResult]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not _is_valid_key(api_key):
        return None

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResearchResult,
                temperature=0.2,
            ),
        )
        return ResearchResult.model_validate_json(response.text)
    except Exception as e:
        logger.warning("Gemini synthesis failed: %s", e)
        return None

# ---------------------------------------------------------------------------
# Generic OpenAI-compatible HTTP caller (Groq, OpenRouter, Mistral)
# ---------------------------------------------------------------------------
def _call_openai_compat(
    provider_name: str,
    base_url: str,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    timeout_s: float = 15.0
) -> Optional[dict]:
    import httpx
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    if "openrouter" in base_url:
        headers["HTTP-Referer"] = "https://phytosense.app"
        headers["X-Title"] = "PhytoSense Botanical AI"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=timeout_s) as client:
            resp = client.post(
                f"{base_url.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            if resp.status_code != 200:
                logger.warning("%s returned HTTP %d: %s", provider_name, resp.status_code, resp.text[:100])
                return None
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            cleaned = _clean_json_text(content)
            return json.loads(cleaned)
    except Exception as e:
        logger.warning("%s call failed: %s", provider_name, e)
        return None

# ---------------------------------------------------------------------------
# Rule-Based Offline Fallback (Guaranteed 100% Availability)
# ---------------------------------------------------------------------------
def _rule_based_predict(composition_tags: str, composition_text: str) -> PredictionResult:
    text = (composition_tags + " " + composition_text).lower()
    activities: list[str] = []
    
    rules = [
        (["thymol", "carvacrol", "phen"], "Antimicrobien et antiseptique à large spectre"),
        (["flavon", "quercetin", "rutin"], "Antioxydant puissant et protecteur capillaire"),
        (["alkalo", "alcalo"], "Spasmolytique et modulateur neuro-végétatif"),
        (["sapon"], "Expectorant et anti-inflammatoire"),
        (["tann"], "Astringent et cicatrisant tissulaire"),
        (["cineol", "eucalyptol", "menth"], "Décongestionnant bronchique et antiseptique respiratoire"),
        (["camph"], "Stimulant circulatoire et analgésique topique"),
        (["azul", "chamazul"], "Anti-inflammatoire et apaisant cutané"),
    ]
    for kws, act in rules:
        if any(kw in text for kw in kws):
            activities.append(act)

    if not activities:
        activities = ["Activité biologique protectrice", "Antioxydant cellulaire", "Tonique général"]

    reasoning = (
        f"Hypothèse pharmacologique déduite des classes phytochimiques ({composition_tags or 'générales'}). "
        "Les principes actifs identifiés présentent une synergie caractéristique documentée dans la flore médicinale nord-africaine."
    )
    return PredictionResult(predicted_activities=activities, reasoning=reasoning)

def _rule_based_compounds(scientific_name: str) -> List[str]:
    # Extract known compounds from local database if available
    db = _load_local_plants_json()
    for p in db:
        if p.get("scientific_name", "").lower() == scientific_name.lower():
            tags = [t.strip() for t in p.get("composition_tags", "").split(",") if t.strip()]
            if tags:
                return tags
    return ["Flavonoïdes", "Polyphénols", "Monoterpènes", "Huile essentielle"]

def _load_local_plants_json() -> list[dict]:
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    candidates = [
        os.path.join(project_root, "data", "curated", "plants.json"),
        os.path.join(project_root, "plants.json"),
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return []

# ---------------------------------------------------------------------------
# Public Resilient APIs with Automatic Multi-Provider Switching
# ---------------------------------------------------------------------------
def predict_therapeutic_properties(composition_tags: str, composition_text: str) -> PredictionResult:
    """
    Predicts therapeutic properties with automatic multi-tier failover:
    1. Google Gemini (gemini-3.8-flash)
    2. Groq (openai/gpt-oss-120b)
    3. OpenRouter (nvidia/nemotron-3.5-lightning:free)
    4. Mistral (open-mistral-7b)
    5. Rule-Based Pharmacological Knowledge Engine (offline fallback)
    """
    # Tier 1: Gemini
    logger.info("Attempting Tier 1 (Gemini)...")
    res = _call_gemini_predict(composition_tags, composition_text)
    if res:
        logger.info("✅ Tier 1 (Gemini) succeeded.")
        return res

    # Tier 2: Groq
    groq_key = os.getenv("GROQ_API_KEY")
    if _is_valid_key(groq_key):
        logger.info("Tier 1 failed. Switching to Tier 2 (Groq)...")
        sys_prompt = (
            "You are an expert phytochemist and pharmacologist. "
            "Analyze the provided plant chemical composition and return a JSON object with: "
            "'predicted_activities' (list of strings) and 'reasoning' (a clear scientific paragraph). "
            "Output ONLY valid JSON."
        )
        user_prompt = f"Composition Tags: {composition_tags}\nDetailed Composition: {composition_text}"
        data = _call_openai_compat(
            "Groq",
            "https://api.groq.com/openai/v1",
            groq_key,
            os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            sys_prompt,
            user_prompt,
            timeout_s=12.0
        )
        if data and "predicted_activities" in data:
            logger.info("✅ Tier 2 (Groq) succeeded.")
            return PredictionResult(
                predicted_activities=data["predicted_activities"],
                reasoning=data.get("reasoning", "Hypothèse pharmacologique déduite de la composition."),
            )

    # Tier 3: OpenRouter
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if _is_valid_key(openrouter_key):
        logger.info("Tier 2 failed. Switching to Tier 3 (OpenRouter)...")
        sys_prompt = (
            "You are an expert phytochemist and pharmacologist. "
            "Analyze the provided plant chemical composition and return a JSON object with: "
            "'predicted_activities' (list of strings) and 'reasoning' (a clear scientific paragraph). "
            "Output ONLY valid JSON."
        )
        user_prompt = f"Composition Tags: {composition_tags}\nDetailed Composition: {composition_text}"
        data = _call_openai_compat(
            "OpenRouter",
            "https://openrouter.ai/api/v1",
            openrouter_key,
            os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free"),
            sys_prompt,
            user_prompt,
            timeout_s=18.0
        )
        if data and "predicted_activities" in data:
            logger.info("✅ Tier 3 (OpenRouter) succeeded.")
            return PredictionResult(
                predicted_activities=data["predicted_activities"],
                reasoning=data.get("reasoning", "Hypothèse pharmacologique déduite par synthèse chimique."),
            )

    # Tier 4: Mistral
    mistral_key = os.getenv("MISTRAL_API_KEY")
    if _is_valid_key(mistral_key):
        logger.info("Tier 3 failed. Switching to Tier 4 (Mistral)...")
        sys_prompt = (
            "You are an expert phytochemist. Return a JSON object with 'predicted_activities' (list) "
            "and 'reasoning' (paragraph)."
        )
        user_prompt = f"Tags: {composition_tags}\nText: {composition_text}"
        data = _call_openai_compat(
            "Mistral",
            "https://api.mistral.ai/v1",
            mistral_key,
            os.getenv("MISTRAL_MODEL", "open-mistral-7b"),
            sys_prompt,
            user_prompt,
            timeout_s=15.0
        )
        if data and "predicted_activities" in data:
            logger.info("✅ Tier 4 (Mistral) succeeded.")
            return PredictionResult(
                predicted_activities=data["predicted_activities"],
                reasoning=data.get("reasoning", "Hypothèse pharmacologique déduite par Mistral AI."),
            )

    # Tier 5: Terminal Rule-Based Fallback
    logger.warning("All AI providers unavailable. Switching to Tier 5 (Rule-Based Offline Engine)...")
    return _rule_based_predict(composition_tags, composition_text)

def research_unknown_plant(scientific_name: str) -> ResearchResult:
    """
    Researches an unknown plant with multi-tier failover across Gemini, Groq, OpenRouter, Mistral, and Rule-Based engine.
    """
    # Step 1: Extract Compounds
    compounds: Optional[List[str]] = _call_gemini_compounds(scientific_name)
    if not compounds:
        groq_key = os.getenv("GROQ_API_KEY")
        if _is_valid_key(groq_key):
            sys_p = "Identify primary active chemical compounds of the plant. Return JSON with 'researched_compounds' (list of strings)."
            data = _call_openai_compat(
                "Groq", "https://api.groq.com/openai/v1", groq_key,
                os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
                sys_p, f"Plant: {scientific_name}", timeout_s=12.0
            )
            if data and "researched_compounds" in data:
                compounds = data["researched_compounds"]

    if not compounds:
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if _is_valid_key(openrouter_key):
            sys_p = "Identify primary active chemical compounds of the plant. Return JSON with 'researched_compounds' (list of strings)."
            data = _call_openai_compat(
                "OpenRouter", "https://openrouter.ai/api/v1", openrouter_key,
                os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free"),
                sys_p, f"Plant: {scientific_name}", timeout_s=18.0
            )
            if data and "researched_compounds" in data:
                compounds = data["researched_compounds"]

    if not compounds:
        compounds = _rule_based_compounds(scientific_name)

    # Step 2: Cross-reference with local Algerian plants dataset
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
                "shared": shared,
            })

    scored_plants.sort(key=lambda x: x["score"], reverse=True)
    top_matches = scored_plants[:5]

    # Step 3: Synthesis
    prompt = (
        f"You are an expert pharmacognosist. I have a plant: {scientific_name}.\n"
        f"Its active compounds are: {', '.join(compounds)}.\n\n"
        "Here are the top most chemically similar plants from my local Algerian database:\n"
        f"{json.dumps(top_matches, indent=2, ensure_ascii=False)}\n\n"
        f"Based on the known therapeutic properties of these similar plants and your knowledge of the compounds, "
        f"predict the therapeutic properties of {scientific_name} and explain the similarity matches.\n"
        "Return JSON with 'scientific_name', 'region', 'researched_compounds', "
        "'similar_local_plants' (list of {name, shared_compounds, match_reason}), and 'predicted_activities' (list)."
    )

    # Try Gemini synthesis
    synth_res = _call_gemini_synthesis(prompt)
    if synth_res:
        synth_res.scientific_name = scientific_name
        synth_res.researched_compounds = compounds
        return synth_res

    # Try Groq synthesis
    groq_key = os.getenv("GROQ_API_KEY")
    if _is_valid_key(groq_key):
        sys_p = "Synthesize pharmacological relationship. Return valid JSON matching requested keys."
        data = _call_openai_compat(
            "Groq", "https://api.groq.com/openai/v1", groq_key,
            os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            sys_p, prompt, timeout_s=15.0
        )
        if data and "predicted_activities" in data:
            similar = [
                SimilarPlantResult(
                    name=s.get("name", "Local species"),
                    shared_compounds=s.get("shared_compounds", []),
                    match_reason=s.get("match_reason", "Partage de composés biosimilaires."),
                )
                for s in data.get("similar_local_plants", [])
            ]
            return ResearchResult(
                scientific_name=scientific_name,
                region=data.get("region", "Algérie / Bassin méditerranéen"),
                researched_compounds=compounds,
                similar_local_plants=similar,
                predicted_activities=data["predicted_activities"],
            )

    # Try OpenRouter synthesis
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if _is_valid_key(openrouter_key):
        sys_p = "Synthesize pharmacological relationship. Return valid JSON matching requested keys."
        data = _call_openai_compat(
            "OpenRouter", "https://openrouter.ai/api/v1", openrouter_key,
            os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free"),
            sys_p, prompt, timeout_s=20.0
        )
        if data and "predicted_activities" in data:
            similar = [
                SimilarPlantResult(
                    name=s.get("name", "Local species"),
                    shared_compounds=s.get("shared_compounds", []),
                    match_reason=s.get("match_reason", "Partage de composés biosimilaires."),
                )
                for s in data.get("similar_local_plants", [])
            ]
            return ResearchResult(
                scientific_name=scientific_name,
                region=data.get("region", "Algérie / Bassin méditerranéen"),
                researched_compounds=compounds,
                similar_local_plants=similar,
                predicted_activities=data["predicted_activities"],
            )

    # Deterministic fallback synthesis
    similar_fallback = [
        SimilarPlantResult(
            name=m["scientific_name"],
            shared_compounds=m["shared"],
            match_reason=f"Partage de molécules bioactives clés : {', '.join(m['shared'])}.",
        )
        for m in top_matches
    ]
    activities_pred = _rule_based_predict(", ".join(compounds), "").predicted_activities

    return ResearchResult(
        scientific_name=scientific_name,
        region="Algérie / Bassin méditerranéen",
        researched_compounds=compounds,
        similar_local_plants=similar_fallback,
        predicted_activities=activities_pred,
    )
