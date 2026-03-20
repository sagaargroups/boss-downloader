// ============================================
// API: Queue Management
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getDownloads, getDownloadsByStatus, updateDownload, deleteDownload } from "@/lib/db/supabase";

export async function GET() {
  try {
    const downloads = await getDownloads();
    return NextResponse.json({ success: true, data: downloads });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to fetch queue",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "clear": {
        // Clear all queued downloads
        const queued = await getDownloadsByStatus("queued");
        for (const d of queued) {
          await deleteDownload(d.id);
        }
        return NextResponse.json({
          success: true,
          data: { cleared: queued.length },
        });
      }

      case "retry-all": {
        // Retry all failed
        const failed = await getDownloadsByStatus("failed");
        let retried = 0;
        for (const d of failed) {
          await updateDownload(d.id, {
            status: "queued",
            progress: 0,
            error: null,
          });
          retried++;
        }
        return NextResponse.json({
          success: true,
          data: { retried },
        });
      }

      case "pause-all": {
        const downloading = await getDownloadsByStatus("downloading");
        for (const d of downloading) {
          await updateDownload(d.id, { status: "paused" });
        }
        return NextResponse.json({
          success: true,
          data: { paused: downloading.length },
        });
      }

      case "resume-all": {
        const paused = await getDownloadsByStatus("paused");
        for (const d of paused) {
          await updateDownload(d.id, { status: "queued" });
        }
        return NextResponse.json({
          success: true,
          data: { resumed: paused.length },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Queue operation failed",
      },
      { status: 500 }
    );
  }
}
