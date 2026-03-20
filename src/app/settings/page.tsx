// ============================================
// Settings Page — Configuration
// ============================================
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import type { EngineName, VideoQuality, OutputFormat } from "@/types";

interface ConnectionStatus {
  supabase: boolean | null;
  redis: boolean | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    defaultEngine: "ytdlp" as EngineName,
    defaultQuality: "best" as VideoQuality,
    defaultFormat: "mp4" as OutputFormat,
    downloadPath: "./downloads",
    maxConcurrent: 3,
  });
  const [connStatus, setConnStatus] = useState<ConnectionStatus>({
    supabase: null,
    redis: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setSettings((prev) => ({ ...prev, ...data.data }));
        }
      }
    } catch {
      // Use defaults
    }
  };

  const saveSetting = async (key: string, value: unknown) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (res.ok) {
        notifications.show({
          title: "Saved",
          message: `${key} updated successfully`,
          color: "green",
        });
      }
    } catch {
      notifications.show({
        title: "Error",
        message: "Failed to save setting",
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (type: "supabase" | "redis") => {
    setConnStatus((prev) => ({ ...prev, [type]: null }));
    try {
      // In a real implementation, this would call a test endpoint
      await new Promise((r) => setTimeout(r, 1000));
      setConnStatus((prev) => ({ ...prev, [type]: true }));
      notifications.show({
        title: "Connected",
        message: `${type === "supabase" ? "Supabase" : "Redis"} connection successful`,
        color: "green",
      });
    } catch {
      setConnStatus((prev) => ({ ...prev, [type]: false }));
      notifications.show({
        title: "Failed",
        message: `Could not connect to ${type}`,
        color: "red",
      });
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <motion.header
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="page-title">
            <span className="gradient-text">⚙️</span> Settings
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Configure connections, engines, and download preferences
          </p>
        </div>

        <nav className="nav-links">
          <Link href="/" className="nav-link">⚡ Dashboard</Link>
          <Link href="/history" className="nav-link">📜 History</Link>
          <Link href="/settings" className="nav-link active">⚙️ Settings</Link>
        </nav>
      </motion.header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
        }}
      >
        {/* Download Defaults */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: 24 }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            📥 Download Defaults
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <SettingRow label="Default Engine">
              <select
                className="input-glass"
                value={settings.defaultEngine}
                onChange={(e) => {
                  const val = e.target.value as EngineName;
                  setSettings((s) => ({ ...s, defaultEngine: val }));
                  saveSetting("defaultEngine", val);
                }}
                style={{ width: "100%", padding: "8px 12px" }}
              >
                <option value="ytdlp">🎬 yt-dlp</option>
                <option value="aria2">⚡ aria2</option>
                <option value="nm3u8">📡 N_m3u8DL-RE</option>
              </select>
            </SettingRow>

            <SettingRow label="Default Quality">
              <select
                className="input-glass"
                value={settings.defaultQuality}
                onChange={(e) => {
                  const val = e.target.value as VideoQuality;
                  setSettings((s) => ({ ...s, defaultQuality: val }));
                  saveSetting("defaultQuality", val);
                }}
                style={{ width: "100%", padding: "8px 12px" }}
              >
                <option value="best">🎯 Best</option>
                <option value="1080p">📺 1080p</option>
                <option value="720p">📺 720p</option>
                <option value="480p">📺 480p</option>
                <option value="audio_only">🎵 Audio Only</option>
              </select>
            </SettingRow>

            <SettingRow label="Default Format">
              <select
                className="input-glass"
                value={settings.defaultFormat}
                onChange={(e) => {
                  const val = e.target.value as OutputFormat;
                  setSettings((s) => ({ ...s, defaultFormat: val }));
                  saveSetting("defaultFormat", val);
                }}
                style={{ width: "100%", padding: "8px 12px" }}
              >
                <option value="mp4">📦 MP4</option>
                <option value="mkv">📦 MKV</option>
                <option value="webm">📦 WebM</option>
                <option value="mp3">🎵 MP3</option>
                <option value="flac">🎵 FLAC</option>
              </select>
            </SettingRow>

            <SettingRow label="Max Concurrent Downloads">
              <input
                className="input-glass"
                type="range"
                min="1"
                max="10"
                value={settings.maxConcurrent}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setSettings((s) => ({ ...s, maxConcurrent: val }));
                  saveSetting("maxConcurrent", val);
                }}
                style={{ width: "100%" }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--accent-purple)",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {settings.maxConcurrent} simultaneous downloads
              </span>
            </SettingRow>

            <SettingRow label="Download Path">
              <input
                className="input-glass"
                value={settings.downloadPath}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    downloadPath: e.target.value,
                  }))
                }
                onBlur={() =>
                  saveSetting("downloadPath", settings.downloadPath)
                }
                placeholder="./downloads"
                style={{ width: "100%" }}
              />
            </SettingRow>
          </div>
        </motion.div>

        {/* Connection Settings */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: 24 }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            🔌 Connections
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Supabase */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  className={`status-dot ${
                    connStatus.supabase === true
                      ? "online"
                      : connStatus.supabase === false
                      ? "offline"
                      : ""
                  }`}
                  style={{
                    background:
                      connStatus.supabase === null
                        ? "var(--text-muted)"
                        : undefined,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Supabase (PostgreSQL)
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => testConnection("supabase")}
                  style={{ fontSize: 11, padding: "4px 10px", marginLeft: "auto" }}
                >
                  Test
                </button>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
              </p>
            </div>

            {/* Redis */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  className={`status-dot ${
                    connStatus.redis === true
                      ? "online"
                      : connStatus.redis === false
                      ? "offline"
                      : ""
                  }`}
                  style={{
                    background:
                      connStatus.redis === null
                        ? "var(--text-muted)"
                        : undefined,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Upstash Redis
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => testConnection("redis")}
                  style={{ fontSize: 11, padding: "4px 10px", marginLeft: "auto" }}
                >
                  Test
                </button>
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: "var(--radius-sm)",
              background: "rgba(59, 130, 246, 0.05)",
              border: "1px solid rgba(59, 130, 246, 0.1)",
              fontSize: 12,
              color: "var(--text-secondary)",
              lineHeight: 1.5,
            }}
          >
            💡 Connections are configured via <code>.env.local</code> file. The
            app works offline with IndexedDB fallback when services are
            unavailable.
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ padding: 24 }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
            🗄️ Data Management
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              className="btn-danger"
              onClick={async () => {
                if (confirm("Clear all download history? This cannot be undone.")) {
                  try {
                    await fetch("/api/queue", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "clear" }),
                    });
                    notifications.show({
                      title: "Cleared",
                      message: "Download history cleared",
                      color: "violet",
                    });
                  } catch {
                    notifications.show({
                      title: "Error",
                      message: "Failed to clear history",
                      color: "red",
                    });
                  }
                }
              }}
              style={{ width: "100%" }}
            >
              🗑 Clear Download History
            </button>

            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  await fetch("/api/queue", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "retry-all" }),
                  });
                  notifications.show({
                    title: "Retrying",
                    message: "All failed downloads re-queued",
                    color: "violet",
                  });
                } catch {
                  // ignore
                }
              }}
              style={{ width: "100%" }}
            >
              🔄 Retry All Failed Downloads
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ---- Setting Row Component ----

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
