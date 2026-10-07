import time
import datetime as dt
from typing import Optional

class QuotaTracker:
    """
    Tracks and enforces rate-limiting budgets per minute and per day.
    In-memory implementation with sliding window for minute rate limits
    and daily roll reset. Can be backed by Redis in production.
    """
    def __init__(self, per_minute: Optional[int] = None, per_day: Optional[int] = None):
        self.per_minute = per_minute
        self.per_day = per_day
        self.minute_hits: list[float] = []
        self.day = dt.datetime.now(dt.timezone.utc).date()
        self.day_count = 0

    def _roll(self) -> None:
        """Prunes stale timestamps and resets on day change."""
        today = dt.datetime.now(dt.timezone.utc).date()
        if today != self.day:
            self.day = today
            self.day_count = 0

        cutoff = time.monotonic() - 60.0
        self.minute_hits = [t for t in self.minute_hits if t > cutoff]

    def has_budget(self) -> bool:
        """Checks if calls remain within minute and daily quotas."""
        self._roll()
        if self.per_day is not None and self.day_count >= self.per_day:
            return False
        if self.per_minute is not None and len(self.minute_hits) >= self.per_minute:
            return False
        return True

    def consume(self) -> None:
        """Records a consumed API call."""
        self._roll()
        self.day_count += 1
        self.minute_hits.append(time.monotonic())

    def exhaust_today(self) -> None:
        """Instantly exhausts daily quota when provider signals 429 quota exhaustion."""
        if self.per_day is not None:
            self.day_count = self.per_day

    def adjust_from_headers(self, remaining: Optional[int] = None) -> None:
        """Synchronizes remaining quota from upstream x-ratelimit headers if available."""
        if remaining is not None and self.per_day is not None:
            self.day_count = max(self.day_count, self.per_day - remaining)
