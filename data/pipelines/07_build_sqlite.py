import hashlib
import json
import os
import re
import sqlite3
import unicodedata
from pathlib import Path

# Diacritic stripper for Arabic
ARABIC_DIACRITICS = re.compile(r"[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")

def normalize_ar(text: str) -> str:
    if not text: return ""
    text = ARABIC_DIACRITICS.sub("", text)
    text = re.sub(r"[إأآٱ]", "ا", text)
    text = re.sub(r"ى", "ي", text)
    text = re.sub(r"ة", "ه", text)
    return text.strip().lower()

def normalize_fr(text: str) -> str:
    if not text: return ""
    nfd = unicodedata.normalize("NFD", text)
    stripped = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    cleaned = re.sub(r"[\"\'\(\)\/\-\_]", " ", stripped)
    return " ".join(cleaned.split()).lower()

def extract_genus(sci_name: str) -> str:
    cleaned = sci_name.strip(' "\'')
    parts = cleaned.split()
    return parts[0] if parts else ""

def main():
    root = Path(__file__).resolve().parent.parent.parent
    curated_json = root / "data" / "curated" / "plants.json"
    if not curated_json.exists():
        curated_json = root / "plants.json"

    output_db = root / "data" / "curated" / "plants_v2.sqlite"
    manifest_path = root / "data" / "curated" / "manifest.json"

    print(f"Reading dataset from: {curated_json}")
    with open(curated_json, "r", encoding="utf-8") as f:
        plants = json.load(f)

    if output_db.exists():
        os.remove(output_db)

    conn = sqlite3.connect(output_db)
    cur = conn.cursor()

    # 1. Create normalized tables
    cur.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE plant (
        id INTEGER PRIMARY KEY,
        accepted_name TEXT NOT NULL,
        family TEXT,
        genus TEXT,
        region TEXT,
        part_used TEXT,
        composition_raw TEXT,
        activity_raw TEXT,
        author TEXT,
        native_dz BOOLEAN DEFAULT 1
    );

    CREATE TABLE plant_name (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id INTEGER REFERENCES plant(id),
        lang TEXT,
        name TEXT NOT NULL,
        name_norm TEXT NOT NULL,
        notes TEXT,
        kind TEXT
    );

    CREATE TABLE compound (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        chem_class TEXT
    );

    CREATE TABLE plant_compound (
        plant_id INTEGER REFERENCES plant(id),
        compound_id INTEGER REFERENCES compound(id),
        organ TEXT,
        PRIMARY KEY (plant_id, compound_id)
    );

    CREATE TABLE activity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        label_fr TEXT,
        label_en TEXT,
        label_ar TEXT
    );

    CREATE TABLE plant_activity (
        plant_id INTEGER REFERENCES plant(id),
        activity_id INTEGER REFERENCES activity(id),
        evidence_grade TEXT DEFAULT 'C',
        PRIMARY KEY (plant_id, activity_id)
    );

    CREATE TABLE safety_flag (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plant_id INTEGER REFERENCES plant(id),
        flag TEXT NOT NULL,
        severity TEXT NOT NULL, -- 'info', 'caution', 'avoid'
        applies_to_route TEXT,
        note TEXT NOT NULL
    );

    -- FTS5 Full-Text Search Virtual Table
    CREATE VIRTUAL TABLE plant_fts USING fts5(
        plant_id UNINDEXED,
        scientific_name,
        french_name,
        arabic_name,
        synonyms,
        composition,
        activity,
        tokenize='unicode61 remove_diacritics 2'
    );
    """)

    # 2. Seed controlled activities
    activities_seed = [
        ("antioxydant", "Antioxydant", "Antioxidant", "مضاد للأكسدة"),
        ("anti-inflammatoire", "Anti-inflammatoire", "Anti-inflammatory", "مضاد للالتهاب"),
        ("antibactérien", "Antibactérien", "Antibacterial", "مضاد للبكتيريا"),
        ("antimicrobien", "Antimicrobien", "Antimicrobial", "مضاد للميكروبات"),
        ("antifongique", "Antifongique", "Antifungal", "مضاد للفطريات"),
        ("cicatrisant", "Cicatrisant", "Wound Healing", "ملئم للجروح ومجدد للأنسجة"),
        ("analgésique", "Analgésique", "Analgesic", "مسكن للألم"),
        ("antispasmodique", "Antispasmodique", "Antispasmodic", "مضاد للتشنج"),
        ("antidiabétique", "Antidiabétique", "Antidiabetic", "مساعد لخفض السكر"),
    ]
    cur.executemany(
        "INSERT INTO activity (code, label_fr, label_en, label_ar) VALUES (?, ?, ?, ?)",
        activities_seed
    )
    conn.commit()

    # Query activity IDs map
    cur.execute("SELECT code, id FROM activity")
    activity_map = dict(cur.fetchall())

    compound_map = {}

    # 3. Populate plants and relationships
    for idx, p in enumerate(plants, start=1):
        sci_name = p.get("scientific_name", "").strip(' "')
        fr_name = p.get("french_name", "") or ""
        ar_name = p.get("arabic_name", "") or ""
        fr_notes = p.get("french_notes", "") or ""
        ar_notes = p.get("arabic_notes", "") or ""
        family = p.get("family", "") or ""
        region = p.get("region", "") or ""
        part_used = p.get("part_used", "") or ""
        comp_raw = p.get("composition", "") or ""
        act_raw = p.get("biological_activity", "") or ""
        author = p.get("author", "") or ""
        genus = extract_genus(sci_name)

        # Insert Plant
        cur.execute("""
            INSERT INTO plant (id, accepted_name, family, genus, region, part_used, composition_raw, activity_raw, author, native_dz)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (idx, sci_name, family, genus, region, part_used, comp_raw, act_raw, author))

        # Insert Names
        if sci_name:
            cur.execute("""
                INSERT INTO plant_name (plant_id, lang, name, name_norm, notes, kind)
                VALUES (?, 'la', ?, ?, NULL, 'scientific')
            """, (idx, sci_name, normalize_fr(sci_name)))

        if fr_name:
            cur.execute("""
                INSERT INTO plant_name (plant_id, lang, name, name_norm, notes, kind)
                VALUES (?, 'fr', ?, ?, ?, 'vernacular')
            """, (idx, fr_name, normalize_fr(fr_name), fr_notes))

        if ar_name:
            cur.execute("""
                INSERT INTO plant_name (plant_id, lang, name, name_norm, notes, kind)
                VALUES (?, 'ar', ?, ?, ?, 'vernacular')
            """, (idx, ar_name, normalize_ar(ar_name), ar_notes))

        # Insert Compounds & Plant-Compound links
        comp_tags = p.get("composition_tags", [])
        for ct in comp_tags:
            ct = ct.strip()
            if not ct: continue
            if ct not in compound_map:
                cur.execute("INSERT OR IGNORE INTO compound (name, chem_class) VALUES (?, ?)", (ct, ct))
                cur.execute("SELECT id FROM compound WHERE name = ?", (ct,))
                compound_map[ct] = cur.fetchone()[0]

            cid = compound_map[ct]
            cur.execute("INSERT OR IGNORE INTO plant_compound (plant_id, compound_id, organ) VALUES (?, ?, ?)",
                        (idx, cid, part_used[:100]))

        # Insert Activities
        act_tags = p.get("activity_tags", [])
        for at in act_tags:
            at = at.strip()
            if at in activity_map:
                aid = activity_map[at]
                cur.execute("INSERT OR IGNORE INTO plant_activity (plant_id, activity_id, evidence_grade) VALUES (?, ?, 'C')",
                            (idx, aid))

        # Insert Safety Flags
        family_lower = family.lower()
        sci_lower = sci_name.lower()
        if "asteraceae" in family_lower or "composées" in family_lower:
            cur.execute("""
                INSERT INTO safety_flag (plant_id, flag, severity, applies_to_route, note)
                VALUES (?, 'allergen_asteraceae', 'caution', 'any',
                'Allergie croisée possible chez les personnes sensibles aux Astéracées.')
            """, (idx,))

        if any(term in sci_lower for term in ["artemisia", "ruta", "salvia"]):
            cur.execute("""
                INSERT INTO safety_flag (plant_id, flag, severity, applies_to_route, note)
                VALUES (?, 'pregnancy_avoid', 'avoid', 'any',
                'Contre-indiqué pendant la grossesse et l''allaitement.')
            """, (idx,))

        if any(term in sci_lower for term in ["hypericum", "ruta"]):
            cur.execute("""
                INSERT INTO safety_flag (plant_id, flag, severity, applies_to_route, note)
                VALUES (?, 'phototoxic', 'caution', 'topical',
                'Risque de photosensibilisation cutanée : éviter l''exposition aux rayons solaires après application.')
            """, (idx,))

        if "nigella" in sci_lower or "thymus" in sci_lower:
            cur.execute("""
                INSERT INTO safety_flag (plant_id, flag, severity, applies_to_route, note)
                VALUES (?, 'patch_test', 'info', 'topical',
                'Effectuer un test de tolérance cutanée au creux du coude avant toute application étendue.')
            """, (idx,))

        # Insert into FTS5 Index
        cur.execute("""
            INSERT INTO plant_fts (plant_id, scientific_name, french_name, arabic_name, synonyms, composition, activity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (idx, sci_name, fr_name, ar_name, f"{fr_notes} {ar_notes}", comp_raw, act_raw))

    conn.commit()

    # Integrity counts
    cur.execute("SELECT COUNT(*) FROM plant")
    total_plants = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM plant_name")
    total_names = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM plant_fts")
    total_fts = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM safety_flag")
    total_safety = cur.fetchone()[0]

    conn.close()

    # Compute SHA256 checksum for mobile sync manifest
    with open(output_db, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    file_size = os.path.getsize(output_db)

    manifest = {
        "db_version": "2.0.0",
        "sha256": sha256,
        "size_bytes": file_size,
        "total_plants": total_plants,
        "total_names": total_names,
        "fts_indexed_rows": total_fts,
        "safety_flags_count": total_safety,
        "generated_at": "2026-10-05"
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print("=== SQLITE BUILD SUCCESS ===")
    print(f"Database: {output_db} ({file_size / 1024:.1f} KB)")
    print(f"Total Plants: {total_plants}")
    print(f"Total Names Indexed: {total_names}")
    print(f"FTS5 Rows: {total_fts}")
    print(f"Safety Flags: {total_safety}")
    print(f"Manifest written to: {manifest_path}")

if __name__ == "__main__":
    main()
