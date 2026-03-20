// ============================================
// API: Serve downloaded file to browser
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { getDownloadById } from "@/lib/db/supabase";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { success: false, error: "Download ID required" },
      { status: 400 }
    );
  }

  try {
    const download = await getDownloadById(id);

    if (!download) {
      return NextResponse.json(
        { success: false, error: "Download not found" },
        { status: 404 }
      );
    }

    if (!download.filePath) {
      return NextResponse.json(
        { success: false, error: "File path not available" },
        { status: 404 }
      );
    }

    const filePath = path.resolve(download.filePath);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "File not found on disk" },
        { status: 404 }
      );
    }

    const stat = fs.statSync(filePath);
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    // Convert Node ReadableStream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk: any) => {
          controller.enqueue(new Uint8Array(Buffer.from(chunk)));
        });
        fileStream.on("end", () => {
          controller.close();
        });
        fileStream.on("error", (err) => {
          controller.error(err);
        });
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
        "Content-Length": stat.size.toString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
