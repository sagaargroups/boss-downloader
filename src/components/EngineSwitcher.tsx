// ============================================
// Engine Switcher — Select Download Engine
// ============================================
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { EngineName } from "@/types";

interface EngineSwitcherProps {
  selected: EngineName;
  onSelect: (engine: EngineName) => void;
}

interface EngineInfo {
  name: EngineName;
  label: string;
  icon: string;
  description: string;
  bestFor: string;
}

const ENGINES: EngineInfo[] = [
  {
    name: "ytdlp",
    label: "yt-dlp",
    icon: "🎬",
    description: "Universal video downloader supporting 1000+ websites",
    bestFor: "YouTube, Instagram, Twitter, Reddit, and most platforms",
  },
  {
    name: "aria2",
    label: "aria2",
    icon: "⚡",
    description: "Multi-connection download accelerator — 16 parallel connections",
    bestFor: "Direct file URLs (.mp4, .mkv, .zip) — fastest for large files",
  },
  {
    name: "nm3u8",
    label: "N_m3u8DL-RE",
    icon: "📡",
    description: "Blazing fast HLS/DASH stream downloader (C#)",
    bestFor: "Live streams, .m3u8 and .mpd manifest URLs",
  },
];

export default function EngineSwitcher({
  selected,
  onSelect,
}: EngineSwitcherProps) {
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [isChecking, setIsChecking] = useState(false);

  // Check binary availability is not needed on client side
  // This would be done via API in production

  return (
    <div
      className="glass-card"
      style={{
        padding: 20,
        position: "sticky",
        top: 24,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        🔧 Engine
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ENGINES.map((engine) => {
          const isSelected = selected === engine.name;

          return (
            <motion.button
              key={engine.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(engine.name)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "14px 16px",
                borderRadius: "var(--radius-md)",
                background: isSelected
                  ? "rgba(124, 58, 237, 0.12)"
                  : "var(--bg-glass)",
                border: `1px solid ${
                  isSelected
                    ? "rgba(124, 58, 237, 0.3)"
                    : "var(--border-subtle)"
                }`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  layoutId="engine-indicator"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    background: "var(--gradient-primary)",
                    borderRadius: "0 2px 2px 0",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 20 }}>{engine.icon}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isSelected
                      ? "var(--accent-purple)"
                      : "var(--text-primary)",
                  }}
                >
                  {engine.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "var(--accent-purple)",
                      color: "white",
                      padding: "1px 6px",
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    ACTIVE
                  </span>
                )}
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                  marginBottom: 4,
                }}
              >
                {engine.description}
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontStyle: "italic",
                }}
              >
                Best for: {engine.bestFor}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Engine Tip */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: "var(--radius-sm)",
          background: "rgba(124, 58, 237, 0.05)",
          border: "1px solid rgba(124, 58, 237, 0.1)",
          fontSize: 12,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        💡 <strong>Tip:</strong> The engine is auto-recommended per URL. You <br />
        can override it here or per-download. yt-dlp + aria2 combo gives the
        fastest results.
      </div>
    </div>
  );
}
