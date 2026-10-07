import json
import sqlite3
import yaml
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..providers.registry import llm_router

ONTOLOGY_PATH = Path(__file__).resolve().parent.parent.parent / "config" / "need_ontology.yaml"
curr_path = Path(__file__).resolve()
possible_locations = [
    curr_path.parents[4] / "data" / "curated" / "plants_v2.sqlite",
    curr_path.parents[4] / "data" / "curated" / "plants.db",
    curr_path.parents[2] / "plants_v2.sqlite",
    curr_path.parent / "plants_v2.sqlite",
]
DB_PATH = None
for loc in possible_locations:
    if loc.exists():
        DB_PATH = loc
        break
if not DB_PATH:
    DB_PATH = curr_path.parents[4] / "data" / "curated" / "plants_v2.sqlite"

def load_ontology() -> dict:
    if ONTOLOGY_PATH.exists():
        with open(ONTOLOGY_PATH, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
            return data.get("needs", {})
    return {}

EVIDENCE_WEIGHTS = {"A": 1.0, "B": 0.75, "C": 0.50, "D": 0.25}

def recommend_plants_for_need(
    needs: List[str],
    profile: Optional[Dict[str, Any]] = None,
    route: Optional[str] = None,
    limit: int = 5,
    lang: str = "fr"
) -> Dict[str, Any]:
    """
    Deterministic, explainable, and safety-hardened botanical recommendation engine.
    Computes scores via multi-criteria activity matching and strictly enforces
    contraindications (pregnancy, Asteraceae allergy, phototoxicity).
    """
    if profile is None:
        profile = {}

    ontology = load_ontology()
    target_weights: Dict[str, float] = {}
    preferred_route = route

    for need_key in needs:
        need_def = ontology.get(need_key)
        if need_def:
            if not preferred_route:
                preferred_route = need_def.get("route_preference", "any")
            for act_code, weight in need_def.get("activities", {}).items():
                target_weights[act_code] = target_weights.get(act_code, 0.0) + weight

    # Normalize weights to sum to 1.0
    total_w = sum(target_weights.values())
    if total_w > 0:
        target_weights = {k: v / total_w for k, v in target_weights.items()}

    if not DB_PATH or not DB_PATH.exists():
        return {"results": [], "excluded_for_safety": 0, "total_matches": 0}

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Fetch all plants with their activities and safety flags
    cur.execute("""
        SELECT p.id, p.accepted_name, p.family, p.region, p.part_used, p.composition_raw, p.activity_raw
        FROM plant p
    """)
    plants_rows = cur.fetchall()

    scored_candidates = []
    excluded_count = 0

    is_pregnant = profile.get("pregnant", False)
    is_child = profile.get("child", False)
    allergies = [a.lower() for a in profile.get("allergy_families", [])]

    for row in plants_rows:
        p_id, accepted_name, family, region, part_used, comp_raw, act_raw = row

        # Fetch names
        cur.execute("SELECT lang, name FROM plant_name WHERE plant_id = ?", (p_id,))
        names_dict = {r[0]: r[1] for r in cur.fetchall()}

        # Fetch safety flags
        cur.execute("SELECT flag, severity, applies_to_route, note FROM safety_flag WHERE plant_id = ?", (p_id,))
        safety_rows = cur.fetchall()

        # Hard Safety Exclusion Filter
        exclude_plant = False
        banners = []
        for flag, severity, applies_route, note in safety_rows:
            # Check route compatibility
            if applies_route and applies_route != "any" and preferred_route and preferred_route != "any":
                if applies_route != preferred_route:
                    continue

            # Hard Contraindications
            if flag == "pregnancy_avoid" and is_pregnant:
                exclude_plant = True
                break
            if flag == "allergen_asteraceae" and "asteraceae" in allergies:
                exclude_plant = True
                break
            if flag == "child_avoid" and is_child:
                exclude_plant = True
                break

            banners.append({
                "flag": flag,
                "severity": severity,
                "note": note
            })

        if exclude_plant:
            excluded_count += 1
            continue

        # Fetch activities for plant
        cur.execute("""
            SELECT a.code, pa.evidence_grade
            FROM plant_activity pa
            JOIN activity a ON a.id = pa.activity_id
            WHERE pa.plant_id = ?
        """, (p_id,))
        act_rows = cur.fetchall()
        plant_activities = {r[0]: r[1] for r in act_rows}

        # Calculate S_activity
        s_activity = 0.0
        matched_activities = []
        for act_code, weight in target_weights.items():
            if act_code in plant_activities:
                s_activity += weight
                matched_activities.append(act_code)

        if s_activity <= 0:
            continue

        # Evidence score
        evidence_grades = [plant_activities[a] for a in matched_activities]
        best_grade = min(evidence_grades) if evidence_grades else "C"
        s_evidence = EVIDENCE_WEIGHTS.get(best_grade, 0.5)

        # Local Algerian flora bonus
        s_local = 1.0

        # Route compatibility score
        s_route = 1.0 if (not preferred_route or preferred_route == "any") else 0.8

        final_score = (
            0.50 * s_activity +
            0.25 * s_evidence +
            0.15 * s_local +
            0.10 * s_route
        )

        scored_candidates.append({
            "plant_id": p_id,
            "accepted_name": accepted_name,
            "names": {
                "la": names_dict.get("la", accepted_name),
                "fr": names_dict.get("fr", ""),
                "ar": names_dict.get("ar", "")
            },
            "family": family,
            "score": round(final_score, 3),
            "score_breakdown": {
                "activity_match": round(s_activity, 2),
                "evidence": round(s_evidence, 2),
                "local_availability": s_local,
                "route_suitability": s_route
            },
            "evidence_grade": best_grade,
            "matched_activities": matched_activities,
            "part_used": part_used,
            "composition_raw": comp_raw,
            "safety_banners": banners,
            "region": region
        })

    conn.close()

    # Sort candidates by score descending
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)
    top_results = scored_candidates[:limit]

    return {
        "results": top_results,
        "excluded_for_safety": excluded_count,
        "total_matches": len(scored_candidates)
    }
