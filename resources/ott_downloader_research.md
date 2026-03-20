# 🎬 OTT Downloader — "Don't Reinvent the Wheel" Research

## The Philosophy

Instead of writing download logic, stream parsers, or protocol handlers from scratch, we leverage **battle-tested open-source wheels** and wrap them into a unified, ultra-fast downloader.

---

## 🛞 The Wheels (Existing Tools to Use)

### Tier 1 — Core Engine (MUST HAVE)

| Tool | What It Does | Why We Need It |
|------|-------------|----------------|
| **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** | Extracts & downloads video from **1000+ sites** | The #1 wheel — handles YouTube, JioHotstar, and most OTT platforms out of the box. Actively maintained fork of youtube-dl |
| **[aria2](https://github.com/aria2/aria2)** | Multi-threaded, multi-connection download accelerator | Makes downloads **5-10x faster** via segmented parallel downloading (16 connections per file). `yt-dlp` can use it as external downloader |
| **[ffmpeg](https://ffmpeg.org/)** | Media processing swiss army knife | Merges video+audio streams, handles HLS/DASH/M3U8 decryption, format conversion, segment stitching |

### Tier 2 — DRM & Premium Content

| Tool | What It Does | Platform |
|------|-------------|----------|
| **[pywidevine](https://github.com/devine-dl/pywidevine)** | Widevine DRM CDM implementation | Netflix, JioHotstar premium, Amazon Prime |
| **[devine](https://github.com/devine-dl/devine)** | Multi-service DRM video downloader framework | Wraps pywidevine with service-specific extractors |

> [!CAUTION]
> **DRM-protected content (Netflix, Amazon Prime, JioHotstar Premium)** uses Widevine L1/L3 encryption. Downloading is **legally restricted** and technically complex. Netflix specifically blocks yt-dlp, ffmpeg, and browser extensions. Only free/non-DRM content can be reliably downloaded. **This is a legal gray area — proceed with caution.**

### Tier 3 — Speed Boosters & Utilities

| Tool | What It Does |
|------|-------------|
| **[N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE)** | Ultra-fast HLS/DASH/M3U8 stream downloader (written in C#, blazing fast) |
| **[axel](https://github.com/axel-download-accelerator/axel)** | Lightweight multi-connection download accelerator |
| **[gallery-dl](https://github.com/mikf/gallery-dl)** | Image/gallery downloader (Instagram, Twitter, etc.) — bonus for social media content |

---

## 🏗️ Proposed Architecture

```
┌─────────────────────────────────────────────────────┐
│                   WEB UI / CLI                       │
│              (User pastes URL here)                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              ORCHESTRATOR (Node.js/Python)            │
│  ┌─────────────────────────────────────────────┐    │
│  │  URL Router — detects platform & picks tool  │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Queue Manager (Bull/Redis or simple queue)  │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Progress Tracker (WebSocket real-time)       │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  yt-dlp  │ │  N_m3u8  │ │ gallery  │
   │ +aria2c  │ │  DL-RE   │ │   -dl    │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │             │            │
        ▼             ▼            ▼
   ┌──────────────────────────────────────┐
   │         ffmpeg (post-processing)      │
   │  merge streams / convert / metadata   │
   └──────────────────────────────────────┘
        │
        ▼
   ┌──────────────────────────────────────┐
   │       OUTPUT (organized by platform)  │
   │  /downloads/youtube/video_name.mp4    │
   │  /downloads/hotstar/show_ep01.mp4     │
   └──────────────────────────────────────┘
```

---

## ⚡ Why This Is Ultra-Fast

1. **aria2 as external downloader** — `yt-dlp --external-downloader aria2c --downloader-args "aria2c:-x 16 -s 16 -k 1M"` = **16 parallel connections**, each downloading 1MB chunks
2. **N_m3u8DL-RE** for HLS streams — purpose-built C# tool that's **faster than ffmpeg** for M3U8 downloads
3. **Segmented downloading** — files split into chunks, downloaded in parallel, then reassembled
4. **Queue system** — multiple downloads run concurrently without blocking each other

---

## 📋 Platform Support Matrix

| Platform | Tool | DRM? | Difficulty |
|----------|------|------|------------|
| **YouTube** | yt-dlp | ❌ No | ✅ Easy |
| **JioHotstar (Free)** | yt-dlp | ❌ No | ✅ Easy |
| **JioHotstar (Premium)** | yt-dlp + cookies | ⚠️ Partial | 🟡 Medium |
| **Instagram Reels** | yt-dlp / gallery-dl | ❌ No | ✅ Easy |
| **Twitter/X Videos** | yt-dlp / gallery-dl | ❌ No | ✅ Easy |
| **Netflix** | pywidevine/devine | ✅ Heavy DRM | 🔴 Very Hard |
| **Amazon Prime** | pywidevine/devine | ✅ Heavy DRM | 🔴 Very Hard |
| **Vimeo** | yt-dlp | ❌ No | ✅ Easy |
| **Dailymotion** | yt-dlp | ❌ No | ✅ Easy |
| **Facebook Videos** | yt-dlp | ❌ No | ✅ Easy |
| **Reddit Videos** | yt-dlp | ❌ No | ✅ Easy |

---

## 🎯 What We Need to Install & Keep in Our Codebase

### Binary Dependencies (install once)
```bash
# These are the "wheels" — download pre-built binaries
pip install yt-dlp          # or download standalone binary
pip install pywidevine      # DRM handling (optional)
choco install aria2         # or download from GitHub releases
choco install ffmpeg        # or download static build
```

### NPM Packages (Node.js wrappers)
```bash
npm install youtube-dl-exec    # Node.js wrapper for yt-dlp
npm install bull               # Job queue (if using Redis)
npm install ws                 # WebSocket for progress
npm install express            # API server
```

### Our Code (what WE write)
We only write the **glue/orchestration** layer:
1. **URL Router** — detect which platform a URL belongs to
2. **Config Manager** — quality presets, output paths, format preferences
3. **Progress API** — WebSocket server to stream download progress to UI
4. **Web UI** — paste URL, pick quality, see progress, download file
5. **Cookie/Auth Manager** — handle login cookies for premium content

---

## 🤔 Discussion Points (Need Your Input)

1. **Tech Stack**: Should the backend be **Node.js** (faster API, good for WebSocket) or **Python** (native yt-dlp integration, no wrapper needed)?

2. **Scope — DRM Content**: Do you want to include Netflix/Prime DRM downloading? This adds significant complexity and legal risk. Or should we focus on **free/public content** (YouTube, free Hotstar, social media)?

3. **UI Preference**: Web-based UI (browser), Desktop app (Electron), or CLI-only for now?

4. **Deployment**: Run locally on your machine, or as a self-hosted server that anyone on your network can use?

5. **Priority platforms**: Which platforms are most important to you? This decides what we build first.
