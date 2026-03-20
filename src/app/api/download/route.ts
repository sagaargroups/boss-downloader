// ============================================
// API: Start Download
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { detectPlatform } from "@/lib/url-detector";
import { createDownload, updateDownload as dbUpdateDownload, getDownloadById, deleteDownload as deleteDownloadRecord } from "@/lib/db/supabase";
import { startDownload, pauseDownload, resumeDownload, cancelDownload } from "@/lib/executor";
import type { StartDownloadRequest, BulkDownloadRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if bulk download
    if (body.urls && Array.isArray(body.urls)) {
      return handleBulkDownload(body as BulkDownloadRequest);
    }

    return handleSingleDownload(body as StartDownloadRequest);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: "id and action are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "pause": {
        const inMemory = await pauseDownload(id);
        if (!inMemory) {
          // Process not in memory — just update DB
          await dbUpdateDownload(id, { status: "paused" });
        }
        break;
      }
      case "resume": {
        const inMemory = await resumeDownload(id);
        if (!inMemory) {
          // Process not in memory — re-queue for new download
          const download = await getDownloadById(id);
          if (download) {
            await dbUpdateDownload(id, { status: "queued", progress: 0, error: null } as any);
            startDownload({ ...download, status: "queued" } as any).catch(console.error);
          }
        }
        break;
      }
      case "cancel": {
        const inMemory = await cancelDownload(id);
        if (!inMemory) {
          await dbUpdateDownload(id, { status: "cancelled" });
        }
        break;
      }
      case "retry": {
        const download = await getDownloadById(id);
        if (download) {
          await dbUpdateDownload(id, { status: "queued", progress: 0, error: null } as any);
          startDownload({ ...download, status: "queued" } as any).catch(console.error);
        }
        break;
      }
      case "remove": {
        await cancelDownload(id); // Kill process if running
        await deleteDownloadRecord(id);
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: { action, applied: true } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 }
    );
  }
}

async function handleSingleDownload(body: StartDownloadRequest) {
  const { url, quality, format, engine } = body;

  if (!url) {
    return NextResponse.json(
      { success: false, error: "URL is required" },
      { status: 400 }
    );
  }

  const detection = detectPlatform(url);
  if (!detection.isValid) {
    return NextResponse.json(
      { success: false, error: "Invalid URL" },
      { status: 400 }
    );
  }

  try {
    // If it's a playlist, do asynchronous flattening to populate the DB one by one!
    if (url.includes("list=") || url.includes("/playlist") || url.includes("/sets/")) {
      // Spawn yt-dlp in the background and return immediately so UI sees it adding items
      const { spawn } = require("child_process");
      const proc = spawn("yt-dlp", ["--flat-playlist", "--dump-json", url]);

      proc.stdout.on("data", async (data: Buffer) => {
        const lines = data.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const info = JSON.parse(line);
            const videoUrl = info.webpage_url || info.url || url;
            const singleDetection = detectPlatform(videoUrl);
            await createDownload({
              url: videoUrl,
              title: info.title || "Playlist Item",
              platform: singleDetection.isValid ? singleDetection.platform : "unknown",
              engine: engine || singleDetection.recommendedEngine,
              status: "queued",
              quality: quality || "best",
              format: format || "mp4",
              progress: 0,
            });
          } catch (e) {
            // ignore JSON parse errors on partial chunks
          }
        }
      });

      proc.on("error", (err: any) => console.error("Playlist parse error", err));

      return NextResponse.json({
        success: true,
        data: { id: "playlist", url, status: "parsing", title: "Adding Playlist..." },
      });
    }

    // Normal single video download
    const download = await createDownload({
      url,
      platform: detection.platform,
      engine: engine || detection.recommendedEngine,
      status: "queued",
      quality: quality || "best",
      format: format || "mp4",
      progress: 0,
    });

    return NextResponse.json({
      success: true,
      data: download,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create download",
      },
      { status: 500 }
    );
  }
}

async function handleBulkDownload(body: BulkDownloadRequest) {
  const { urls, quality, format, engine } = body;

  if (!urls || urls.length === 0) {
    return NextResponse.json(
      { success: false, error: "URLs array is required" },
      { status: 400 }
    );
  }

  const results = [];
  const errors = [];

  for (const url of urls) {
    const detection = detectPlatform(url);
    if (!detection.isValid) {
      errors.push({ url, error: "Invalid URL" });
      continue;
    }

    try {
      // If it's a playlist, do asynchronous flattening to populate the DB one by one!
      if (url.includes("list=") || url.includes("/playlist") || url.includes("/sets/")) {
        const { spawn } = require("child_process");
        const proc = spawn("yt-dlp", ["--flat-playlist", "--dump-json", url]);

        proc.stdout.on("data", async (data: Buffer) => {
          const lines = data.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const info = JSON.parse(line);
              const videoUrl = info.webpage_url || info.url || url;
              const singleDetection = detectPlatform(videoUrl);
              await createDownload({
                url: videoUrl,
                title: info.title || "Playlist Item",
                platform: singleDetection.isValid ? singleDetection.platform : "unknown",
                engine: engine || singleDetection.recommendedEngine,
                status: "queued",
                quality: quality || "best",
                format: format || "mp4",
                progress: 0,
              });
            } catch (e) {
              // ignore JSON parse errors
            }
          }
        });

        proc.on("error", (err: any) => console.error("Playlist parse error", err));
        
        results.push({ id: "playlist", url, status: "parsing", title: "Adding Playlist..." } as any);
        continue; // Skip the single createDownload
      }

      const download = await createDownload({
        url,
        platform: detection.platform,
        engine: engine || detection.recommendedEngine,
        status: "queued",
        quality: quality || "best",
        format: format || "mp4",
        progress: 0,
      });

      results.push(download);
    } catch (err) {
      errors.push({
        url,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: { created: results, errors },
  });
}

