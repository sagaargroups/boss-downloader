// ============================================
// History Page — Past Downloads
// ============================================
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ProgressBar from "@/components/ProgressBar";
import {
  formatFileSize,
  timeAgo,
  getStatusColor,
  getPlatformDisplayName,
  getEngineDisplayName,
  truncate,
} from "@/lib/utils";
import type { Download, Platform, DownloadStatus } from "@/types";

export default function HistoryPage() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "size" | "title">("date");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/queue");
      if (res.ok) {
        const data = await res.json();
        setDownloads(
          (data.data || []).filter(
            (d: Download) =>
              d.status === "completed" ||
              d.status === "failed" ||
              d.status === "cancelled"
          )
        );
      }
    } catch {
      // Use empty array
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = downloads;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.title && d.title.toLowerCase().includes(q)) ||
          d.url.toLowerCase().includes(q)
      );
    }

    if (platformFilter !== "all") {
      result = result.filter((d) => d.platform === platformFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "date")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "size") return (b.fileSize || 0) - (a.fileSize || 0);
      if (sortBy === "title")
        return (a.title || a.url).localeCompare(b.title || b.url);
      return 0;
    });

    return result;
  }, [downloads, search, platformFilter, statusFilter, sortBy]);

  const stats = {
    total: downloads.length,
    completed: downloads.filter((d) => d.status === "completed").length,
    totalSize: downloads.reduce((acc, d) => acc + (d.fileSize || 0), 0),
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
            <span className="gradient-text">📜</span> Download History
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            {stats.total} downloads · {stats.completed} completed ·{" "}
            {formatFileSize(stats.totalSize)} total
          </p>
        </div>

        <nav className="nav-links">
          <Link href="/" className="nav-link">⚡ Dashboard</Link>
          <Link href="/history" className="nav-link active">📜 History</Link>
          <Link href="/settings" className="nav-link">⚙️ Settings</Link>
        </nav>
      </motion.header>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <input
          className="input-glass"
          placeholder="🔍 Search by title or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />

        <select
          className="input-glass"
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          style={{ width: "auto", padding: "8px 12px" }}
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter/X</option>
          <option value="reddit">Reddit</option>
          <option value="vimeo">Vimeo</option>
          <option value="facebook">Facebook</option>
        </select>

        <select
          className="input-glass"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "auto", padding: "8px 12px" }}
        >
          <option value="all">All Status</option>
          <option value="completed">✅ Completed</option>
          <option value="failed">❌ Failed</option>
          <option value="cancelled">🚫 Cancelled</option>
        </select>

        <select
          className="input-glass"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          style={{ width: "auto", padding: "8px 12px" }}
        >
          <option value="date">Sort: Date</option>
          <option value="size">Sort: Size</option>
          <option value="title">Sort: Title</option>
        </select>
      </motion.div>

      {/* History Table */}
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ padding: 0, overflow: "hidden" }}
      >
        {isLoading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-secondary)" }}>Loading history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No downloads found</div>
            <div className="empty-state-text">
              {search || platformFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Completed downloads will appear here."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    background: "var(--bg-glass)",
                  }}
                >
                  <th style={thStyle}>Title</th>
                  <th style={thStyle}>Platform</th>
                  <th style={thStyle}>Size</th>
                  <th style={thStyle}>Format</th>
                  <th style={thStyle}>Engine</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <td style={tdStyle} title={d.url}>
                      {truncate(d.title || d.url, 50)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        className="badge"
                        style={{
                          background: `${getStatusColor(d.status)}15`,
                          color: getStatusColor(d.status),
                        }}
                      >
                        {getPlatformDisplayName(d.platform)}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatFileSize(d.fileSize)}</td>
                    <td style={tdStyle}>
                      {d.format.toUpperCase()}
                    </td>
                    <td style={tdStyle}>
                      {getEngineDisplayName(d.engine)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          color: getStatusColor(d.status),
                          fontWeight: 500,
                        }}
                      >
                        {d.status === "completed" ? "✅" : d.status === "failed" ? "❌" : "🚫"}{" "}
                        {d.status}
                      </span>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: "var(--text-muted)",
                      }}
                    >
                      {timeAgo(d.createdAt)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  verticalAlign: "middle",
};
