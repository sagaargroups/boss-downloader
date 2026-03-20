// ============================================
// Engine Manager — Registry & Hot-Swap
// ============================================

import { YtDlpEngine } from "./ytdlp";
import { Aria2Engine } from "./aria2";
import { Nm3u8Engine } from "./nm3u8";
import { isBinaryAvailable } from "./base";
import type { DownloadEngine, EngineName } from "@/types";

class EngineManager {
  private engines: Map<EngineName, DownloadEngine> = new Map();

  constructor() {
    this.engines.set("ytdlp", new YtDlpEngine());
    this.engines.set("aria2", new Aria2Engine());
    this.engines.set("nm3u8", new Nm3u8Engine());
  }

  getEngine(name: EngineName): DownloadEngine {
    const engine = this.engines.get(name);
    if (!engine) throw new Error(`Engine not found: ${name}`);
    return engine;
  }

  async detectBestEngine(url: string): Promise<EngineName> {
    // Priority: nm3u8 for streams, aria2 for direct files, ytdlp for everything else
    const nm3u8 = this.engines.get("nm3u8")!;
    if (await nm3u8.detect(url)) return "nm3u8";

    const aria2 = this.engines.get("aria2")!;
    if (await aria2.detect(url)) return "aria2";

    return "ytdlp"; // Default fallback — supports nearly everything
  }

  async getAvailableEngines(): Promise<
    { name: EngineName; available: boolean; binaryPath: string }[]
  > {
    const binaries: { name: EngineName; cmd: string }[] = [
      { name: "ytdlp", cmd: process.env.YTDLP_PATH || "yt-dlp" },
      { name: "aria2", cmd: process.env.ARIA2C_PATH || "aria2c" },
      { name: "nm3u8", cmd: process.env.NM3U8DLRE_PATH || "N_m3u8DL-RE" },
    ];

    const results = await Promise.all(
      binaries.map(async (b) => ({
        name: b.name,
        available: await isBinaryAvailable(b.cmd),
        binaryPath: b.cmd,
      }))
    );

    return results;
  }

  async switchEngine(
    processId: string,
    currentEngine: EngineName,
    newEngine: EngineName
  ): Promise<void> {
    const current = this.getEngine(currentEngine);
    await current.pause(processId);
    await current.cancel(processId);
    // The caller should start a new download with the new engine
    // This is a graceful handoff — the queue manager handles re-queuing
  }

  getAllEngineNames(): EngineName[] {
    return Array.from(this.engines.keys());
  }
}

// Singleton
let instance: EngineManager | null = null;

export function getEngineManager(): EngineManager {
  if (!instance) {
    instance = new EngineManager();
  }
  return instance;
}

// Convenience exports
export async function checkEngineAvailability(): Promise<{
  ytdlp: boolean;
  aria2: boolean;
  nm3u8: boolean;
  ffmpeg: boolean;
}> {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const [ytdlp, aria2, nm3u8, ffmpeg] = await Promise.all([
    isBinaryAvailable(process.env.YTDLP_PATH || "yt-dlp"),
    isBinaryAvailable(process.env.ARIA2C_PATH || "aria2c"),
    isBinaryAvailable(process.env.NM3U8DLRE_PATH || "N_m3u8DL-RE"),
    isBinaryAvailable(ffmpegPath),
  ]);
  return { ytdlp, aria2, nm3u8, ffmpeg };
}
