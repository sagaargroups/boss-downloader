// ============================================
// Boss Downloader — Type Definitions
// ============================================

// ---- Enums & Literal Types ----

export type DownloadStatus =
  | "queued"
  | "detecting"
  | "downloading"
  | "paused"
  | "merging"
  | "completed"
  | "failed"
  | "cancelled";

export type EngineName = "ytdlp" | "aria2" | "nm3u8";

export type Platform =
  | "youtube"
  | "hotstar"
  | "instagram"
  | "twitter"
  | "reddit"
  | "vimeo"
  | "facebook"
  | "dailymotion"
  | "unknown";

export type VideoQuality =
  | "best"
  | "2160p"
  | "1440p"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "audio_only";

export type OutputFormat = "mp4" | "mkv" | "webm" | "mp3" | "flac" | "wav";

// ---- Core Interfaces ----

export interface Download {
  id: string;
  url: string;
  title: string | null;
  platform: Platform;
  engine: EngineName;
  status: DownloadStatus;
  progress: number; // 0 - 100
  fileSize: number | null; // bytes
  filePath: string | null;
  format: OutputFormat;
  quality: VideoQuality;
  speed: string | null; // e.g. "2.5 MB/s"
  eta: string | null; // e.g. "3m 20s"
  error: string | null;
  metadata: VideoMetadata | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface VideoMetadata {
  thumbnail: string | null;
  duration: number | null; // seconds
  description: string | null;
  uploader: string | null;
  viewCount: number | null;
  formats: FormatOption[];
}

export interface FormatOption {
  formatId: string;
  ext: string;
  quality: string;
  filesize: number | null;
  vcodec: string | null;
  acodec: string | null;
  resolution: string | null;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  formats: FormatOption[];
  fileSize: number | null;
  platform: Platform;
  description: string | null;
  uploader: string | null;
}

export interface DownloadOptions {
  quality: VideoQuality;
  format: OutputFormat;
  engine: EngineName;
  outputDir: string;
  cookies?: string;
  maxConnections?: number;
}

export interface DownloadProcess {
  processId: string;
  engineName: EngineName;
  status: DownloadStatus;
  progress: number;
  speed: string | null;
  eta: string | null;
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  downloadId: string;
  progress: number;
  speed: string | null;
  eta: string | null;
  status: DownloadStatus;
  fileSize: number | null;
}

// ---- Engine Interface ----

export interface DownloadEngine {
  name: EngineName;
  detect(url: string): Promise<boolean>;
  getInfo(url: string): Promise<VideoInfo>;
  download(url: string, options: DownloadOptions): DownloadProcess;
  pause(processId: string): Promise<void>;
  resume(processId: string): Promise<void>;
  cancel(processId: string): Promise<void>;
}

// ---- Queue ----

export interface QueueItem {
  download: Download;
  priority: number;
  retryCount: number;
  addedAt: string; // ISO 8601
}

// ---- Settings ----

export interface AppSettings {
  defaultEngine: EngineName;
  defaultQuality: VideoQuality;
  defaultFormat: OutputFormat;
  downloadPath: string;
  maxConcurrent: number;
  supabaseUrl: string;
  supabaseKey: string;
  redisUrl: string;
  redisToken: string;
}

// ---- SSE ----

export interface SSEProgressEvent {
  downloadId: string;
  progress: number;
  speed: string | null;
  eta: string | null;
  status: DownloadStatus;
}

// ---- URL Detection ----

export interface UrlDetectionResult {
  url: string;
  platform: Platform;
  isValid: boolean;
  icon: string;
  color: string;
  recommendedEngine: EngineName;
}

// ---- API Request/Response Types ----

export interface StartDownloadRequest {
  url: string;
  quality?: VideoQuality;
  format?: OutputFormat;
  engine?: EngineName;
}

export interface BulkDownloadRequest {
  urls: string[];
  quality?: VideoQuality;
  format?: OutputFormat;
  engine?: EngineName;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---- Database Row Types (snake_case for Supabase) ----

export interface DownloadRow {
  id: string;
  url: string;
  title: string | null;
  platform: string;
  engine: string;
  status: string;
  progress: number;
  file_size: number | null;
  file_path: string | null;
  format: string;
  quality: string;
  speed: string | null;
  eta: string | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
