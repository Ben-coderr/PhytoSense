import time
from typing import Optional

class CircuitBreaker:
    """
    Tracks failure rates for a single external provider.
    Transitions:
      - CLOSED: Normal operation. Requests are allowed.
      - OPEN: Fail threshold exceeded. Requests are skipped immediately.
      - HALF-OPEN: Cooldown expired. Allows a single probe request to test recovery.
    """
    def __init__(
        self,
        fail_threshold: int = 3,
        base_cooldown: float = 30.0,
        max_cooldown: float = 900.0
    ):
        self.fail_threshold = fail_threshold
        self.base_cooldown = base_cooldown
        self.max_cooldown = max_cooldown
        self.consecutive_fails = 0
        self.open_until = 0.0

    @property
    def state(self) -> str:
        now = time.monotonic()
        if self.open_until > 0.0:
            if now < self.open_until:
                return "open"
            return "half-open"
        return "closed"

    def allow(self) -> bool:
        """Returns True if request is allowed (closed or cooldown expired)."""
        return time.monotonic() >= self.open_until

    def on_success(self) -> None:
        """Resets fail counter and closes breaker upon success."""
        self.consecutive_fails = 0
        self.open_until = 0.0

    def on_failure(self, retry_after: Optional[float] = None) -> None:
        """Records failure and calculates backoff cooldown."""
        self.consecutive_fails += 1
        now = time.monotonic()

        if retry_after is not None and retry_after > 0:
            # Server explicitly specified cooldown via Retry-After header
            self.open_until = now + retry_after
        elif self.consecutive_fails >= self.fail_threshold:
            # Exponential backoff: base * 2^(fails - threshold) up to max_cooldown
            extra_exponent = min(self.consecutive_fails - self.fail_threshold, 5)
            cooldown = min(self.base_cooldown * (2 ** extra_exponent), self.max_cooldown)
            self.open_until = now + cooldown
