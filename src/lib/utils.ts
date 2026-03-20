// ============================================
// Shared Utilities
// ============================================

// ---- Format File Size ----

export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return "Unknown";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

// ---- Format Duration ----

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Unknown";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ---- Format Speed ----

export function formatSpeed(speed: string | null): string {
  return speed || "—";
}

// ---- Format ETA ----

export function formatEta(eta: string | null): string {
  return eta || "—";
}

// ---- Generate UUID ----

export function generateId(): string {
  return crypto.randomUUID();
}

// ---- Delay ----

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---- Truncate Text ----

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

// ---- Timestamp Helpers ----

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

// ---- Status Color Map ----

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: "#868E96",
    detecting: "#FCC419",
    downloading: "#228BE6",
    paused: "#FAB005",
    merging: "#845EF7",
    completed: "#40C057",
    failed: "#FA5252",
    cancelled: "#868E96",
  };
  return colors[status] || "#868E96";
}

// ---- Platform Display Name ----

export function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    youtube: "YouTube",
    hotstar: "JioHotstar",
    instagram: "Instagram",
    twitter: "X (Twitter)",
    reddit: "Reddit",
    vimeo: "Vimeo",
    facebook: "Facebook",
    dailymotion: "Dailymotion",
    unknown: "Direct URL",
  };
  return names[platform] || platform || "Unknown";
}

// ---- Engine Display Name ----

export function getEngineDisplayName(engine: string): string {
  const names: Record<string, string> = {
    ytdlp: "yt-dlp",
    aria2: "aria2",
    nm3u8: "N_m3u8DL-RE",
  };
  return names[engine] || engine;
}
