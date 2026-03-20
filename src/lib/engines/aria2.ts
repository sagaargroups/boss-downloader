// ============================================
// aria2 Engine — Multi-Connection Accelerator
// ============================================

import { BaseEngine } from "./base";
import type {
  DownloadOptions,
  DownloadProcess,
  DownloadStatus,
  EngineName,
  VideoInfo,
} from "@/types";
import https from "https";
import http from "http";

export class Aria2Engine extends BaseEngine {
  name: EngineName = "aria2";

  private getBinaryPath(): string {
    return process.env.ARIA2C_PATH || "aria2c";
  }

  async detect(url: string): Promise<boolean> {
    // aria2 is best for direct file URLs
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const directExts = [
        ".mp4", ".mkv", ".webm", ".avi", ".mov",
        ".mp3", ".flac", ".wav", ".ogg",
        ".zip", ".rar", ".7z", ".tar",
      ];
      return directExts.some((ext) => path.endsWith(ext));
    } catch {
      return false;
    }
  }

  async getInfo(url: string): Promise<VideoInfo> {
    // aria2 doesn't have metadata extraction — use HTTP HEAD
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === "https:" ? https : http;

      const req = client.request(url, { method: "HEAD" }, (res) => {
        const contentLength = res.headers["content-length"];
        const contentType = res.headers["content-type"] || "";
        const filename =
          urlObj.pathname.split("/").pop() || "download";

        resolve({
          title: decodeURIComponent(filename),
          thumbnail: null,
          duration: null,
          fileSize: contentLength ? parseInt(contentLength) : null,
          platform: "unknown",
          description: null,
          uploader: null,
          formats: [
            {
              formatId: "direct",
              ext: filename.split(".").pop() || "bin",
              quality: "original",
              filesize: contentLength
                ? parseInt(contentLength)
                : null,
              vcodec: contentType.includes("video")
                ? "unknown"
                : null,
              acodec: contentType.includes("audio")
                ? "unknown"
                : null,
              resolution: null,
            },
          ],
        });
      });

      req.on("error", (err) => {
        reject(new Error(`HEAD request failed: ${err.message}`));
      });

      req.end();
    });
  }

  download(url: string, options: DownloadOptions): DownloadProcess {
    const processId = this.generateProcessId();
    const urlObj = new URL(url);
    const filename =
      decodeURIComponent(urlObj.pathname.split("/").pop() || "download");

    const connections = options.maxConnections || 16;
    const args: string[] = [
      url,
      "-x",
      String(connections), // Max connections per server
      "-s",
      String(connections), // Split count
      "-k",
      "1M", // Min chunk size
      "-d",
      options.outputDir,
      "-o",
      filename,
      "--continue=true", // Resume support
      "--summary-interval=1", // Progress update interval
      "--console-log-level=notice",
      "--download-result=full",
    ];

    const proc = this.spawnProcess(this.getBinaryPath(), args, processId);

    const downloadProcess: DownloadProcess = {
      processId,
      engineName: this.name,
      status: "downloading" as DownloadStatus,
      progress: 0,
      speed: null,
      eta: null,
    };

    // Parse aria2c progress output
    proc.stdout?.on("data", (data: Buffer) => {
      const line = data.toString();
      const progress = this.parseAria2Progress(line);
      const speed = this.parseSpeed(line);
      const eta = this.parseEta(line);

      if (progress !== null) downloadProcess.progress = progress;
      if (speed) downloadProcess.speed = speed;
      if (eta) downloadProcess.eta = eta;

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
    });

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

  override async cancel(processId: string): Promise<void> {
    await super.cancel(processId);
    // aria2 creates .aria2 control files — they're useful for resume
    // Don't delete them on cancel in case user wants to retry
  }

  // ---- Parse aria2c specific progress ----

  private parseAria2Progress(line: string): number | null {
    // aria2c format: "[#abc123 1.2MiB/10.5MiB(11%) CN:16 DL:2.5MiB]"
    const match = line.match(/\((\d+)%\)/);
    return match ? parseInt(match[1]) : this.parsePercentage(line);
  }
}
