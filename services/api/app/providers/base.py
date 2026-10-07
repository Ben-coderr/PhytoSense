from __future__ import annotations
import abc
from typing import Any, Optional

class ProviderError(Exception):
    """Base error for all provider issues."""
    pass

class RateLimited(ProviderError):
    """Raised when an external API returns 429 Too Many Requests."""
    def __init__(self, retry_after: Optional[float] = None, message: str = "Rate limited by upstream provider"):
        super().__init__(message)
        self.retry_after = retry_after

class BadResponse(ProviderError):
    """Raised when upstream returns malformed, unparseable, or invalid data."""
    pass

class AllProvidersFailed(ProviderError):
    """Raised when all providers in the configured capability chain fail."""
    def __init__(self, errors: list[tuple[str, str]]):
        detail = "; ".join(f"{name}: {err}" for name, err in errors)
        super().__init__(f"All providers failed: {detail}")
        self.errors = errors

class Provider(abc.ABC):
    name: str
    timeout_s: float = 15.0
    priority: int = 50

    @abc.abstractmethod
    async def call(self, request: Any) -> Any:
        """Execute request against upstream provider and return standardized schema."""
        pass
