import asyncio
from app.providers.base import Provider, RateLimited, ProviderError
from app.providers.breaker import CircuitBreaker
from app.providers.quota import QuotaTracker
from app.providers.router import Slot, ProviderRouter
from app.providers.llm.rule_based import RuleBasedLLMProvider

class FailingProvider(Provider):
    name = "mock_failing"
    priority = 1
    timeout_s = 2.0

    def __init__(self, err_type="error"):
        self.err_type = err_type

    async def call(self, request):
        if self.err_type == "429":
            raise RateLimited(retry_after=5.0)
        raise ProviderError("Simulated API failure")

def test_circuit_breaker_transitions():
    breaker = CircuitBreaker(fail_threshold=3, base_cooldown=10.0)
    assert breaker.state == "closed"
    assert breaker.allow() is True

    # 1st fail (threshold is 3)
    breaker.on_failure()
    assert breaker.state == "closed"
    assert breaker.allow() is True

    # 2nd fail
    breaker.on_failure()
    assert breaker.state == "closed"
    assert breaker.allow() is True

    # 3rd fail -> threshold reached -> Breaker trips OPEN
    breaker.on_failure()
    assert breaker.state == "open"
    assert breaker.allow() is False

    # Simulate success -> closes breaker
    breaker.on_success()
    assert breaker.state == "closed"
    assert breaker.allow() is True

def test_quota_tracker_exhaustion():
    tracker = QuotaTracker(per_minute=2, per_day=5)
    assert tracker.has_budget() is True

    tracker.consume()
    tracker.consume()
    # 2 calls within minute -> minute budget exhausted
    assert tracker.has_budget() is False

def test_router_failover_to_rule_based():
    """
    Ensures that when the primary provider fails (e.g. RateLimited or 500),
    the ProviderRouter seamlessly falls over to the rule_based terminal fallback.
    """
    async def run_scenario():
        failing_p = FailingProvider(err_type="429")
        failing_breaker = CircuitBreaker(fail_threshold=1)
        failing_quota = QuotaTracker()
        slot1 = Slot(provider=failing_p, breaker=failing_breaker, quota=failing_quota)

        fallback_p = RuleBasedLLMProvider()
        fallback_breaker = CircuitBreaker(fail_threshold=999)
        fallback_quota = QuotaTracker()
        slot2 = Slot(provider=fallback_p, breaker=fallback_breaker, quota=fallback_quota)

        router = ProviderRouter(
            capability="llm",
            slots=[slot1, slot2],
            accept=lambda res: res is not None
        )

        req = {
            "task": "predict",
            "composition_tags": "flavonoïde, polyphénol",
            "composition_text": "Extrait aqueux riche en flavonoïdes"
        }

        result = await router.run(req)

        # Must succeed via fallback
        assert result.provider == "rule_based"
        assert result.degraded is True
        assert result.attempts == 2
        assert "Antioxydant majeur" in result.value.predicted_activities
        # The failing provider's breaker must now be OPEN
        assert failing_breaker.state == "open"

    asyncio.run(run_scenario())
