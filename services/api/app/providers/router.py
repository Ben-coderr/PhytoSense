import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Any, Callable, Optional
import httpx

from .base import Provider, ProviderError, RateLimited, BadResponse, AllProvidersFailed
from .breaker import CircuitBreaker
from .quota import QuotaTracker

logger = logging.getLogger("phytosense.router")

@dataclass
class Slot:
    provider: Provider
    breaker: CircuitBreaker
    quota: QuotaTracker
    ewma_ok: float = 1.0       # Exponentially weighted moving average of success rate (0..1)
    ewma_ms: float = 1000.0    # Exponentially weighted moving average of latency in ms

    def record(self, ok: bool, ms: float, alpha: float = 0.2) -> None:
        self.ewma_ok = (1.0 - alpha) * self.ewma_ok + alpha * (1.0 if ok else 0.0)
        self.ewma_ms = (1.0 - alpha) * self.ewma_ms + alpha * ms

@dataclass
class RouterResult:
    value: Any
    provider: str
    attempts: int
    degraded: bool
    latency_ms: float

class ProviderRouter:
    """
    Orchestrates provider failover across ordered priority slots.
    Automatically skips open circuit breakers and exhausted quotas.
    Records telemetry and EWMA health scores.
    """
    def __init__(
        self,
        capability: str,
        slots: list[Slot],
        accept: Optional[Callable[[Any], bool]] = None,
        degraded_after: int = 1
    ):
        self.capability = capability
        self.slots = slots
        self.accept = accept
        self.degraded_after = degraded_after

    def _ordered_slots(self) -> list[Slot]:
        # Sort primary by priority (ascending), secondary by health (-ewma_ok, ewma_ms)
        return sorted(self.slots, key=lambda s: (s.provider.priority, -s.ewma_ok, s.ewma_ms))

    async def run(self, request: Any) -> RouterResult:
        errors: list[tuple[str, str]] = []
        attempts = 0

        for slot in self._ordered_slots():
            p = slot.provider

            if not slot.breaker.allow():
                errors.append((p.name, f"circuit breaker {slot.breaker.state}"))
                continue

            if not slot.quota.has_budget():
                errors.append((p.name, "quota exhausted"))
                continue

            attempts += 1
            start_time = time.monotonic()

            try:
                slot.quota.consume()
                value = await asyncio.wait_for(p.call(request), timeout=p.timeout_s)

                if self.accept and not self.accept(value):
                    raise BadResponse(f"Response from {p.name} rejected by validation criteria")

                latency_ms = (time.monotonic() - start_time) * 1000.0
                slot.breaker.on_success()
                slot.record(True, latency_ms)

                logger.info(
                    "Provider SUCCESS: capability=%s provider=%s latency=%.1fms attempts=%d",
                    self.capability, p.name, latency_ms, attempts
                )
                return RouterResult(
                    value=value,
                    provider=p.name,
                    attempts=attempts,
                    degraded=attempts > self.degraded_after,
                    latency_ms=latency_ms
                )

            except RateLimited as err:
                latency_ms = (time.monotonic() - start_time) * 1000.0
                slot.breaker.on_failure(retry_after=err.retry_after or 60.0)
                slot.record(False, latency_ms)
                errors.append((p.name, f"429 RateLimited (retry_after={err.retry_after})"))
                logger.warning("Provider RATE LIMITED: %s for %s", p.name, self.capability)

            except (asyncio.TimeoutError, httpx.HTTPError, ProviderError, Exception) as err:
                latency_ms = (time.monotonic() - start_time) * 1000.0
                slot.breaker.on_failure()
                slot.record(False, latency_ms)
                err_type = type(err).__name__
                errors.append((p.name, f"{err_type}: {str(err)}"))
                logger.warning("Provider FAILED: %s (%s) for %s", p.name, err_type, self.capability)

        raise AllProvidersFailed(errors)
