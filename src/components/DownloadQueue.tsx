// ============================================
// Download Queue Component
// ============================================
"use client";

import { motion, AnimatePresence } from "framer-motion";
import DownloadCard from "./DownloadCard";
import type { Download } from "@/types";

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
  const active = downloads.filter(
    (d) =>
      d.status === "downloading" ||
      d.status === "detecting" ||
      d.status === "merging"
  );
  const queued = downloads.filter((d) => d.status === "queued");
  const paused = downloads.filter((d) => d.status === "paused");
  const completed = downloads.filter((d) => d.status === "completed");
  const failed = downloads.filter((d) => d.status === "failed" || d.status === "cancelled");
  const hasAny = downloads.length > 0;

  return (
    <div className="glass-card" style={{ padding: 24 }}>
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
              {active.length} active · {queued.length} queued · {completed.length} done · {failed.length} failed
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
              className="btn-danger"
              onClick={() => onBulkAction("clear")}
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              🗑 Clear
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && downloads.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shimmer"
              style={{
                height: 72,
                borderRadius: "var(--radius-md)",
                background: "var(--bg-glass)",
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !hasAny && (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">No downloads in queue</div>
          <div className="empty-state-text">
            Paste some URLs above to start downloading. Supports YouTube,
            Instagram, Twitter, Reddit, Vimeo, and 1000+ more sites.
          </div>
        </div>
      )}

      {/* Active Downloads */}
      <AnimatePresence mode="popLayout">
        {active.length > 0 && (
          <motion.div key="active-group" layout>
            <div
              style={{
                fontSize: 11,
                color: "var(--accent-blue)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ⚡ Downloading
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {active.map((download, i) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DownloadCard download={download} onAction={onAction} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Paused Downloads */}
        {paused.length > 0 && (
          <motion.div key="paused-group" layout style={{ marginTop: active.length > 0 ? 16 : 0 }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--accent-yellow)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ⏸ Paused
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paused.map((download, i) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DownloadCard download={download} onAction={onAction} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Queued Downloads */}
        {queued.length > 0 && (
          <motion.div
            key="queued-group"
            layout
            style={{
              marginTop: active.length > 0 || paused.length > 0 ? 16 : 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              🕐 Queued ({queued.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {queued.map((download, i) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DownloadCard download={download} onAction={onAction} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Completed Downloads */}
        {completed.length > 0 && (
          <motion.div
            key="completed-group"
            layout
            style={{
              marginTop: active.length > 0 || paused.length > 0 || queued.length > 0 ? 16 : 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--accent-green, #40C057)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ✅ Completed ({completed.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {completed.map((download, i) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DownloadCard download={download} onAction={onAction} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Failed Downloads */}
        {failed.length > 0 && (
          <motion.div
            key="failed-group"
            layout
            style={{ marginTop: 16 }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--accent-red, #FA5252)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              ❌ Failed ({failed.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {failed.map((download, i) => (
                <motion.div
                  key={download.id}
                  layout
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <DownloadCard download={download} onAction={onAction} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
