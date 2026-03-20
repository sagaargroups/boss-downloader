// ============================================
// Download Queue Component
// ============================================
"use client";

import React from "react";
import type { Download } from "@/types";
import { formatFileSize, formatSpeed, formatEta, truncate, getPlatformDisplayName } from "@/lib/utils";

interface DownloadQueueProps {
  downloads: Download[];
  isLoading: boolean;
  onAction: (id: string, action: string) => void;
  onBulkAction: (action: string) => void;
}

export default function DownloadQueue({
  downloads,
  isLoading,
  onAction,
  onBulkAction,
}: DownloadQueueProps) {
  const hasAny = downloads.length > 0;

  return (
    <div className="glass-card" style={{ padding: 24, overflowX: "auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>
          📥 Download Queue
          {hasAny && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              {downloads.length} total
            </span>
          )}
        </h2>

        {hasAny && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-secondary"
              onClick={() => onBulkAction("pause-all")}
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              ⏸ Pause All
            </button>
            <button
              className="btn-secondary"
              onClick={() => onBulkAction("resume-all")}
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              ▶ Resume All
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                // To download all queued items via browser
                downloads.filter(d => d.status === 'queued').forEach(d => {
                  const params = new URLSearchParams({
                    url: d.url,
                    quality: d.quality || "best",
                    format: d.format || "mp4",
                  });
                  const iframe = document.createElement("iframe");
                  iframe.style.display = "none";
                  iframe.src = `/api/download/stream?${params.toString()}`;
                  document.body.appendChild(iframe);
                  setTimeout(() => document.body.removeChild(iframe), 30000);
                });
              }}
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              ⬇ Download All
            </button>
            <button
              className="btn-danger"
              onClick={() => {
                if (window.confirm("Are you sure you want to remove all downloads?")) {
                  onBulkAction("clear");
                }
              }}
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              🗑 Remove All
            </button>
          </div>
        )}
      </div>

      {isLoading && downloads.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>
          Loading queue...
        </div>
      ) : !hasAny ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No downloads in queue</div>
          <div className="empty-state-text">
            Paste some URLs above to start downloading securely to your browser.
          </div>
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              <th style={{ padding: "12px 8px", width: "40px" }}>#</th>
              <th style={{ padding: "12px 8px" }}>Media Info</th>
              <th style={{ padding: "12px 8px", width: "30%" }}>Progress / Stats</th>
              <th style={{ padding: "12px 8px", width: "120px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {downloads.map((d, i) => (
              <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>{i + 1}</td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Thumbnail slot */}
                    <div style={{ 
                      width: 48, height: 48, borderRadius: 6, background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0
                    }}>
                      {d.metadata?.thumbnail ? (
                        <img src={d.metadata.thumbnail} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>{(getPlatformDisplayName(d.platform) || "U").charAt(0)}</span>
                      )}
                    </div>
                    {/* Title / Description */}
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={d.title || d.url}>
                        {d.title || truncate(d.url, 50)}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                        {getPlatformDisplayName(d.platform)} • {d.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 8px" }}>
                  <div style={{ marginBottom: 4, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span>{d.progress.toFixed(1)}% {d.fileSize ? `(${formatFileSize(d.fileSize)})` : ""}</span>
                    <span>{d.speed ? `${formatSpeed(d.speed)} • ` : ""}{d.eta ? formatEta(d.eta) : ""}</span>
                  </div>
                  <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ 
                      width: `${Math.max(0, Math.min(100, d.progress))}%`, 
                      height: "100%", 
                      background: d.status === "failed" ? "var(--accent-red)" : d.status === "completed" ? "var(--accent-green)" : "var(--accent-purple)",
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                </td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    {d.status === "queued" && (
                      <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 12 }} title="Download" onClick={() => {
                        const params = new URLSearchParams({
                          url: d.url,
                          quality: d.quality || "best",
                          format: d.format || "mp4",
                        });
                        const iframe = document.createElement("iframe");
                        iframe.style.display = "none";
                        iframe.src = `/api/download/stream?${params.toString()}`;
                        document.body.appendChild(iframe);
                        setTimeout(() => document.body.removeChild(iframe), 30000);
                      }}>⬇️</button>
                    )}
                    {d.status === "failed" && (
                      <button className="btn-secondary" style={{ padding: "4px 8px", fontSize: 12 }} title="Retry" onClick={() => onAction(d.id, "retry")}>🔄</button>
                    )}
                    <button className="btn-danger" style={{ padding: "4px 8px", fontSize: 12 }} title="Remove" onClick={() => {
                      if (window.confirm("Remove this item?")) onAction(d.id, "remove");
                    }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
