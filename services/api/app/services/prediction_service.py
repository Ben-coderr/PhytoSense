from ..providers.registry import llm_router
from ..domain.schemas import AIPredictionResponse

async def predict_plant_properties(composition_tags: str, composition_text: str) -> dict:
    """
    Executes therapeutic property prediction via the resilient LLM router.
    Falls back gracefully to rule-based offline prediction if needed.
    """
    req = {
        "task": "predict",
        "composition_tags": composition_tags,
        "composition_text": composition_text,
    }
    result = await llm_router.run(req)

    return {
        "prediction": result.value,
        "meta": {
            "provider": result.provider,
            "degraded": result.degraded,
            "attempts": result.attempts,
            "latency_ms": result.latency_ms
        }
    }
