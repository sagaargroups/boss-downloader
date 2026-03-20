// ============================================
// Dexie.js — IndexedDB Offline Fallback
// ============================================

import Dexie, { type Table } from "dexie";
import type { Download, DownloadStatus } from "@/types";

// ---- Database Definition ----

export class BossDownloaderDB extends Dexie {
  downloads!: Table<Download, string>;
  settings!: Table<{ key: string; value: unknown; updatedAt: string }, string>;
  syncQueue!: Table<
    {
      id?: number;
      operation: "create" | "update" | "delete";
      table: string;
      recordId: string;
      data: Record<string, unknown>;
      timestamp: string;
    },
    number
  >;

  constructor() {
    super("BossDownloaderDB");

    this.version(1).stores({
      downloads:
        "id, url, platform, engine, status, progress, createdAt, updatedAt",
      settings: "key, updatedAt",
      syncQueue: "++id, operation, table, recordId, timestamp",
    });
  }
}

export const db = new BossDownloaderDB();

// ---- Downloads CRUD (mirrors Supabase API) ----

export async function localGetDownloads(): Promise<Download[]> {
  return db.downloads.orderBy("createdAt").reverse().toArray();
}

export async function localGetDownloadById(
  id: string
): Promise<Download | undefined> {
  return db.downloads.get(id);
}

export async function localGetDownloadsByStatus(
  status: DownloadStatus
): Promise<Download[]> {
  return db.downloads
    .where("status")
    .equals(status)
    .reverse()
    .sortBy("createdAt");
}

export async function localCreateDownload(
  download: Download
): Promise<string> {
  return db.downloads.add(download);
}

export async function localUpdateDownload(
  id: string,
  updates: Partial<Download>
): Promise<void> {
  await db.downloads.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function localDeleteDownload(id: string): Promise<void> {
  await db.downloads.delete(id);
}

// ---- Settings CRUD ----

export async function localGetSettings(): Promise<Record<string, unknown>> {
  const rows = await db.settings.toArray();
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function localUpdateSetting(
  key: string,
  value: unknown
): Promise<void> {
  await db.settings.put({
    key,
    value,
    updatedAt: new Date().toISOString(),
  });
}

// ---- Sync Queue ----

export async function addToSyncQueue(
  operation: "create" | "update" | "delete",
  table: string,
  recordId: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  await db.syncQueue.add({
    operation,
    table,
    recordId,
    data,
    timestamp: new Date().toISOString(),
  });
}

export async function getSyncQueue() {
  return db.syncQueue.orderBy("timestamp").toArray();
}

export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear();
}

export async function removeSyncItem(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}
