// ============================================
// Base Engine — Abstract Download Engine
// ============================================

import { spawn, type ChildProcess } from "child_process";
import type { DownloadEngine, DownloadProcess, EngineName, VideoInfo, DownloadOptions, DownloadStatus } from "@/types";

// Active process tracker
const activeProcesses = new Map<string, ChildProcess>();

export abstract class BaseEngine implements DownloadEngine {
  abstract name: EngineName;
  abstract detect(url: string): Promise<boolean>;
  abstract getInfo(url: string): Promise<VideoInfo>;
  abstract download(url: string, options: DownloadOptions): DownloadProcess;

  // ---- Shared Process Management ----

  protected spawnProcess(
    command: string,
    args: string[],
    processId: string
  ): ChildProcess {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      detached: false,
    });

    activeProcesses.set(processId, child);

    child.on("exit", () => {
      activeProcesses.delete(processId);
    });

    child.on("error", (err) => {
      console.error(`[${this.name}] Process error:`, err);
      activeProcesses.delete(processId);
    });

    return child;
  }

  async pause(processId: string): Promise<void> {
    const proc = activeProcesses.get(processId);
    if (proc && proc.pid) {
      process.kill(proc.pid, "SIGSTOP");
    }
  }

  async resume(processId: string): Promise<void> {
    const proc = activeProcesses.get(processId);
    if (proc && proc.pid) {
      process.kill(proc.pid, "SIGCONT");
    }
  }

  async cancel(processId: string): Promise<void> {
    const proc = activeProcesses.get(processId);
    if (proc) {
      proc.kill("SIGTERM");
      activeProcesses.delete(processId);
    }
  }

  protected getProcess(processId: string): ChildProcess | undefined {
    return activeProcesses.get(processId);
  }

  // ---- Shared Progress Parser ----

  protected parsePercentage(line: string): number | null {
    // Generic percentage parser: "XX.X%" pattern
    const match = line.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : null;
  }

  protected parseSpeed(line: string): string | null {
    // Common speed patterns: "2.5MiB/s", "1.2MB/s", "500KiB/s"
    const match = line.match(
      /(\d+\.?\d*\s*(?:K|M|G)?(?:i?B)\/s)/i
    );
    return match ? match[1] : null;
  }

  protected parseEta(line: string): string | null {
    // Common ETA patterns: "ETA 03:20", "00:03:20"
    const match = line.match(
      /(?:ETA\s*)?(\d{1,2}:\d{2}(?::\d{2})?)/
    );
    return match ? match[1] : null;
  }

  // ---- Generate Process ID ----

  protected generateProcessId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ---- Utility: Check if binary exists ----

export async function isBinaryAvailable(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("which", [command], { stdio: "pipe" });
    child.on("exit", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}
