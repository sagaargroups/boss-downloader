// ============================================
// N_m3u8DL-RE Engine — HLS/DASH Stream Downloader
// ============================================

import { BaseEngine } from "./base";
import type {
  DownloadOptions,
  DownloadProcess,
  DownloadStatus,
  EngineName,
  VideoInfo,
} from "@/types";

export class Nm3u8Engine extends BaseEngine {
  name: EngineName = "nm3u8";

  private getBinaryPath(): string {
    return process.env.NM3U8DLRE_PATH || "N_m3u8DL-RE";
  }

  async detect(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const params = urlObj.search.toLowerCase();
      // Detect HLS/DASH manifest URLs
      return (
        path.endsWith(".m3u8") ||
        path.endsWith(".mpd") ||
        path.includes("/manifest") ||
        params.includes("m3u8") ||
        params.includes(".mpd")
      );
    } catch {
      return false;
    }
  }

  async getInfo(url: string): Promise<VideoInfo> {
    // N_m3u8DL-RE doesn't have a JSON info mode
    // Parse the manifest URL for basic info
    return {
      title: this.extractTitleFromUrl(url),
      thumbnail: null,
      duration: null,
      fileSize: null,
      platform: "unknown",
      description: "HLS/DASH Stream",
      uploader: null,
      formats: [
        {
          formatId: "stream",
          ext: "mp4",
          quality: "auto",
          filesize: null,
          vcodec: "h264",
          acodec: "aac",
          resolution: null,
        },
      ],
    };
  }

  download(url: string, options: DownloadOptions): DownloadProcess {
    const processId = this.generateProcessId();
    const title = this.extractTitleFromUrl(url);

    const args: string[] = [
      url,
      "--save-dir",
      options.outputDir,
      "--save-name",
      title,
      "--auto-select", // Auto-select best quality
      "--del-after-done", // Clean up temp segments
      "--log-level",
      "INFO",
    ];

    // If ffmpeg is available, auto-mux
    const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
    args.push("--ffmpeg-binary-path", ffmpegPath);

    const proc = this.spawnProcess(this.getBinaryPath(), args, processId);

    const downloadProcess: DownloadProcess = {
      processId,
      engineName: this.name,
      status: "downloading" as DownloadStatus,
      progress: 0,
      speed: null,
      eta: null,
    };

    // Parse N_m3u8DL-RE progress
    const handleOutput = (data: Buffer) => {
      const line = data.toString();
      const progress = this.parseNm3u8Progress(line);
      const speed = this.parseSpeed(line);

      if (progress !== null) downloadProcess.progress = progress;
      if (speed) downloadProcess.speed = speed;

      if (downloadProcess.onProgress) {
        downloadProcess.onProgress({
          downloadId: processId,
          progress: downloadProcess.progress,
          speed: downloadProcess.speed,
          eta: downloadProcess.eta,
          status: downloadProcess.status,
          fileSize: null,
        });
      }
    };

    proc.stdout?.on("data", handleOutput);
    proc.stderr?.on("data", handleOutput);

    proc.on("exit", (code) => {
      downloadProcess.status = code === 0 ? "completed" : "failed";
      downloadProcess.progress = code === 0 ? 100 : downloadProcess.progress;

      if (downloadProcess.onProgress) {
        downloadProcess.onProgress({
          downloadId: processId,
          progress: downloadProcess.progress,
          speed: null,
          eta: null,
          status: downloadProcess.status,
          fileSize: null,
        });
      }
    });

    return downloadProcess;
  }

  // ---- Parse N_m3u8DL-RE specific progress ----

  private parseNm3u8Progress(line: string): number | null {
    // N_m3u8DL-RE format: "Vid 50/100 Aud 50/100" or percentage
    const segMatch = line.match(/(\d+)\/(\d+)/);
    if (segMatch) {
      return Math.round(
        (parseInt(segMatch[1]) / parseInt(segMatch[2])) * 100
      );
    }
    return this.parsePercentage(line);
  }

  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      // Try to find a meaningful name from the URL path
      for (const part of pathParts.reverse()) {
        if (
          !part.includes(".m3u8") &&
          !part.includes(".mpd") &&
          part.length > 3
        ) {
          return decodeURIComponent(part.replace(/\.[^.]+$/, ""));
        }
      }
      return `stream-${Date.now()}`;
    } catch {
      return `stream-${Date.now()}`;
    }
  }
}
