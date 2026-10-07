import * as SQLite from 'expo-sqlite';
import plantsSeed from './plants_seed.json';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('plants.db');
    await initSchemaAndSeed(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

async function initSchemaAndSeed(db: SQLite.SQLiteDatabase): Promise<void> {
  // 1. Create Core Tables
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS plant (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accepted_name TEXT NOT NULL,
      family TEXT NOT NULL,
      region TEXT,
      part_used TEXT,
      composition_raw TEXT,
      activity_raw TEXT
    );

    CREATE TABLE IF NOT EXISTS plant_name (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT,
      kind TEXT DEFAULT 'vernacular',
      FOREIGN KEY(plant_id) REFERENCES plant(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS compound (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      chem_class TEXT
    );

    CREATE TABLE IF NOT EXISTS plant_compound (
      plant_id INTEGER NOT NULL,
      compound_id INTEGER NOT NULL,
      PRIMARY KEY (plant_id, compound_id),
      FOREIGN KEY(plant_id) REFERENCES plant(id) ON DELETE CASCADE,
      FOREIGN KEY(compound_id) REFERENCES compound(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS safety_flag (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER NOT NULL,
      flag TEXT NOT NULL,
      severity TEXT NOT NULL,
      note TEXT,
      FOREIGN KEY(plant_id) REFERENCES plant(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS journal_entry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plant_id INTEGER,
      plant_name TEXT NOT NULL,
      notes TEXT,
      photo_uri TEXT,
      latitude REAL,
      longitude REAL,
      watering_interval_days INTEGER DEFAULT 3,
      last_watered TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Create FTS5 Virtual Table (with graceful fallback if engine lacks FTS5)
  try {
    await db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS plant_fts USING fts5(
        plant_id UNINDEXED,
        scientific_name,
        french_name,
        arabic_name,
        family,
        region
      );
    `);
  } catch (e) {
    console.warn('FTS5 virtual table init warning:', e);
  }

  // 3. Seed data if table is empty
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT count(*) as count FROM plant'
  );

  if (!countRow || countRow.count === 0) {
    await seedPlantsData(db);
  }
}

async function seedPlantsData(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await db.withTransactionAsync(async () => {
      let plantId = 1;
      for (const p of plantsSeed as any[]) {
        const acceptedName = (p.scientific_name || '').replace(/^"|"$/g, '').trim();
        const family = p.family || 'Unknown';
        const region = p.region || null;
        const partUsed = p.part_used || null;
        const compRaw = p.composition || null;
        const actRaw = p.biological_activity || null;

        // Insert plant
        await db.runAsync(
          `INSERT INTO plant (id, accepted_name, family, region, part_used, composition_raw, activity_raw)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [plantId, acceptedName, family, region, partUsed, compRaw, actRaw]
        );

        // Insert french name
        if (p.french_name) {
          await db.runAsync(
            `INSERT INTO plant_name (plant_id, lang, name, notes, kind) VALUES (?, 'fr', ?, ?, 'vernacular')`,
            [plantId, p.french_name.trim(), p.french_notes || null]
          );
        }

        // Insert arabic name
        if (p.arabic_name) {
          const arName = (p.arabic_name || '').replace(/^"|"$/g, '').trim();
          await db.runAsync(
            `INSERT INTO plant_name (plant_id, lang, name, notes, kind) VALUES (?, 'ar', ?, ?, 'vernacular')`,
            [plantId, arName, p.arabic_notes || null]
          );
        }

        // Insert compound tags
        if (Array.isArray(p.composition_tags)) {
          for (const cTag of p.composition_tags) {
            if (!cTag) continue;
            await db.runAsync(
              `INSERT OR IGNORE INTO compound (name, chem_class) VALUES (?, 'secondary_metabolite')`,
              [cTag]
            );
            const compRow = await db.getFirstAsync<{ id: number }>(
              'SELECT id FROM compound WHERE name = ?',
              [cTag]
            );
            if (compRow) {
              await db.runAsync(
                `INSERT OR IGNORE INTO plant_compound (plant_id, compound_id) VALUES (?, ?)`,
                [plantId, compRow.id]
              );
            }
          }
        }

        // Insert default safety flags for known toxic families or abortifacient herbs
        if (family === 'Asteraceae') {
          await db.runAsync(
            `INSERT INTO safety_flag (plant_id, flag, severity, note)
             VALUES (?, 'allergy_risk', 'caution', 'Potential contact dermatitis / Asteraceae pollen sensitivity')`,
            [plantId]
          );
        }

        // Insert into FTS5
        try {
          await db.runAsync(
            `INSERT INTO plant_fts (plant_id, scientific_name, french_name, arabic_name, family, region)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              plantId,
              acceptedName,
              p.french_name || '',
              (p.arabic_name || '').replace(/^"|"$/g, ''),
              family,
              region || '',
            ]
          );
        } catch {
          // Ignore FTS insertion error if virtual table not supported
        }

        plantId++;
      }
    });
  } catch (err) {
    console.warn('Seeding plants database warning:', err);
  }
}

export interface PlantSearchResult {
  id: number;
  scientific_name: string;
  french_name: string;
  arabic_name: string;
  family: string;
}

export interface JournalEntry {
  id: number;
  plant_id?: number | null;
  plant_name: string;
  notes?: string;
  photo_uri?: string;
  latitude?: number | null;
  longitude?: number | null;
  watering_interval_days: number;
  last_watered?: string;
  created_at: string;
}

export async function searchPlantsOffline(query: string): Promise<PlantSearchResult[]> {
  const db = await getDatabase();
  const trimmed = (query || '').trim();

  // If query is blank, return sample list of diverse taxa
  if (trimmed.length < 2) {
    try {
      const rows = await db.getAllAsync<any>(
        `SELECT p.id, p.accepted_name as scientific_name, p.family,
                (SELECT name FROM plant_name WHERE plant_id = p.id AND lang = 'fr' LIMIT 1) as french_name,
                (SELECT name FROM plant_name WHERE plant_id = p.id AND lang = 'ar' LIMIT 1) as arabic_name
         FROM plant p
         ORDER BY p.id ASC
         LIMIT 20`
      );
      return rows.map((r: any) => ({
        id: r.id,
        scientific_name: r.scientific_name,
        french_name: r.french_name || '',
        arabic_name: r.arabic_name || '',
        family: r.family || '',
      }));
    } catch {
      return [];
    }
  }

  // 1. Attempt FTS5 Search
  try {
    const cleaned = trimmed.replace(/['"*]/g, '');
    const ftsQuery = `"${cleaned}"*`;
    const ftsRows = await db.getAllAsync<any>(
      `SELECT p.id, p.accepted_name as scientific_name, p.family, 
              fts.french_name, fts.arabic_name
       FROM plant_fts fts
       JOIN plant p ON p.id = fts.plant_id
       WHERE plant_fts MATCH ?
       LIMIT 25`,
      [ftsQuery]
    );

    if (ftsRows && ftsRows.length > 0) {
      return ftsRows.map((r: any) => ({
        id: r.id,
        scientific_name: r.scientific_name,
        french_name: r.french_name || '',
        arabic_name: r.arabic_name || '',
        family: r.family || '',
      }));
    }
  } catch (ftsErr) {
    // FTS5 unavailable or match syntax error - gracefully continue to SQL LIKE fallback
  }

  // 2. Robust SQL LIKE Fallback (guaranteed to work in all SQLite environments)
  try {
    const pattern = `%${trimmed}%`;
    const likeRows = await db.getAllAsync<any>(
      `SELECT DISTINCT p.id, p.accepted_name as scientific_name, p.family,
              (SELECT name FROM plant_name WHERE plant_id = p.id AND lang = 'fr' LIMIT 1) as french_name,
              (SELECT name FROM plant_name WHERE plant_id = p.id AND lang = 'ar' LIMIT 1) as arabic_name
       FROM plant p
       LEFT JOIN plant_name pn ON pn.plant_id = p.id
       WHERE p.accepted_name LIKE ?
          OR p.family LIKE ?
          OR pn.name LIKE ?
       ORDER BY p.accepted_name ASC
       LIMIT 25`,
      [pattern, pattern, pattern]
    );

    return likeRows.map((r: any) => ({
      id: r.id,
      scientific_name: r.scientific_name,
      french_name: r.french_name || '',
      arabic_name: r.arabic_name || '',
      family: r.family || '',
    }));
  } catch (likeErr) {
    console.warn('Fallback LIKE search error:', likeErr);
    return [];
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM journal_entry ORDER BY id DESC'
  );
  return rows.map((r: any) => ({
    id: r.id,
    plant_id: r.plant_id,
    plant_name: r.plant_name,
    notes: r.notes || '',
    photo_uri: r.photo_uri || '',
    latitude: r.latitude,
    longitude: r.longitude,
    watering_interval_days: r.watering_interval_days || 3,
    last_watered: r.last_watered,
    created_at: r.created_at,
  }));
}

export async function addJournalEntry(entry: {
  plant_id?: number | null;
  plant_name: string;
  notes?: string;
  photo_uri?: string;
  latitude?: number | null;
  longitude?: number | null;
  watering_interval_days?: number;
}): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const res = await db.runAsync(
    `INSERT INTO journal_entry (plant_id, plant_name, notes, photo_uri, latitude, longitude, watering_interval_days, last_watered)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.plant_id ?? null,
      entry.plant_name,
      entry.notes ?? '',
      entry.photo_uri ?? '',
      entry.latitude ?? null,
      entry.longitude ?? null,
      entry.watering_interval_days ?? 3,
      today,
    ]
  );
  return res.lastInsertRowId;
}

export async function deleteJournalEntry(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM journal_entry WHERE id = ?', [id]);
}

export async function markPlantWatered(id: number): Promise<void> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync('UPDATE journal_entry SET last_watered = ? WHERE id = ?', [today, id]);
}
