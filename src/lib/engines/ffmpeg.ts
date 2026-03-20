// ============================================
// ffmpeg Post-Processor
// ============================================

import { spawn } from "child_process";

function getFFmpegPath(): string {
  return process.env.FFMPEG_PATH || "ffmpeg";
}

// ---- Merge Video + Audio Streams ----

export async function mergeStreams(
  videoPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFFmpegPath(), [
      "-i", videoPath,
      "-i", audioPath,
      "-c", "copy", // No re-encoding
      "-y", // Overwrite output
      outputPath,
    ]);

    let errorOutput = "";
    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg merge failed: ${errorOutput}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`ffmpeg not found: ${err.message}`));
    });
  });
}

// ---- Convert Format ----

export async function convertFormat(
  inputPath: string,
  outputFormat: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(getFFmpegPath(), [
      "-i", inputPath,
      "-y",
      outputPath.endsWith(`.${outputFormat}`)
        ? outputPath
        : `${outputPath}.${outputFormat}`,
    ]);

    let errorOutput = "";
    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg convert failed: ${errorOutput}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`ffmpeg not found: ${err.message}`));
    });
  });
}

// ---- Extract Audio ----

export async function extractAudio(
  inputPath: string,
  outputPath: string,
  format: string = "mp3"
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-vn", // No video
      "-y",
    ];

    if (format === "mp3") {
      args.push("-acodec", "libmp3lame", "-q:a", "2");
    } else if (format === "flac") {
      args.push("-acodec", "flac");
    } else if (format === "wav") {
      args.push("-acodec", "pcm_s16le");
    }

    args.push(outputPath);

    const proc = spawn(getFFmpegPath(), args);

    let errorOutput = "";
    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg extract audio failed: ${errorOutput}`));
    });

    proc.on("error", (err) => {
      reject(new Error(`ffmpeg not found: ${err.message}`));
    });
  });
}

// ---- Add Metadata ----

export async function addMetadata(
  filePath: string,
  metadata: { title?: string; artist?: string; comment?: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ["-i", filePath];

    if (metadata.title) args.push("-metadata", `title=${metadata.title}`);
    if (metadata.artist) args.push("-metadata", `artist=${metadata.artist}`);
    if (metadata.comment)
      args.push("-metadata", `comment=${metadata.comment}`);

    const tempOutput = `${filePath}.tmp.mp4`;
    args.push("-c", "copy", "-y", tempOutput);

    const proc = spawn(getFFmpegPath(), args);

    let errorOutput = "";
    proc.stderr?.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    proc.on("exit", (code) => {
      if (code === 0) {
        // Replace original with metadata-enriched version
        const fs = require("fs");
        fs.renameSync(tempOutput, filePath);
        resolve();
      } else {
        reject(new Error(`ffmpeg metadata failed: ${errorOutput}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`ffmpeg not found: ${err.message}`));
    });
  });
}
