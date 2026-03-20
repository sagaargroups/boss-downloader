// ============================================
// URL Input Component — Bulk Paste + Detection
// ============================================
"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { detectPlatform, detectMultipleUrls, getPlatformInfo } from "@/lib/url-detector";
import type { UrlDetectionResult, EngineName, VideoQuality, OutputFormat } from "@/types";

interface UrlInputProps {
  onSubmit: (urls: string[], quality: VideoQuality, format: OutputFormat) => void;
  isLoading: boolean;
  selectedEngine: EngineName;
}

export default function UrlInput({ onSubmit, isLoading, selectedEngine }: UrlInputProps) {
  const [text, setText] = useState("");
  const [detectedUrls, setDetectedUrls] = useState<UrlDetectionResult[]>([]);
  const [quality, setQuality] = useState<VideoQuality>("best");
  const [format, setFormat] = useState<OutputFormat>("mp4");
  const [isBulkMode, setIsBulkMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (value.trim()) {
      const results = detectMultipleUrls(value);
      setDetectedUrls(results);
      if (results.length > 1) setIsBulkMode(true);
    } else {
      setDetectedUrls([]);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    // Auto-detect is handled by handleTextChange via state update
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".txt")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const content = ev.target?.result as string;
          handleTextChange(content);
        };
        reader.readAsText(file);
      }
    },
    [handleTextChange]
  );

  const handleSubmit = useCallback(() => {
    const validUrls = detectedUrls
      .filter((d) => d.isValid)
      .map((d) => d.url);
    if (validUrls.length > 0) {
      onSubmit(validUrls, quality, format);
      setText("");
      setDetectedUrls([]);
    }
  }, [detectedUrls, quality, format, onSubmit]);

  const removeUrl = useCallback(
    (url: string) => {
      const updated = detectedUrls.filter((d) => d.url !== url);
      setDetectedUrls(updated);
      const newText = updated.map((d) => d.url).join("\n");
      setText(newText);
    },
    [detectedUrls]
  );

  const validCount = detectedUrls.filter((d) => d.isValid).length;

  return (
    <div className="glass-card gradient-border" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>
          ✨ Add Downloads
        </h2>
        <button
          className="btn-secondary"
          onClick={() => setIsBulkMode(!isBulkMode)}
          style={{ fontSize: 12, padding: "6px 12px" }}
        >
          {isBulkMode ? "📝 Single Mode" : "📋 Bulk Mode"}
        </button>
      </div>

      {/* URL Input Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ position: "relative" }}
      >
        <textarea
          ref={textareaRef}
          className="input-glass"
          placeholder={
            isBulkMode
              ? "Paste multiple URLs here (one per line)...\nSupports: YouTube, Instagram, Twitter, Reddit, Vimeo, Facebook, direct URLs"
              : "Paste a video URL here..."
          }
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onPaste={handlePaste}
          rows={isBulkMode ? 5 : 2}
          style={{
            width: "100%",
            transition: "min-height 0.3s ease",
            minHeight: isBulkMode ? 120 : 56,
          }}
        />

        {text.length === 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            📁 Drop a .txt file with URLs
          </div>
        )}
      </div>

      {/* Detected URL Chips */}
      <AnimatePresence>
        {detectedUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {detectedUrls.map((d, i) => (
              <motion.div
                key={d.url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                className="badge"
                style={{
                  background: d.isValid
                    ? `${d.color}15`
                    : "rgba(239, 68, 68, 0.1)",
                  color: d.isValid ? d.color : "var(--accent-red)",
                  border: `1px solid ${
                    d.isValid ? `${d.color}30` : "rgba(239, 68, 68, 0.3)"
                  }`,
                  padding: "4px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() => removeUrl(d.url)}
                title={d.url}
              >
                <span>{d.icon}</span>
                <span
                  style={{
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {new URL(d.url).hostname}
                </span>
                <span style={{ opacity: 0.5, marginLeft: 4 }}>×</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Quality */}
        <select
          className="input-glass"
          value={quality}
          onChange={(e) => setQuality(e.target.value as VideoQuality)}
          style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
        >
          <option value="best">🎯 Best Quality</option>
          <option value="1080p">📺 1080p</option>
          <option value="720p">📺 720p</option>
          <option value="480p">📺 480p</option>
          <option value="360p">📺 360p</option>
          <option value="audio_only">🎵 Audio Only</option>
        </select>

        {/* Format */}
        <select
          className="input-glass"
          value={format}
          onChange={(e) => setFormat(e.target.value as OutputFormat)}
          style={{ width: "auto", padding: "8px 12px", fontSize: 13 }}
        >
          <option value="mp4">📦 MP4</option>
          <option value="mkv">📦 MKV</option>
          <option value="webm">📦 WebM</option>
          <option value="mp3">🎵 MP3</option>
          <option value="flac">🎵 FLAC</option>
        </select>

        <div style={{ flex: 1 }} />

        {/* Clear */}
        {detectedUrls.length > 0 && (
          <button
            className="btn-secondary"
            onClick={() => {
              setText("");
              setDetectedUrls([]);
            }}
            style={{ fontSize: 13, padding: "8px 14px" }}
          >
            Clear
          </button>
        )}

        {/* Submit to Queue */}
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={validCount === 0 || isLoading}
          style={{
            opacity: validCount === 0 || isLoading ? 0.5 : 1,
            cursor:
              validCount === 0 || isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner" /> Adding...
            </>
          ) : (
            <>🚀 Add to Queue ({validCount})</>
          )}
        </button>

        {/* Direct browser download */}
        {validCount === 1 && (
          <button
            className="btn-secondary"
            onClick={() => {
              const url = detectedUrls.find((d) => d.isValid)?.url;
              if (url) {
                const params = new URLSearchParams({ url, quality, format });
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                iframe.src = `/api/download/stream?${params.toString()}`;
                document.body.appendChild(iframe);
                // The browser will handle the download. We remove the iframe after a while.
                setTimeout(() => document.body.removeChild(iframe), 30000);
              }
            }}
            style={{ fontSize: 13, padding: "8px 14px" }}
            title="Download directly to your device via browser Save As"
          >
            ⬇ Download Now
          </button>
        )}
      </div>
    </div>
  );
}
