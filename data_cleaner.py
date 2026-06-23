import pandas as pd
import json
import sqlite3
import re
import os

file_path = "/Users/mac/Downloads/Work/PhytoSense/tableau 2 (EnregistrA\u0303\u00a9 automatiquement) (EnregistrA\u0303\u00a9 automatiquement).xlsx"

# Activity and composition keywords for tagging
COMPOSITION_KEYWORDS = ['alcalo\u00efde', 'flavono\u00efde', 'polyphenol', 'polyph\u00e9nol', 'terp\u00e8ne', 'monoterp\u00e8ne', 'sesquiterp\u00e8ne', 'tanin', 'saponine', 'coumarine', 'huile essentielle', 'prot\u00e9ine', 'acide', 'vitamine']
ACTIVITY_KEYWORDS = ['antioxydant', 'anti-oxydant', 'antibact\u00e9rien', 'anti-bact\u00e9rien', 'antimicrobien', 'antifongique', 'anti-inflammatoire', 'antidiab\u00e9tique', 'anticanc\u00e9reux', 'antitumoral', 'analg\u00e9sique', 'antispasmodique', 'cicatrisant', 'diur\u00e9tique']

def clean_junk(text):
    if not isinstance(text, str):
        return None
    text = text.strip()
    if re.match(r'^[\/\-\s]+$', text):
        return None
    return text if text else None

def split_name(text):
    if not isinstance(text, str):
        return None, None
    text = text.strip()
    if not text or re.match(r'^[\/\-\s]+$', text):
        return None, None
        
    notes = []
    # If the text has obvious descriptive prefixes
    if 'En tamahaq' in text or 'En arabe' in text or 'En francais' in text:
        return None, text
        
    # Split by 'ou' or '('
    match = re.split(r'\s+ou\s+|\(', text, 1)
    if len(match) > 1:
        name = match[0].strip()
        note = text[len(name):].strip()
        # Clean up note if it starts with 'ou ' or '('
        if note.startswith('ou '): note = note[3:].strip()
        if note.startswith('(') and note.endswith(')'): note = note[1:-1].strip()
        elif note.startswith('('): note = note[1:].strip()
        return name, note
    
    # Split by comma if it looks like a list with notes
    if ',' in text:
        parts = [p.strip() for p in text.split(',')]
        name = parts[0]
        note = ', '.join(parts[1:])
        return name, note

    return text, None

def extract_tags(text, keywords):
    if not isinstance(text, str):
        return []
    text_lower = text.lower()
    tags = []
    for kw in keywords:
        if kw in text_lower:
            # normalize some tags
            if kw in ['polyph\u00e9nol']: kw = 'polyphenol'
            if kw in ['anti-oxydant']: kw = 'antioxydant'
            if kw in ['anti-bact\u00e9rien']: kw = 'antibact\u00e9rien'
            if kw not in tags:
                tags.append(kw)
    return tags

def main():
    df = pd.read_excel(file_path)
    
    # Filter out unnamed columns
    cols = [c for c in df.columns if not c.startswith("Unnamed")]
    df = df[cols]
    
    # Map to standardized column names
    col_map = {
        cols[0]: 'arabic_name',
        cols[1]: 'french_name',
        cols[2]: 'scientific_name',
        cols[3]: 'region',
        cols[4]: 'part_used',
        cols[5]: 'composition',
        cols[6]: 'biological_activity',
        cols[7]: 'family',
        cols[8]: 'author'
    }
    df = df.rename(columns=col_map)
    
    # Clean junk
    for c in df.columns:
        df[c] = df[c].apply(clean_junk)
        
    # Drop rows with entirely null values in key fields
    df = df.dropna(subset=['scientific_name', 'arabic_name', 'french_name'], how='all')
    
    initial_rows = len(df)
    
    # Handle duplicates (Calobota saharae)
    # Aggregate text fields with newlines
    agg_funcs = {
        'arabic_name': 'first',
        'french_name': 'first',
        'region': lambda x: '\n'.join(x.dropna().unique()),
        'part_used': lambda x: '\n'.join(x.dropna().unique()),
        'composition': lambda x: '\n'.join(x.dropna().unique()),
        'biological_activity': lambda x: '\n'.join(x.dropna().unique()),
        'family': 'first',
        'author': lambda x: '\n'.join(x.dropna().unique())
    }
    df = df.groupby('scientific_name', as_index=False, dropna=False).agg(agg_funcs)
    
    final_rows = len(df)
    
    split_count = 0
    total_tags = 0
    
    cleaned_records = []
    
    for _, row in df.iterrows():
        record = row.to_dict()
        
        # Split names
        ar_name, ar_notes = split_name(record['arabic_name'])
        fr_name, fr_notes = split_name(record['french_name'])
        
        record['arabic_name'] = ar_name
        record['arabic_notes'] = ar_notes
        record['french_name'] = fr_name
        record['french_notes'] = fr_notes
        
        if ar_notes or fr_notes:
            split_count += 1
            
        # Extract tags
        comp_tags = extract_tags(record['composition'], COMPOSITION_KEYWORDS)
        act_tags = extract_tags(record['biological_activity'], ACTIVITY_KEYWORDS)
        
        record['composition_tags'] = comp_tags
        record['activity_tags'] = act_tags
        
        total_tags += len(comp_tags) + len(act_tags)
        
        # Ensure tags are serialized well (store as comma separated string for DB, list for JSON)
        record['composition_tags_str'] = ','.join(comp_tags)
        record['activity_tags_str'] = ','.join(act_tags)
        
        cleaned_records.append(record)

    # Calculate average
    avg_tags = total_tags / len(cleaned_records) if cleaned_records else 0

    # Print summary
    print("=== DATA CLEANING SUMMARY ===")
    print(f"Initial Rows: {initial_rows}")
    print(f"Final Rows (after resolving duplicates): {final_rows}")
    print(f"Rows with Name Fields Split: {split_count}")
    print(f"Average Tags Extracted per Plant: {avg_tags:.2f}")
    
    # Save to JSON
    json_path = "plants.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        # Strip the _str fields for json
        json_records = [{k: v for k, v in r.items() if not k.endswith('_str')} for r in cleaned_records]
        json.dump(json_records, f, ensure_ascii=False, indent=2)
        
    # Save to SQLite
    db_path = "plants.db"
    if os.path.exists(db_path):
        os.remove(db_path)
    conn = sqlite3.connect(db_path)
    
    # Create dataframe for sql
    sql_df = pd.DataFrame(cleaned_records)
    sql_df.drop(columns=['composition_tags', 'activity_tags'], inplace=True)
    sql_df.rename(columns={'composition_tags_str': 'composition_tags', 'activity_tags_str': 'activity_tags'}, inplace=True)
    
    # Add an auto-incrementing id column starting from 1
    sql_df.insert(0, 'id', range(1, len(sql_df) + 1))
    
    sql_df.to_sql('plants', conn, index=False, if_exists='replace')
    conn.close()

if __name__ == "__main__":
    main()
