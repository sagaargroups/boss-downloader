// ============================================
// URL Detector — Platform Detection & Parsing
// ============================================

import type { Platform, EngineName, UrlDetectionResult } from "@/types";

// ---- Platform Pattern Registry ----

interface PlatformPattern {
  platform: Platform;
  patterns: RegExp[];
  icon: string;
  color: string;
  recommendedEngine: EngineName;
}

const PLATFORM_PATTERNS: PlatformPattern[] = [
  {
    platform: "youtube",
    patterns: [
      /(?:www\.)?youtube\.com\/watch/i,
      /(?:www\.)?youtube\.com\/shorts\//i,
      /(?:www\.)?youtube\.com\/playlist/i,
      /(?:www\.)?youtube\.com\/live\//i,
      /youtu\.be\//i,
      /(?:www\.)?youtube\.com\/embed\//i,
    ],
    icon: "🔴",
    color: "#FF0000",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "hotstar",
    patterns: [
      /(?:www\.)?hotstar\.com/i,
      /(?:www\.)?jiohotstar\.com/i,
    ],
    icon: "🟢",
    color: "#1CA84C",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "instagram",
    patterns: [
      /(?:www\.)?instagram\.com\/reel\//i,
      /(?:www\.)?instagram\.com\/p\//i,
      /(?:www\.)?instagram\.com\/tv\//i,
      /(?:www\.)?instagram\.com\/stories\//i,
    ],
    icon: "📸",
    color: "#E4405F",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "twitter",
    patterns: [
      /(?:www\.)?twitter\.com\/.+\/status\//i,
      /(?:www\.)?x\.com\/.+\/status\//i,
    ],
    icon: "🐦",
    color: "#1DA1F2",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "reddit",
    patterns: [
      /(?:www\.)?reddit\.com\/r\/.+\/comments\//i,
      /v\.redd\.it\//i,
    ],
    icon: "🟠",
    color: "#FF4500",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "vimeo",
    patterns: [/(?:www\.)?vimeo\.com\/\d+/i, /player\.vimeo\.com/i],
    icon: "🔵",
    color: "#1AB7EA",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "facebook",
    patterns: [
      /(?:www\.)?facebook\.com\/.+\/videos\//i,
      /(?:www\.)?facebook\.com\/watch/i,
      /fb\.watch\//i,
    ],
    icon: "🔷",
    color: "#1877F2",
    recommendedEngine: "ytdlp",
  },
  {
    platform: "dailymotion",
    patterns: [
      /(?:www\.)?dailymotion\.com\/video\//i,
      /dai\.ly\//i,
    ],
    icon: "📹",
    color: "#0066DC",
    recommendedEngine: "ytdlp",
  },
];

// Direct file extensions → aria2
const DIRECT_FILE_PATTERNS = /\.(mp4|mkv|webm|avi|mov|mp3|flac|wav|ogg|zip|rar|7z|tar)(\?.*)?$/i;

// Stream manifest URLs → nm3u8
const STREAM_PATTERNS = /\.(m3u8|mpd)(\?.*)?$/i;

// ---- Main Detection Function ----

export function detectPlatform(url: string): UrlDetectionResult {
  // Validate URL
  try {
    new URL(url);
  } catch {
    return {
      url,
      platform: "unknown",
      isValid: false,
      icon: "❌",
      color: "#666666",
      recommendedEngine: "ytdlp",
    };
  }

  // Check stream manifests first
  if (STREAM_PATTERNS.test(url)) {
    return {
      url,
      platform: "unknown",
      isValid: true,
      icon: "📡",
      color: "#9B59B6",
      recommendedEngine: "nm3u8",
    };
  }

  // Check direct file URLs
  if (DIRECT_FILE_PATTERNS.test(url)) {
    return {
      url,
      platform: "unknown",
      isValid: true,
      icon: "📁",
      color: "#27AE60",
      recommendedEngine: "aria2",
    };
  }

  // Check known platforms
  for (const p of PLATFORM_PATTERNS) {
    for (const pattern of p.patterns) {
      if (pattern.test(url)) {
        return {
          url,
          platform: p.platform,
          isValid: true,
          icon: p.icon,
          color: p.color,
          recommendedEngine: p.recommendedEngine,
        };
      }
    }
  }

  // Unknown but valid URL
  return {
    url,
    platform: "unknown",
    isValid: true,
    icon: "🔗",
    color: "#95A5A6",
    recommendedEngine: "ytdlp",
  };
}

// ---- Bulk URL Parser ----

export function detectMultipleUrls(text: string): UrlDetectionResult[] {
  // Split by newline, comma, space, or tab
  const rawParts = text
    .split(/[\n,\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Further split by space (but preserve URLs with spaces in params)
  const urls: string[] = [];
  for (const part of rawParts) {
    // If it looks like a URL, keep it whole
    if (part.startsWith("http://") || part.startsWith("https://")) {
      urls.push(part);
    } else {
      // Split by space and check each token
      const tokens = part.split(/\s+/);
      for (const token of tokens) {
        if (
          token.startsWith("http://") ||
          token.startsWith("https://")
        ) {
          urls.push(token);
        }
      }
    }
  }

  // Deduplicate
  const unique = [...new Set(urls)];

  return unique.map(detectPlatform);
}

// ---- Export platform info for UI ----

export function getPlatformInfo(platform: Platform): {
  label: string;
  icon: string;
  color: string;
} {
  const entry = PLATFORM_PATTERNS.find((p) => p.platform === platform);
  if (entry) {
    return {
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
      icon: entry.icon,
      color: entry.color,
    };
  }
  return { label: "Unknown", icon: "🔗", color: "#95A5A6" };
}
