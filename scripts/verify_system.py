#!/usr/bin/env python3
"""
🌿 PhytoSense v2 — Master End-to-End System Verification Suite
Validates the complete native stack:
1. SQLite Database & FTS5 Full-Text Search Integrity
2. FastAPI Backend Router Endpoints (Health, Catalog, Recommender, Agronomy, Pathology)
3. Safety & Clinical Contraindication Enforcement
4. Next.js Web Application HTTP Availability
5. Expo Mobile TypeScript Type Safety
"""

import sys
import os
import sqlite3
import json
import urllib.request
import urllib.error
import subprocess
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
SQLITE_DB = ROOT_DIR / "data" / "curated" / "plants_v2.sqlite"
API_BASE = "http://localhost:8000"
WEB_BASE = "http://localhost:3001"
MOBILE_DIR = ROOT_DIR / "apps" / "mobile"

# Terminal Colors
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"

checks_passed = 0
checks_total = 0

def check(title: str, condition: bool, details: str = ""):
    global checks_passed, checks_total
    checks_total += 1
    if condition:
        checks_passed += 1
        print(f"  {GREEN}✓ PASS{RESET} {BOLD}{title}{RESET}" + (f" ({details})" if details else ""))
    else:
        print(f"  {RED}✗ FAIL{RESET} {BOLD}{title}{RESET}" + (f" - {details}" if details else ""))

def http_get(url: str, timeout: float = 6.0):
    req = urllib.request.Request(url, headers={"User-Agent": "PhytoSense-Verifier/2.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read().decode("utf-8")

def http_post(url: str, data: dict, timeout: float = 8.0):
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "PhytoSense-Verifier/2.0"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.status, resp.read().decode("utf-8")

def verify_sqlite():
    print(f"\n{BLUE}{BOLD}[1/4] SQLite & FTS5 Data Layer Verification{RESET}")
    if not SQLITE_DB.exists():
        check("SQLite Database File Exists", False, f"File missing at {SQLITE_DB}")
        return

    check("SQLite Database File Exists", True, str(SQLITE_DB.relative_to(ROOT_DIR)))
    
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()

    # Table counts
    cursor.execute("SELECT COUNT(*) FROM plant")
    plant_count = cursor.fetchone()[0]
    check("Plant Taxa Count (>= 150)", plant_count >= 150, f"{plant_count} curated taxa")

    cursor.execute("SELECT COUNT(*) FROM plant_name")
    name_count = cursor.fetchone()[0]
    check("Multilingual Names Count (>= 400)", name_count >= 400, f"{name_count} vernacular names")

    cursor.execute("SELECT COUNT(*) FROM compound")
    compound_count = cursor.fetchone()[0]
    check("Chemical Compounds Count (>= 10)", compound_count >= 10, f"{compound_count} compounds")

    cursor.execute("SELECT COUNT(*) FROM safety_flag")
    safety_count = cursor.fetchone()[0]
    check("Safety Flags Count (>= 25)", safety_count >= 25, f"{safety_count} safety flags")

    # FTS5 search
    cursor.execute("SELECT count(*) FROM plant_fts WHERE plant_fts MATCH 'zaatar'")
    fts_zaatar = cursor.fetchone()[0]
    check("FTS5 Full-Text Search ('zaatar')", fts_zaatar > 0, f"Found {fts_zaatar} matches")

    conn.close()

def verify_api():
    print(f"\n{BLUE}{BOLD}[2/4] FastAPI Native Backend Routers Verification ({API_BASE}){RESET}")

    # 1. Health
    try:
        status, body = http_get(f"{API_BASE}/health")
        data = json.loads(body)
        check("GET /health", status == 200 and data.get("status") == "healthy", f"HTTP {status}")
    except Exception as e:
        check("GET /health", False, f"Connection failed: {e}")
        print(f"    {YELLOW}Hint: Start the native stack with `./dev.sh --web` or `./dev.sh --all`{RESET}")
        return

    # 2. Plant Catalog
    try:
        status, body = http_get(f"{API_BASE}/v1/plants?limit=5")
        data = json.loads(body)
        count = len(data.get("items", []))
        check("GET /v1/plants", status == 200 and count > 0, f"Returned {count} items")
    except Exception as e:
        check("GET /v1/plants", False, str(e))

    # 3. Plant Search
    try:
        status, body = http_get(f"{API_BASE}/v1/plants/search?q=thymus")
        data = json.loads(body)
        results = data.get("results", [])
        check("GET /v1/plants/search?q=thymus", status == 200 and len(results) > 0, f"Found {len(results)} results")
    except Exception as e:
        check("GET /v1/plants/search", False, str(e))

    # 4. Clinical Recommender & Safety Filter
    try:
        post_data = {
            "needs": ["skin.acne"],
            "profile": {
                "pregnant": True,
                "pediatric": False,
                "allergy_families": ["Asteraceae"]
            },
            "limit": 5
        }
        status, body = http_post(f"{API_BASE}/v1/recommend", post_data)
        data = json.loads(body)
        recs = data.get("results", [])
        excluded = data.get("excluded_for_safety", 0)
        # Verify no Asteraceae or contra-indicated plants are recommended
        asteraceae_leaks = [r for r in recs if r.get("family") == "Asteraceae"]
        check(
            "POST /v1/recommend (Safety Filtering)",
            status == 200 and len(recs) > 0 and len(asteraceae_leaks) == 0,
            f"{len(recs)} safe matches, {excluded} excluded for pregnancy/allergy"
        )
    except Exception as e:
        check("POST /v1/recommend", False, str(e))

    # 5. Agronomy Suitability
    try:
        suit_data = {
            "lat": 36.75,
            "lon": 3.05,
            "scientific_name": "Thymus vulgaris",
            "soil_ph": 7.3
        }
        status, body = http_post(f"{API_BASE}/v1/cultivation/suitability", suit_data)
        data = json.loads(body)
        score = data.get("suitability_percent")
        check(
            "POST /v1/cultivation/suitability",
            status == 200 and score is not None,
            f"Algiers suitability: {score}%"
        )
    except Exception as e:
        check("POST /v1/cultivation/suitability", False, str(e))

    # 6. Irrigation Schedule
    try:
        status, body = http_get(f"{API_BASE}/v1/cultivation/irrigation?lat=36.75&lon=3.05&scientific_name=Thymus%20vulgaris")
        data = json.loads(body)
        weekly = data.get("weekly_total_litres_m2")
        check(
            "GET /v1/cultivation/irrigation",
            status == 200 and weekly is not None,
            f"Weekly need: {weekly} L/m²"
        )
    except Exception as e:
        check("GET /v1/cultivation/irrigation", False, str(e))

    # 7. Pathology Diagnostics
    try:
        diag_data = {
            "symptoms": ["white_spots", "powdery_coating"],
            "plant_name": "Thymus vulgaris"
        }
        status, body = http_post(f"{API_BASE}/v1/diagnose", diag_data)
        data = json.loads(body)
        count = data.get("diagnoses_count", 0)
        check(
            "POST /v1/diagnose",
            status == 200 and count > 0,
            f"Identified {count} pathologies"
        )
    except Exception as e:
        check("POST /v1/diagnose", False, str(e))

def verify_web():
    print(f"\n{BLUE}{BOLD}[3/4] Next.js Web Application Verification ({WEB_BASE}){RESET}")
    try:
        status, body = http_get(WEB_BASE, timeout=6.0)
        has_content = len(body) > 100
        check("GET / (Web Dashboard)", status == 200 and has_content, f"HTTP {status}, size: {len(body)} bytes")
    except Exception as e:
        check("GET / (Web Dashboard)", False, f"Could not reach {WEB_BASE}: {e}")

def verify_mobile():
    print(f"\n{BLUE}{BOLD}[4/4] Expo Mobile App Typecheck & Assets ({MOBILE_DIR.relative_to(ROOT_DIR)}){RESET}")
    
    # 1. Bundled database asset
    mobile_db = MOBILE_DIR / "assets" / "plants.db"
    mobile_db_sqlite = MOBILE_DIR / "assets" / "db" / "plants.sqlite"
    db_exists = mobile_db.exists() or mobile_db_sqlite.exists()
    size_kb = (mobile_db.stat().st_size if mobile_db.exists() else mobile_db_sqlite.stat().st_size) // 1024
    check("Mobile Bundled Database Asset", db_exists, f"Size: {size_kb} KB")

    # 2. TypeScript compilation
    try:
        res = subprocess.run(
            ["npx", "tsc", "--noEmit"],
            cwd=MOBILE_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        check(
            "Mobile TypeScript Compilation (npx tsc --noEmit)",
            res.returncode == 0,
            "0 errors" if res.returncode == 0 else f"{res.stderr[:200]}"
        )
    except Exception as e:
        check("Mobile TypeScript Compilation", False, str(e))

def main():
    print(f"{BOLD}🌿 PhytoSense v2 Master Verification Suite{RESET}")
    print(f"Platform: Native macOS (Zero Docker) | Architecture: Monorepo v2\n{'=' * 65}")

    verify_sqlite()
    verify_api()
    verify_web()
    verify_mobile()

    print(f"\n{'=' * 65}")
    success_rate = (checks_passed / checks_total) * 100 if checks_total > 0 else 0
    if checks_passed == checks_total:
        print(f"{GREEN}{BOLD}✓ ALL {checks_total} CHECKS PASSED ({success_rate:.0f}%){RESET} — System is 100% operational!")
        sys.exit(0)
    else:
        print(f"{YELLOW}{BOLD}⚠️ {checks_passed}/{checks_total} CHECKS PASSED ({success_rate:.0f}%){RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
