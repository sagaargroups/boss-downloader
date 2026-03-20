// ============================================
// Download Executor — Bridges API → Engine → DB
// ============================================

import { getEngineManager } from "@/lib/engines/manager";
import { updateDownload } from "@/lib/db/supabase";
import type { Download, EngineName, DownloadProcess } from "@/types";

// Track active download processes in memory
const activeDownloads = new Map<string, DownloadProcess>();

export async function startDownload(download: Download): Promise<void> {
  const manager = getEngineManager();
  const engineName = download.engine as EngineName;
  const engine = manager.getEngine(engineName);

  const outputDir = process.env.DOWNLOAD_OUTPUT_DIR || "./downloads";

  try {
    // 1. Update status to "detecting"
    await updateDownload(download.id, { status: "detecting" });

    // 2. Try to get video info for title (with 15s timeout)
    try {
      const infoPromise = engine.getInfo(download.url);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Info fetch timeout")), 15000)
      );
      
      const info = await Promise.race([infoPromise, timeoutPromise]);
      await updateDownload(download.id, {
        title: info.title,
        metadata: {
          thumbnail: info.thumbnail,
          duration: info.duration,
          description: info.description,
          uploader: info.uploader,
          formats: info.formats,
        } as any,
      });
    } catch (infoErr) {
      console.warn(`[Executor] Could not fetch info for ${download.url}:`, infoErr);
      // Non-fatal — continue with download
    }

    // 3. Start the actual download
    await updateDownload(download.id, { status: "downloading", progress: 0 });

    const proc = engine.download(download.url, {
      quality: download.quality || "best",
      format: download.format || "mp4",
      engine: engineName,
      outputDir,
    });

    activeDownloads.set(download.id, proc);

    // 4. Wire up progress callback to update DB (throttled to 1 update per 2s)
    let lastDbUpdate = 0;
    proc.onProgress = async (event) => {
      const now = Date.now();
      const isFinal = event.status === "completed" || event.status === "failed";
      
      // Only write to DB at most once every 2 seconds, or on final status
      if (!isFinal && now - lastDbUpdate < 2000) return;
      lastDbUpdate = now;

      try {
        const updates: Record<string, any> = {
          progress: event.progress,
          status: event.status,
        };
        if (event.speed) updates.speed = event.speed;
        if (event.eta) updates.eta = event.eta;
        if (event.fileSize) updates.fileSize = event.fileSize;
        // Save file path on completion
        if ((event as any).filePath) updates.filePath = (event as any).filePath;

        await updateDownload(download.id, updates);

        // Clean up when done
        if (isFinal) {
          activeDownloads.delete(download.id);
        }
      } catch (err) {
        console.error(`[Executor] Failed to update progress for ${download.id}:`, err);
      }
    };
  } catch (err) {
    console.error(`[Executor] Failed to start download ${download.id}:`, err);
    await updateDownload(download.id, {
      status: "failed",
      error: err instanceof Error ? err.message : "Engine failed to start",
    } as any);
  }
}

export async function pauseDownload(downloadId: string): Promise<boolean> {
  const proc = activeDownloads.get(downloadId);
  if (!proc) return false;

  const manager = getEngineManager();
  const engine = manager.getEngine(proc.engineName);
  await engine.pause(proc.processId);
  await updateDownload(downloadId, { status: "paused" });
  return true;
}

export async function resumeDownload(downloadId: string): Promise<boolean> {
  const proc = activeDownloads.get(downloadId);
  if (!proc) return false;

  const manager = getEngineManager();
  const engine = manager.getEngine(proc.engineName);
  await engine.resume(proc.processId);
  await updateDownload(downloadId, { status: "downloading" });
  return true;
}

export async function cancelDownload(downloadId: string): Promise<boolean> {
  const proc = activeDownloads.get(downloadId);
  if (!proc) return false;

  const manager = getEngineManager();
  const engine = manager.getEngine(proc.engineName);
  await engine.cancel(proc.processId);
  activeDownloads.delete(downloadId);
  await updateDownload(downloadId, { status: "cancelled" });
  return true;
}

export function getActiveDownloadIds(): string[] {
  return Array.from(activeDownloads.keys());
}
