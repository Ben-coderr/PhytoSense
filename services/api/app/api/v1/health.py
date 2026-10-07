from fastapi import APIRouter
from ...providers.registry import plant_id_router, llm_router

router = APIRouter(tags=["health"])

@router.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

@router.get("/health/providers")
def get_providers_health():
    """
    Returns real-time status of all configured provider slots across capabilities:
    circuit breaker state, daily quota usage, EWMA latency, and success rates.
    """
    def serialize_slots(router_inst):
        return [
            {
                "name": slot.provider.name,
                "priority": slot.provider.priority,
                "state": slot.breaker.state,
                "consecutive_fails": slot.breaker.consecutive_fails,
                "quota_used_today": slot.quota.day_count,
                "quota_limit_day": slot.quota.per_day,
                "success_rate_ewma": round(slot.ewma_ok, 3),
                "latency_p50_ms": round(slot.ewma_ms, 1)
            }
            for slot in router_inst.slots
        ]

    return {
        "plant_id": serialize_slots(plant_id_router),
        "llm": serialize_slots(llm_router)
    }
