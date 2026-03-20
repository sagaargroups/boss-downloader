// ============================================
// API: Direct stream download to browser (Save As)
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const quality = request.nextUrl.searchParams.get("quality") || "best";
  const format = request.nextUrl.searchParams.get("format") || "mp4";

  if (!url) {
    return new Response(
      `<script>alert("Download Error:\\nMissing URL parameter.");</script>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  // Create temp dir for this download
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "boss-dl-"));
  const outputTemplate = path.join(tmpDir, "%(title)s.%(ext)s");

  const formatMap: Record<string, string> = {
    best: "bestvideo+bestaudio/best",
    "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
    "720p": "bestvideo[height<=720]+bestaudio/best[height<=720]",
    "480p": "bestvideo[height<=480]+bestaudio/best[height<=480]",
    audio_only: "bestaudio",
  };

  const ytdlpArgs = [
    url,
    "-f", formatMap[quality] || formatMap.best,
    "--merge-output-format", format,
    "-o", outputTemplate,
    "--no-mtime",
    "--newline",
  ];

  return new Promise<Response>((resolve) => {
    const proc = spawn("yt-dlp", ytdlpArgs, { stdio: ["pipe", "pipe", "pipe"] });

    let errorOutput = "";

    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("error", (err) => {
      cleanup(tmpDir);
      resolve(new Response(
        `<script>alert("Download Failed: ${err.message}");</script>`,
        { status: 200, headers: { "Content-Type": "text/html" } }
      ));
    });

    proc.on("exit", (code) => {
      if (code !== 0) {
        cleanup(tmpDir);
        const safeError = errorOutput.replace(/"/g, "'").replace(/\n/g, "\\n").slice(0, 300);
        resolve(new Response(
          `<script>alert("Download Error:\\n${safeError}");</script>`,
          { status: 200, headers: { "Content-Type": "text/html" } }
        ));
        return;
      }

      // Find the downloaded file
      const files = fs.readdirSync(tmpDir).filter(f => !f.endsWith(".part") && !f.endsWith(".ytdl"));
      if (files.length === 0) {
        cleanup(tmpDir);
        resolve(new Response(
          `<script>alert("Download Error:\\nCompleted but no playable file found.");</script>`,
          { status: 200, headers: { "Content-Type": "text/html" } }
        ));
        return;
      }

      const filePath = path.join(tmpDir, files[0]);
      const stat = fs.statSync(filePath);
      const fileName = files[0];
      const fileStream = fs.createReadStream(filePath);

      const webStream = new ReadableStream({
        start(controller) {
          fileStream.on("data", (chunk: any) => {
            controller.enqueue(new Uint8Array(Buffer.from(chunk)));
          });
          fileStream.on("end", () => {
            controller.close();
            cleanup(tmpDir);
          });
          fileStream.on("error", (err) => {
            controller.error(err);
            cleanup(tmpDir);
          });
        },
      });

      resolve(new Response(webStream, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          "Content-Length": stat.size.toString(),
          "Cache-Control": "no-cache",
        },
      }));
    });
  });
}

function cleanup(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore cleanup errors
  }
}
