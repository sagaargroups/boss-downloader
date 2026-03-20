// ============================================
// Queue Manager — Download Queue Orchestrator
// ============================================

import type { Download, DownloadOptions, EngineName, DownloadStatus } from "@/types";
import { detectPlatform } from "../url-detector";
import { generateId } from "../utils";

// In-memory queue (for worker process)
let queue: Download[] = [];
let maxConcurrent = parseInt(process.env.MAX_CONCURRENT_DOWNLOADS || "3");

// ---- Queue Operations ----

export function addToQueue(
  url: string,
  options?: Partial<DownloadOptions>
): Download {
  const detection = detectPlatform(url);

  const download: Download = {
    id: generateId(),
    url,
    title: null,
    platform: detection.platform,
    engine: (options?.engine || detection.recommendedEngine) as EngineName,
    status: "queued" as DownloadStatus,
    progress: 0,
    fileSize: null,
    filePath: null,
    format: options?.format || "mp4",
    quality: options?.quality || "best",
    speed: null,
    eta: null,
    error: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  queue.push(download);
  return download;
}

export function addBulkToQueue(
  urls: string[],
  options?: Partial<DownloadOptions>
): Download[] {
  return urls.map((url) => addToQueue(url, options));
}

export function removeFromQueue(id: string): boolean {
  const index = queue.findIndex((d) => d.id === id);
  if (index === -1) return false;
  queue.splice(index, 1);
  return true;
}

export function reorderQueue(id: string, newPosition: number): boolean {
  const index = queue.findIndex((d) => d.id === id);
  if (index === -1) return false;

  const [item] = queue.splice(index, 1);
  queue.splice(Math.max(0, Math.min(newPosition, queue.length)), 0, item);
  return true;
}

export function clearQueue(): void {
  queue = queue.filter(
    (d) => d.status === "downloading" || d.status === "paused"
  );
}

export function retryFailed(id: string): boolean {
  const download = queue.find((d) => d.id === id);
  if (!download || download.status !== "failed") return false;

  download.status = "queued";
  download.progress = 0;
  download.error = null;
  download.updatedAt = new Date().toISOString();
  return true;
}

export function retryAllFailed(): number {
  let count = 0;
  for (const d of queue) {
    if (d.status === "failed") {
      d.status = "queued";
      d.progress = 0;
      d.error = null;
      d.updatedAt = new Date().toISOString();
      count++;
    }
  }
  return count;
}

// ---- Queue State ----

export function getQueueStatus(): {
  total: number;
  queued: number;
  downloading: number;
  paused: number;
  completed: number;
  failed: number;
  cancelled: number;
} {
  return {
    total: queue.length,
    queued: queue.filter((d) => d.status === "queued").length,
    downloading: queue.filter((d) => d.status === "downloading").length,
    paused: queue.filter((d) => d.status === "paused").length,
    completed: queue.filter((d) => d.status === "completed").length,
    failed: queue.filter((d) => d.status === "failed").length,
    cancelled: queue.filter((d) => d.status === "cancelled").length,
  };
}

export function getQueue(): Download[] {
  return [...queue];
}

export function getNextPending(): Download | null {
  const activeCount = queue.filter(
    (d) => d.status === "downloading"
  ).length;
  if (activeCount >= maxConcurrent) return null;

  return queue.find((d) => d.status === "queued") || null;
}

export function updateQueueItem(
  id: string,
  updates: Partial<Download>
): boolean {
  const download = queue.find((d) => d.id === id);
  if (!download) return false;

  Object.assign(download, updates, {
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export function setMaxConcurrent(max: number): void {
  maxConcurrent = Math.max(1, Math.min(10, max));
}
