import os
from pathlib import Path
from typing import Optional

from .base import Provider
from .breaker import CircuitBreaker
from .quota import QuotaTracker
from .router import Slot, ProviderRouter

from .plant_id.plantnet import PlantNetProvider
from .plant_id.kindwise import KindwiseProvider
from .llm.gemini import GeminiLLMProvider
from .llm.openai_compat import OpenAICompatLLM
from .llm.rule_based import RuleBasedLLMProvider

def create_plant_id_router() -> ProviderRouter:
    slots: list[Slot] = []

    # Pl@ntNet Primary (500 free requests/day)
    plantnet_provider = PlantNetProvider(priority=1, timeout_s=12.0)
    plantnet_breaker = CircuitBreaker(fail_threshold=3, base_cooldown=30.0)
    plantnet_quota = QuotaTracker(per_minute=20, per_day=450)
    slots.append(Slot(provider=plantnet_provider, breaker=plantnet_breaker, quota=plantnet_quota))

    # Kindwise Secondary (Tier 2 Vision Failover)
    kindwise_provider = KindwiseProvider(priority=2, timeout_s=12.0)
    kindwise_breaker = CircuitBreaker(fail_threshold=3, base_cooldown=45.0)
    kindwise_quota = QuotaTracker(per_minute=10, per_day=100)
    slots.append(Slot(provider=kindwise_provider, breaker=kindwise_breaker, quota=kindwise_quota))

    return ProviderRouter(
        capability="plant_id",
        slots=slots,
        accept=lambda res: bool(res and len(res) > 0)
    )

def create_llm_router() -> ProviderRouter:
    slots: list[Slot] = []

    def is_valid_key(k: Optional[str]) -> bool:
        return bool(k and k.strip() and not k.strip().startswith("your_"))

    # 1. Gemini (Priority 1 - Google GenAI)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if is_valid_key(gemini_key):
        gemini_provider = GeminiLLMProvider(
            api_key=gemini_key,
            model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
            priority=1,
            timeout_s=12.0
        )
        slots.append(Slot(
            provider=gemini_provider,
            breaker=CircuitBreaker(fail_threshold=3, base_cooldown=30.0),
            quota=QuotaTracker(per_minute=15, per_day=1500)
        ))

    # 2. Groq (Priority 2 - Ultra-fast inference)
    groq_key = os.getenv("GROQ_API_KEY")
    if is_valid_key(groq_key):
        groq_provider = OpenAICompatLLM(
            name="groq",
            base_url="https://api.groq.com/openai/v1",
            api_key=groq_key,
            model=os.getenv("GROQ_MODEL", "openai/gpt-oss-120b"),
            priority=2,
            timeout_s=12.0
        )
        slots.append(Slot(
            provider=groq_provider,
            breaker=CircuitBreaker(fail_threshold=3, base_cooldown=30.0),
            quota=QuotaTracker(per_minute=25, per_day=900)
        ))

    # 3. OpenRouter (Priority 3 - Free open-source models)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if is_valid_key(openrouter_key):
        openrouter_provider = OpenAICompatLLM(
            name="openrouter",
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_key,
            model=os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-3.5-lightning:free"),
            priority=3,
            timeout_s=20.0
        )
        slots.append(Slot(
            provider=openrouter_provider,
            breaker=CircuitBreaker(fail_threshold=3, base_cooldown=45.0),
            quota=QuotaTracker(per_minute=18, per_day=45)
        ))

    # 4. Mistral (Priority 4 - La Plateforme)
    mistral_key = os.getenv("MISTRAL_API_KEY")
    if is_valid_key(mistral_key):
        mistral_provider = OpenAICompatLLM(
            name="mistral",
            base_url="https://api.mistral.ai/v1",
            api_key=mistral_key,
            model=os.getenv("MISTRAL_MODEL", "open-mistral-7b"),
            priority=4,
            timeout_s=15.0
        )
        slots.append(Slot(
            provider=mistral_provider,
            breaker=CircuitBreaker(fail_threshold=3, base_cooldown=30.0),
            quota=QuotaTracker(per_minute=20, per_day=500)
        ))

    # 5. Cerebras (Priority 5 - If key provided)
    cerebras_key = os.getenv("CEREBRAS_API_KEY")
    if is_valid_key(cerebras_key):
        cerebras_provider = OpenAICompatLLM(
            name="cerebras",
            base_url="https://api.cerebras.ai/v1",
            api_key=cerebras_key,
            model=os.getenv("CEREBRAS_MODEL", "llama3.1-70b"),
            priority=5,
            timeout_s=15.0
        )
        slots.append(Slot(
            provider=cerebras_provider,
            breaker=CircuitBreaker(fail_threshold=3, base_cooldown=30.0),
            quota=QuotaTracker(per_minute=30, per_day=1000)
        ))

    # 99. Rule-based Terminal Fallback (Zero network, always succeeds)
    rule_provider = RuleBasedLLMProvider()
    slots.append(Slot(
        provider=rule_provider,
        breaker=CircuitBreaker(fail_threshold=999),
        quota=QuotaTracker()
    ))

    return ProviderRouter(
        capability="llm",
        slots=slots,
        accept=lambda res: res is not None
    )

# Global singleton router instances
plant_id_router = create_plant_id_router()
llm_router = create_llm_router()
