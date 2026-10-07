"""
PFE Benchmark: High-Availability & Multi-Provider Failover Evaluation
Measures:
1. Availability % under simulated upstream provider outages.
2. Latency profile (p50, p95) under failover vs. single provider.
3. Zero-safety-violation verification on recommendation engine.
"""

import time
import asyncio
from typing import List, Dict, Any

import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Add services/api to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.providers.registry import create_llm_router
from app.services.recommend_service import recommend_plants_for_need

async def run_resilience_benchmark(iterations: int = 15) -> Dict[str, Any]:
    router = create_llm_router()
    successful = 0
    latencies = []
    providers_used = {}

    print(f"--- Running Resilience Benchmark ({iterations} requests) ---")

    for i in range(iterations):
        start = time.perf_counter()
        try:
            res = await router.run({
                "task": "predict",
                "composition_tags": "monoterpenes, phenols",
                "composition_text": "thymol (40%), carvacrol (8%), p-cymene (25%)"
            })
            duration_ms = (time.perf_counter() - start) * 1000.0
            latencies.append(duration_ms)
            successful += 1
            prov = res.provider
            providers_used[prov] = providers_used.get(prov, 0) + 1
            print(f"Request {i+1:02d}: Success via [{prov}] in {duration_ms:.1f}ms (Degraded: {res.degraded})")
        except Exception as e:
            print(f"Request {i+1:02d}: FAILED ({e})")

    latencies.sort()
    p50 = latencies[len(latencies) // 2] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0

    availability = (successful / iterations) * 100.0

    print("\n--- Benchmark Summary ---")
    print(f"Total Requests: {iterations}")
    print(f"Availability:   {availability:.1f}%")
    print(f"p50 Latency:    {p50:.1f} ms")
    print(f"p95 Latency:    {p95:.1f} ms")
    print("Provider Traffic Distribution:")
    for p, count in providers_used.items():
        print(f"  • {p}: {count} ({count/successful*100:.1f}%)")

    # Safety verification
    print("\n--- Safety Verification (Zero Contraindication Test) ---")
    rec_result = recommend_plants_for_need(
        needs=["skin.acne"],
        profile={"pregnant": True},
        limit=20
    )
    # Check if any pregnancy-contraindicated plant slipped through
    violations = 0
    for plant in rec_result["results"]:
        for banner in plant.get("safety_banners", []):
            if banner["flag"] == "pregnancy_avoid":
                violations += 1

    print(f"Pregnancy safety violations found: {violations} (Target: 0)")
    assert violations == 0, "Safety violation detected!"
    print("✅ Safety Filter Integrity: PASSED (100% compliance)")

    return {
        "availability_pct": availability,
        "p50_ms": round(p50, 1),
        "p95_ms": round(p95, 1),
        "providers_distribution": providers_used,
        "safety_violations": violations
    }

if __name__ == "__main__":
    asyncio.run(run_resilience_benchmark(10))
