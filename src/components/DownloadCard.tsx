// ============================================
// Download Card — Individual Download Item
// ============================================
"use client";

import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";
import { formatFileSize, formatSpeed, formatEta, truncate, getStatusColor, getPlatformDisplayName, getEngineDisplayName } from "@/lib/utils";
import type { Download } from "@/types";

interface DownloadCardProps {
  download: Download;
  onAction: (id: string, action: string) => void;
}

export default function DownloadCard({ download, onAction }: DownloadCardProps) {
  const {
    id, url, title, platform, engine, status, progress,
    fileSize, speed, eta, error,
  } = download;

  const statusColor = getStatusColor(status);
  const displayTitle = title || truncate(url, 60);
  const isActive = status === "downloading" || status === "detecting" || status === "merging";

  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--bg-glass)",
        border: `1px solid ${
          isActive
            ? "rgba(124, 58, 237, 0.2)"
            : status === "completed"
            ? "rgba(16, 185, 129, 0.2)"
            : status === "failed"
            ? "rgba(239, 68, 68, 0.2)"
            : "var(--border-subtle)"
        }`,
        transition: "all 0.2s ease",
      }}
    >
      {/* Top Row — Title + Platform + Engine */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* Platform Badge */}
          <span
            className="badge"
            style={{
              background: `${statusColor}15`,
              color: statusColor,
              flexShrink: 0,
            }}
          >
            {getPlatformDisplayName(platform)}
          </span>

          {/* Title */}
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={url}
          >
            {displayTitle}
          </span>
        </div>

        {/* Engine Badge */}
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            background: "var(--bg-glass)",
            padding: "2px 8px",
            borderRadius: 12,
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {getEngineDisplayName(engine)}
        </span>
      </div>

      {/* Progress Bar */}
      <ProgressBar progress={progress} status={status} />

      {/* Bottom Row — Stats + Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 12,
            color: "var(--text-secondary)",
          }}
        >
          <span>{progress.toFixed(1)}%</span>
          {fileSize && <span>{formatFileSize(fileSize)}</span>}
          {speed && (
            <span style={{ color: "var(--accent-cyan)" }}>
              ⚡ {formatSpeed(speed)}
            </span>
          )}
          {eta && (
            <span>🕐 {formatEta(eta)}</span>
          )}
          {error && (
            <span
              style={{ color: "var(--accent-red)", cursor: "help" }}
              title={error}
            >
              ⚠️ {truncate(error, 30)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 4 }}>
          {/* Queued: Direct Download to Browser */}
          {status === "queued" && (
            <>
              <ActionButton
                icon="⬇️"
                title="Download to Device (Browser Save As)"
                onClick={() => {
                  // The original code already uses an iframe for non-navigational download.
                  // The provided edit snippet seems to be a partial or malformed change.
                  // Assuming the intent is to ensure the iframe method is used and potentially
                  // to fix any issues if a window.open was mistakenly present before.
                  // Since the current code already uses iframe, we'll keep it as is,
                  // as it aligns with the instruction "Replace window.open with a non-navigational download trigger (iframe)".
                  // If there was a window.open, this iframe logic would replace it.
                  const params = new URLSearchParams({
                    url: download.url,
                    quality: download.quality || "best",
                    format: download.format || "mp4",
                  });
                  const iframe = document.createElement("iframe");
                  iframe.style.display = "none";
                  iframe.src = `/api/download/stream?${params.toString()}`;
                  document.body.appendChild(iframe);
                  setTimeout(() => document.body.removeChild(iframe), 30000);
                }}
              />
              <ActionButton
                icon="🗑"
                title="Remove"
                onClick={() => onAction(id, "remove")}
                danger
              />
            </>
          )}
          
          {/* Completed: Save to Device (from server history) */}
          {status === "completed" && download.filePath && (
            <ActionButton
              icon="💾"
              title="Save to Device"
              onClick={() => {
                const a = document.createElement("a");
                a.href = `/api/download/file?id=${id}`;
                a.download = download.title || "download";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
            />
          )}

          {/* Downloading: Pause/Cancel */}
          {status === "downloading" && (
            <>
              <ActionButton
                icon="⏸"
                title="Pause"
                onClick={() => onAction(id, "pause")}
              />
              <ActionButton
                icon="❌"
                title="Cancel"
                onClick={() => onAction(id, "cancel")}
                danger
              />
            </>
          )}

          {/* Paused: Resume/Cancel */}
          {status === "paused" && (
            <>
              <ActionButton
                icon="▶️"
                title="Resume"
                onClick={() => onAction(id, "resume")}
              />
              <ActionButton
                icon="❌"
                title="Cancel"
                onClick={() => onAction(id, "cancel")}
                danger
              />
            </>
          )}

          {/* Failed: Retry / Remove */}
          {status === "failed" && (
            <>
              <ActionButton
                icon="🔄"
                title="Retry (Add to Queue again)"
                onClick={() => onAction(id, "retry")}
              />
              <ActionButton
                icon="🗑"
                title="Remove"
                onClick={() => onAction(id, "remove")}
                danger
              />
            </>
          )}

          {/* Finished states (except failed): Remove from list */}
          {(status === "completed" ||
            status === "cancelled") && (
            <ActionButton
              icon="🗑"
              title="Remove"
              onClick={() => onAction(id, "remove")}
              danger
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Action Button ----

function ActionButton({
  icon,
  title,
  onClick,
  danger = false,
}: {
  icon: string;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={title}
      style={{
        background: danger
          ? "rgba(239, 68, 68, 0.1)"
          : "var(--bg-glass)",
        border: `1px solid ${
          danger ? "rgba(239, 68, 68, 0.2)" : "var(--border-subtle)"
        }`,
        borderRadius: 6,
        padding: "4px 8px",
        cursor: "pointer",
        fontSize: 14,
        lineHeight: 1,
        transition: "all 0.2s ease",
      }}
    >
      {icon}
    </motion.button>
  );
}
