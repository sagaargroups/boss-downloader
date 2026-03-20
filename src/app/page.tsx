// ============================================
// Dashboard — Main Page
// ============================================
"use client";

import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import UrlInput from "@/components/UrlInput";
import DownloadQueue from "@/components/DownloadQueue";
import EngineSwitcher from "@/components/EngineSwitcher";
import { useDownloads } from "@/hooks/useDownloads";
import { useOffline } from "@/hooks/useOffline";
import { useDownloadStore } from "@/store/downloadStore";
import type { Download, EngineName, VideoQuality, OutputFormat } from "@/types";

export default function DashboardPage() {
  const { downloads, isLoading, refetch } = useDownloads();
  const { isOnline } = useOffline();
  const [selectedEngine, setSelectedEngine] = useState<EngineName>("ytdlp");
  const [isAdding, setIsAdding] = useState(false);
  const addDownload = useDownloadStore((s) => s.addDownload);

  const stats = {
    total: downloads.length,
    downloading: downloads.filter((d) => d.status === "downloading").length,
    queued: downloads.filter((d) => d.status === "queued").length,
    completed: downloads.filter((d) => d.status === "completed").length,
    failed: downloads.filter((d) => d.status === "failed").length,
  };

  const handleAddUrls = useCallback(
    async (
      urls: string[],
      quality: VideoQuality,
      format: OutputFormat
    ) => {
      setIsAdding(true);
      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            urls,
            quality,
            format,
            engine: selectedEngine,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const created = data.data?.created || [data.data];
          created.forEach((d: Download) => addDownload(d));

          notifications.show({
            title: "Added to Queue",
            message: `${created.length} download(s) queued successfully`,
            color: "violet",
          });
        } else {
          notifications.show({
            title: "Error",
            message: data.error || "Failed to add downloads",
            color: "red",
          });
        }
      } catch {
        notifications.show({
          title: "Error",
          message: "Network error — downloads saved locally",
          color: "yellow",
        });
      } finally {
        setIsAdding(false);
        refetch();
      }
    },
    [selectedEngine, addDownload, refetch]
  );

  const handleAction = useCallback(
    async (id: string, action: string) => {
      try {
        await fetch("/api/download", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, action }),
        });
        refetch();
      } catch {
        notifications.show({
          title: "Error",
          message: `Failed to ${action} download`,
          color: "red",
        });
      }
    },
    [refetch]
  );

  const handleBulkAction = useCallback(
    async (action: string) => {
      try {
        await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        refetch();

        notifications.show({
          title: "Done",
          message: `${action.replace("-", " ")} completed`,
          color: "violet",
        });
      } catch {
        notifications.show({
          title: "Error",
          message: "Action failed",
          color: "red",
        });
      }
    },
    [refetch]
  );

  return (
    <div className="app-container">
      {/* ---- Header ---- */}
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="page-title">
            <span className="gradient-text">Boss</span> Downloader
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Ultra-fast OTT video downloader
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              className={`status-dot ${isOnline ? "online" : "offline"}`}
            />
            <span
              style={{ fontSize: 12, color: "var(--text-secondary)" }}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          <nav className="nav-links">
            <Link href="/" className="nav-link active">
              ⚡ Dashboard
            </Link>
            <Link href="/history" className="nav-link">
              📜 History
            </Link>
            <Link href="/settings" className="nav-link">
              ⚙️ Settings
            </Link>
          </nav>
        </div>
      </motion.header>

      {/* ---- Stats Bar ---- */}
      <motion.div
        className="stats-bar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {[
          { label: "Total", value: stats.total, color: "var(--accent-purple)" },
          { label: "Active", value: stats.downloading, color: "var(--accent-blue)" },
          { label: "Queued", value: stats.queued, color: "var(--accent-yellow)" },
          { label: "Done", value: stats.completed, color: "var(--accent-green)" },
          { label: "Failed", value: stats.failed, color: "var(--accent-red)" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card stat-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
          >
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ---- Main Grid ---- */}
      <div className="dashboard-grid">
        {/* Left Column — URL Input + Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <UrlInput
              onSubmit={handleAddUrls}
              isLoading={isAdding}
              selectedEngine={selectedEngine}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <DownloadQueue
              downloads={downloads}
              isLoading={isLoading}
              onAction={handleAction}
              onBulkAction={handleBulkAction}
            />
          </motion.div>
        </div>

        {/* Right Column — Engine Switcher */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <EngineSwitcher
            selected={selectedEngine}
            onSelect={setSelectedEngine}
          />
        </motion.div>
      </div>
    </div>
  );
}
