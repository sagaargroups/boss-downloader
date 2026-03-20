// ============================================
// yt-dlp Engine — 1000+ Site Support
// ============================================

import { BaseEngine } from "./base";
import type {
  DownloadOptions,
  DownloadProcess,
  DownloadStatus,
  EngineName,
  VideoInfo,
  Platform,
  FormatOption,
} from "@/types";

export class YtDlpEngine extends BaseEngine {
  name: EngineName = "ytdlp";

  private getBinaryPath(): string {
    return process.env.YTDLP_PATH || "yt-dlp";
  }

  async detect(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }

  async getInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const proc = this.spawnProcess(
        this.getBinaryPath(),
        ["--dump-json", "--no-download", url],
        this.generateProcessId()
      );

      let output = "";
      let errorOutput = "";

      proc.stdout?.on("data", (data: Buffer) => {
        output += data.toString();
      });

      proc.stderr?.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      proc.on("exit", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              `yt-dlp info failed: ${errorOutput || "Unknown error"}`
            )
          );
          return;
        }

        try {
          const json = JSON.parse(output);
          const info: VideoInfo = {
            title: json.title || "Unknown",
            thumbnail: json.thumbnail || null,
            duration: json.duration || null,
            fileSize: json.filesize || json.filesize_approx || null,
            platform: this.detectPlatformFromExtractor(
              json.extractor || ""
            ),
            description: json.description || null,
            uploader: json.uploader || json.channel || null,
            formats: (json.formats || []).slice(0, 20).map(
              (f: Record<string, unknown>) => ({
                formatId: String(f.format_id || ""),
                ext: String(f.ext || ""),
                quality:
                  String(f.format_note || f.resolution || ""),
                filesize: (f.filesize as number) || null,
                vcodec: String(f.vcodec || "none"),
                acodec: String(f.acodec || "none"),
                resolution: String(f.resolution || ""),
              })
            ),
          };
          resolve(info);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp output: ${err}`));
        }
      });
    });
  }

  download(url: string, options: DownloadOptions): DownloadProcess {
    const processId = this.generateProcessId();

    const args: string[] = [
      url,
      "-f",
      this.getFormatString(options.quality),
      "--merge-output-format",
      options.format || "mp4",
      "-o",
      `${options.outputDir}/%(title)s.%(ext)s`,
      "--newline",
      "--no-mtime",
    ];

    if (options.maxConnections && options.maxConnections > 1) {
      args.push(
        "--external-downloader",
        "aria2c",
        "--downloader-args",
        `aria2c:-x ${options.maxConnections} -s ${options.maxConnections} -k 1M`
      );
    }

    if (options.cookies) {
      args.push("--cookies", options.cookies);
    }

    const proc = this.spawnProcess(this.getBinaryPath(), args, processId);

    const downloadProcess: DownloadProcess = {
      processId,
      engineName: this.name,
      status: "downloading" as DownloadStatus,
      progress: 0,
      speed: null,
      eta: null,
    };

    let detectedFilePath: string | null = null;

    // Helper to parse any line (works for both stdout and stderr)
    const parseLine = (line: string) => {
      if (!line.trim()) return;

      // Capture file paths
      const destMatch = line.match(/\[download\] Destination:\s*(.+)/);
      const mergerMatch = line.match(/\[Merger\] Merging formats into "(.+)"/);
      const moveMatch = line.match(/\[MoveFiles\] Moving file ".*?" to "(.+)"/);
      const alreadyMatch = line.match(/\[download\] (.+) has already been downloaded/);

      if (moveMatch) detectedFilePath = moveMatch[1].trim();
      else if (mergerMatch) detectedFilePath = mergerMatch[1].trim();
      else if (destMatch) detectedFilePath = destMatch[1].trim();
      else if (alreadyMatch) detectedFilePath = alreadyMatch[1].trim();

      // Parse progress, speed, ETA
      const progress = this.parsePercentage(line);
      const speed = this.parseSpeed(line);
      const eta = this.parseEta(line);

      if (progress !== null) downloadProcess.progress = progress;
      if (speed) downloadProcess.speed = speed;
      if (eta) downloadProcess.eta = eta;

      // Fire callback on any progress change
      if (progress !== null && downloadProcess.onProgress) {
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

    // Parse BOTH stdout and stderr — yt-dlp sends progress to BOTH
    proc.stdout?.on("data", (data: Buffer) => {
      data.toString().split("\n").forEach(parseLine);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      data.toString().split("\n").forEach(parseLine);
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
          filePath: detectedFilePath,
        } as any);
      }
    });

    return downloadProcess;
  }

  // ---- Helpers ----

  private getFormatString(quality: string): string {
    switch (quality) {
      case "best":
        return "bestvideo+bestaudio/best";
      case "2160p":
        return "bestvideo[height<=2160]+bestaudio/best[height<=2160]";
      case "1440p":
        return "bestvideo[height<=1440]+bestaudio/best[height<=1440]";
      case "1080p":
        return "bestvideo[height<=1080]+bestaudio/best[height<=1080]";
      case "720p":
        return "bestvideo[height<=720]+bestaudio/best[height<=720]";
      case "480p":
        return "bestvideo[height<=480]+bestaudio/best[height<=480]";
      case "360p":
        return "bestvideo[height<=360]+bestaudio/best[height<=360]";
      case "audio_only":
        return "bestaudio";
      default:
        return "bestvideo+bestaudio/best";
    }
  }

  private detectPlatformFromExtractor(extractor: string): Platform {
    const lower = extractor.toLowerCase();
    if (lower.includes("youtube")) return "youtube";
    if (lower.includes("hotstar")) return "hotstar";
    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("twitter") || lower.includes("x")) return "twitter";
    if (lower.includes("reddit")) return "reddit";
    if (lower.includes("vimeo")) return "vimeo";
    if (lower.includes("facebook")) return "facebook";
    if (lower.includes("dailymotion")) return "dailymotion";
    return "unknown";
  }
}
