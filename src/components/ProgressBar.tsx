// ============================================
// Progress Bar — Animated Custom Progress
// ============================================
"use client";

import type { DownloadStatus } from "@/types";

interface ProgressBarProps {
  progress: number;
  status: DownloadStatus;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
  const getStatusClass = (): string => {
    if (status === "completed") return "completed";
    if (status === "failed") return "failed";
    if (status === "paused") return "paused";
    if (status === "downloading" || status === "detecting" || status === "merging")
      return "downloading";
    return "";
  };

  return (
    <div className="progress-container">
      <div
        className={`progress-fill ${getStatusClass()}`}
        style={{
          width: `${Math.min(100, Math.max(0, progress))}%`,
        }}
      />
    </div>
  );
}
