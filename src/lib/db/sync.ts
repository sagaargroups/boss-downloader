// ============================================
// Offline Sync Engine — Local ↔ Supabase
// ============================================

import {
  getSyncQueue,
  removeSyncItem,
  clearSyncQueue,
  localGetDownloads,
  localCreateDownload,
  localUpdateDownload,
  localDeleteDownload,
} from "./dexie";
import {
  getDownloads as remoteGetDownloads,
  createDownload as remoteCreateDownload,
  updateDownload as remoteUpdateDownload,
  deleteDownload as remoteDeleteDownload,
  checkSupabaseConnection,
} from "./supabase";
import type { Download, DownloadRow } from "@/types";

// ---- Online/Offline Detection ----

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export async function isSupabaseReachable(): Promise<boolean> {
  if (!isOnline()) return false;
  return checkSupabaseConnection();
}

// ---- Convert Download → DownloadRow for Supabase ----

function downloadToRow(d: Download): Partial<DownloadRow> {
  return {
    id: d.id,
    url: d.url,
    title: d.title,
    platform: d.platform,
    engine: d.engine,
    status: d.status,
    progress: d.progress,
    file_size: d.fileSize,
    file_path: d.filePath,
    format: d.format,
    quality: d.quality,
    speed: d.speed,
    eta: d.eta,
    error: d.error,
    metadata: d.metadata as Record<string, unknown> | null,
  };
}

// ---- Process Sync Queue ----

export async function processQueue(): Promise<{
  synced: number;
  failed: number;
}> {
  const reachable = await isSupabaseReachable();
  if (!reachable) return { synced: 0, failed: 0 };

  const queue = await getSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      switch (item.operation) {
        case "create":
          await remoteCreateDownload(item.data as Partial<DownloadRow>);
          break;
        case "update":
          await remoteUpdateDownload(
            item.recordId,
            item.data as Partial<DownloadRow>
          );
          break;
        case "delete":
          await remoteDeleteDownload(item.recordId);
          break;
      }
      if (item.id) await removeSyncItem(item.id);
      synced++;
    } catch (err) {
      console.warn(`[Sync] Failed to sync item ${item.id}:`, err);
      failed++;
    }
  }

  return { synced, failed };
}

// ---- Full Sync: Remote → Local ----

export async function syncRemoteToLocal(): Promise<number> {
  const reachable = await isSupabaseReachable();
  if (!reachable) return 0;

  try {
    const remoteDownloads = await remoteGetDownloads();
    const localDownloads = await localGetDownloads();
    const localMap = new Map(localDownloads.map((d) => [d.id, d]));
    let synced = 0;

    for (const remote of remoteDownloads) {
      const local = localMap.get(remote.id);
      if (!local) {
        // New record from remote
        await localCreateDownload(remote);
        synced++;
      } else if (remote.updatedAt > local.updatedAt) {
        // Remote is newer — update local
        await localUpdateDownload(remote.id, remote);
        synced++;
      }
    }

    return synced;
  } catch (err) {
    console.warn("[Sync] Failed to sync remote to local:", err);
    return 0;
  }
}

// ---- Full Sync: Local → Remote ----

export async function syncLocalToRemote(): Promise<number> {
  // First process the explicit sync queue
  const { synced } = await processQueue();
  return synced;
}

// ---- Full Bidirectional Sync ----

export async function fullSync(): Promise<{
  localToRemote: number;
  remoteToLocal: number;
}> {
  const localToRemote = await syncLocalToRemote();
  const remoteToLocal = await syncRemoteToLocal();
  return { localToRemote, remoteToLocal };
}

// ---- Auto-Sync Setup (call once in app root) ----

export function setupAutoSync(intervalMs: number = 30000): () => void {
  // Sync on coming back online
  const handleOnline = () => {
    console.log("[Sync] Back online — syncing...");
    fullSync();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
  }

  // Periodic sync
  const interval = setInterval(() => {
    if (isOnline()) {
      fullSync();
    }
  }, intervalMs);

  // Return cleanup function
  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
    }
    clearInterval(interval);
  };
}
