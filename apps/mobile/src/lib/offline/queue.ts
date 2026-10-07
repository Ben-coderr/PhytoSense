/**
 * 🌿 PhytoSense v2 Offline Action Queue
 * Enables robust offline-first botanical observations in remote areas.
 * Actions are persisted locally in SQLite and synchronized automatically upon reconnection.
 */

import { getDatabase } from '../db/sqlite';
import { getApiBaseUrl } from '../api/client';

export type ActionType =
  | 'OBSERVATION_CREATED'
  | 'WATERING_LOGGED'
  | 'DIAGNOSIS_REQUEST'
  | 'FIELD_NOTE_ADDED';

export type ActionStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueuedAction {
  id: number;
  action_type: ActionType;
  payload: Record<string, any>;
  status: ActionStatus;
  retry_count: number;
  created_at: string;
  last_attempt_at?: string | null;
  error_message?: string | null;
}

let tableInitialized = false;

/**
 * Initialize offline action queue table in SQLite
 */
export async function initQueueTable(): Promise<void> {
  if (tableInitialized) return;
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_action_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_attempt_at TEXT,
      error_message TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_offline_queue_status ON offline_action_queue(status);
  `);
  tableInitialized = true;
}

/**
 * Enqueue a new action to be synchronized when network is available
 */
export async function enqueueAction(
  actionType: ActionType,
  payload: Record<string, any>
): Promise<number> {
  await initQueueTable();
  const db = await getDatabase();
  const res = await db.runAsync(
    `INSERT INTO offline_action_queue (action_type, payload_json, status, retry_count)
     VALUES (?, ?, 'pending', 0)`,
    [actionType, JSON.stringify(payload)]
  );
  return res.lastInsertRowId;
}

/**
 * Retrieve all pending or failed actions for synchronization
 */
export async function getPendingActions(limit = 50): Promise<QueuedAction[]> {
  await initQueueTable();
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM offline_action_queue
     WHERE status IN ('pending', 'failed') AND retry_count < 5
     ORDER BY id ASC
     LIMIT ?`,
    [limit]
  );

  return rows.map((r: any) => ({
    id: r.id,
    action_type: r.action_type as ActionType,
    payload: JSON.parse(r.payload_json || '{}'),
    status: r.status as ActionStatus,
    retry_count: r.retry_count || 0,
    created_at: r.created_at,
    last_attempt_at: r.last_attempt_at,
    error_message: r.error_message,
  }));
}

/**
 * Get statistical metrics on the offline queue
 */
export async function getQueueStats(): Promise<{
  pending: number;
  synced: number;
  failed: number;
  total: number;
}> {
  await initQueueTable();
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT status, COUNT(*) as count FROM offline_action_queue GROUP BY status`
  );

  const stats = { pending: 0, synced: 0, failed: 0, total: 0 };
  for (const row of rows) {
    if (row.status === 'pending') stats.pending = row.count;
    else if (row.status === 'synced') stats.synced = row.count;
    else if (row.status === 'failed') stats.failed = row.count;
    stats.total += row.count;
  }
  return stats;
}

/**
 * Synchronize all pending actions with the backend API
 */
export async function syncOfflineQueue(
  apiBaseUrl = getApiBaseUrl()
): Promise<{ processed: number; succeeded: number; failed: number }> {

  const pending = await getPendingActions();
  if (pending.length === 0) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const db = await getDatabase();
  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    const now = new Date().toISOString();
    // Mark as syncing
    await db.runAsync(
      `UPDATE offline_action_queue SET status = 'syncing', last_attempt_at = ? WHERE id = ?`,
      [now, item.id]
    );

    try {
      let endpoint = '';
      let method = 'POST';
      let bodyData = item.payload;

      switch (item.action_type) {
        case 'OBSERVATION_CREATED':
          endpoint = `${apiBaseUrl}/v1/observations`;
          break;
        case 'WATERING_LOGGED':
          endpoint = `${apiBaseUrl}/v1/watering`;
          break;
        case 'DIAGNOSIS_REQUEST':
          endpoint = `${apiBaseUrl}/v1/diagnose`;
          break;
        case 'FIELD_NOTE_ADDED':
          endpoint = `${apiBaseUrl}/v1/field-notes`;
          break;
        default:
          endpoint = `${apiBaseUrl}/v1/sync`;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        await db.runAsync(
          `UPDATE offline_action_queue SET status = 'synced', error_message = NULL WHERE id = ?`,
          [item.id]
        );
        succeeded++;
      } else {
        const errorText = await response.text();
        await db.runAsync(
          `UPDATE offline_action_queue 
           SET status = 'failed', retry_count = retry_count + 1, error_message = ? 
           WHERE id = ?`,
          [`HTTP ${response.status}: ${errorText.substring(0, 200)}`, item.id]
        );
        failed++;
      }
    } catch (err: any) {
      await db.runAsync(
        `UPDATE offline_action_queue 
         SET status = 'failed', retry_count = retry_count + 1, error_message = ? 
         WHERE id = ?`,
        [err?.message || 'Network connectivity error', item.id]
      );
      failed++;
    }
  }

  return { processed: pending.length, succeeded, failed };
}

/**
 * Clear synced items older than 7 days to keep database lean
 */
export async function purgeSyncedQueue(): Promise<number> {
  await initQueueTable();
  const db = await getDatabase();
  const res = await db.runAsync(
    `DELETE FROM offline_action_queue 
     WHERE status = 'synced' AND created_at < datetime('now', '-7 days')`
  );
  return res.changes;
}
