# 🚀 Boss Downloader — Ultra-Detailed Master Task Tracker

> **Project**: OTT Video Downloader with Web UI, Bulk Processing, Switchable Engines & Offline-First Architecture
> **Stack**: Next.js 14 (App Router) · Mantine v7 · Zustand · Supabase · Upstash Redis · Dexie.js · Framer Motion
> **Architecture**: Hybrid — Serverless (Web UI + API) + Local Worker (Download Engines)

---

## Phase 1: Foundation & Project Scaffolding

### 1.1 — Project Initialization
- [ ] Create `boss-downloader` project directory at workspace root
- [ ] Initialize Next.js 14 project with App Router, TypeScript, ESLint, `src/` directory
  - [ ] Run `npx create-next-app@latest ./ --ts --eslint --app --src-dir --use-npm`
  - [ ] Verify `package.json` is created with correct Next.js 14 version
  - [ ] Verify `tsconfig.json` is generated with strict mode
  - [ ] Verify `next.config.js` exists and is valid

### 1.2 — Core Dependency Installation
- [ ] Install UI framework dependencies
  - [ ] `@mantine/core` — 120+ components, dark mode
  - [ ] `@mantine/hooks` — utility hooks (clipboard, debounce, etc.)
  - [ ] `@mantine/notifications` — toast system for download events
  - [ ] `@mantine/nprogress` — top progress bar for page transitions
  - [ ] `@tabler/icons-react` — icon set matching Mantine
  - [ ] `framer-motion` — smooth micro-animations
- [ ] Install database & caching dependencies
  - [ ] `@supabase/supabase-js` — Supabase PostgreSQL client
  - [ ] `@upstash/redis` — serverless HTTP-based Redis
  - [ ] `dexie` — IndexedDB wrapper for offline fallback
  - [ ] `dexie-react-hooks` — React hooks for Dexie
- [ ] Install state management
  - [ ] `zustand` — lightweight global state
- [ ] Install build tools
  - [ ] `postcss` — CSS processing
  - [ ] `postcss-preset-mantine` — Mantine PostCSS preset
  - [ ] `postcss-simple-vars` — PostCSS variables support
- [ ] Install real-time & streaming
  - [ ] `eventsource-parser` — SSE parsing for progress streams
- [ ] Verify all dependencies in `package.json` — no version conflicts
- [ ] Run `npm run dev` — confirm clean startup on `localhost:3000`

### 1.3 — Project Directory Structure
- [ ] Create `src/app/` — Next.js App Router pages
  - [ ] `src/app/layout.tsx` — root layout (Mantine provider, dark theme, fonts)
  - [ ] `src/app/page.tsx` — dashboard home page
  - [ ] `src/app/globals.css` — global styles + CSS variables
  - [ ] `src/app/history/page.tsx` — download history page
  - [ ] `src/app/settings/page.tsx` — settings/config page
- [ ] Create `src/app/api/` — API route handlers
  - [ ] `src/app/api/download/route.ts` — start a download job
  - [ ] `src/app/api/queue/route.ts` — queue management (list, reorder, clear)
  - [ ] `src/app/api/progress/route.ts` — SSE stream for real-time progress
  - [ ] `src/app/api/detect/route.ts` — URL platform detection
  - [ ] `src/app/api/settings/route.ts` — read/write user settings
- [ ] Create `src/components/` — React UI components
- [ ] Create `src/lib/` — core libraries (engines, DB, cache, queue)
  - [ ] `src/lib/db/` — database layer
  - [ ] `src/lib/cache/` — caching layer
  - [ ] `src/lib/engines/` — download engine wrappers
  - [ ] `src/lib/queue/` — job queue management
- [ ] Create `src/hooks/` — custom React hooks
- [ ] Create `src/store/` — Zustand stores
- [ ] Create `src/types/` — TypeScript type definitions
- [ ] Create `.env.local` with placeholder environment variables
- [ ] Create `.env.example` with documented env var template

### 1.4 — Environment & Config
- [ ] Configure `next.config.js` for external binary execution (worker mode)
- [ ] Configure `postcss.config.js` with Mantine presets
- [ ] Create `tsconfig.json` path aliases (`@/components`, `@/lib`, etc.)
- [ ] Add `.gitignore` entries for `.env.local`, `node_modules`, download outputs

---

## Phase 2: TypeScript Types & Interfaces

### 2.1 — Core Type Definitions (`src/types/index.ts`)
- [ ] Define `DownloadStatus` enum — `queued | detecting | downloading | paused | merging | completed | failed | cancelled`
- [ ] Define `EngineName` type — `'ytdlp' | 'aria2' | 'nm3u8'`
- [ ] Define `Platform` type — `'youtube' | 'hotstar' | 'instagram' | 'twitter' | 'reddit' | 'vimeo' | 'facebook' | 'dailymotion' | 'unknown'`
- [ ] Define `VideoQuality` type — `'best' | '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | 'audio_only'`
- [ ] Define `OutputFormat` type — `'mp4' | 'mkv' | 'webm' | 'mp3' | 'flac' | 'wav'`
- [ ] Define `Download` interface:
  ```
  id, url, title, platform, engine, status, progress (0-100),
  fileSize, filePath, format, quality, speed, eta,
  error, metadata (thumbnail, duration, description),
  createdAt, updatedAt
  ```
- [ ] Define `VideoInfo` interface — title, thumbnail, duration, formats[], fileSize, platform
- [ ] Define `DownloadOptions` interface — quality, format, engine, outputDir, cookies
- [ ] Define `DownloadProcess` interface — processId, engineName, status, progress, speed, eta, onProgress callback
- [ ] Define `DownloadEngine` interface:
  ```
  name, detect(url), getInfo(url), download(url, options),
  pause(processId), resume(processId), cancel(processId)
  ```
- [ ] Define `QueueItem` interface — download, priority, retryCount, addedAt
- [ ] Define `AppSettings` interface — defaultEngine, defaultQuality, defaultFormat, downloadPath, maxConcurrent, supabaseUrl, supabaseKey, redisUrl, redisToken
- [ ] Define `SSEProgressEvent` interface — downloadId, progress, speed, eta, status
- [ ] Define `UrlDetectionResult` interface — url, platform, isValid, icon, color

---

## Phase 3: Database & Caching Layer

### 3.1 — Supabase Schema Setup
- [ ] Create `supabase_schema.sql` in project root
- [ ] Design `downloads` table:
  - [ ] `id` — UUID primary key (auto-generated)
  - [ ] `url` — TEXT NOT NULL
  - [ ] `title` — TEXT (nullable, filled after detection)
  - [ ] `platform` — TEXT (youtube, hotstar, etc.)
  - [ ] `engine` — TEXT DEFAULT 'ytdlp'
  - [ ] `status` — TEXT DEFAULT 'queued' with CHECK constraint
  - [ ] `progress` — REAL DEFAULT 0 (0.0 to 100.0)
  - [ ] `file_size` — BIGINT (bytes)
  - [ ] `file_path` — TEXT (local path to downloaded file)
  - [ ] `format` — TEXT (mp4, mkv, mp3...)
  - [ ] `quality` — TEXT (best, 1080p, 720p...)
  - [ ] `speed` — TEXT (human-readable, e.g., "2.5 MB/s")
  - [ ] `eta` — TEXT (human-readable, e.g., "3m 20s")
  - [ ] `error` — TEXT (error message if failed)
  - [ ] `metadata` — JSONB (thumbnail URL, duration, description, etc.)
  - [ ] `created_at` — TIMESTAMPTZ DEFAULT NOW()
  - [ ] `updated_at` — TIMESTAMPTZ DEFAULT NOW()
  - [ ] Add index on `status` for queue queries
  - [ ] Add index on `platform` for history filtering
  - [ ] Add index on `created_at` for sorting
- [ ] Design `settings` table:
  - [ ] `key` — TEXT PRIMARY KEY
  - [ ] `value` — JSONB NOT NULL
  - [ ] `updated_at` — TIMESTAMPTZ DEFAULT NOW()
- [ ] Add `updated_at` auto-update trigger function
- [ ] Run schema in Supabase dashboard — verify tables created

### 3.2 — Supabase Client (`src/lib/db/supabase.ts`)
- [ ] Initialize Supabase client with env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Create `getDownloads()` — fetch all downloads, ordered by `created_at` DESC
- [ ] Create `getDownloadById(id)` — fetch single download
- [ ] Create `getDownloadsByStatus(status)` — fetch filtered by status
- [ ] Create `createDownload(data)` — insert new download record
- [ ] Create `updateDownload(id, data)` — partial update a download
- [ ] Create `deleteDownload(id)` — soft delete or hard delete
- [ ] Create `getSettings()` — fetch all settings as key-value map
- [ ] Create `updateSetting(key, value)` — upsert a setting
- [ ] Add error handling with typed responses for each function
- [ ] Test connection — verify read/write works

### 3.3 — Upstash Redis Cache (`src/lib/cache/redis.ts`)
- [ ] Initialize Upstash Redis client with env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- [ ] Create `cacheVideoInfo(url, info, ttl)` — cache URL metadata (TTL = 1 hour)
- [ ] Create `getCachedVideoInfo(url)` — retrieve cached metadata
- [ ] Create `cacheDownloadProgress(id, progress)` — cache active progress
- [ ] Create `getCachedProgress(id)` — get cached progress
- [ ] Create `invalidateCache(key)` — delete specific cache key
- [ ] Create `flushDownloadCache()` — clear all download-related cache
- [ ] Add connection health check function
- [ ] Test Redis read/write operations

### 3.4 — Dexie.js IndexedDB Fallback (`src/lib/db/dexie.ts`)
- [ ] Define Dexie database schema version 1
- [ ] Create `downloads` object store — mirror Supabase `downloads` columns
- [ ] Create `settings` object store — mirror Supabase `settings` columns
- [ ] Create `syncQueue` object store — track pending sync operations
- [ ] Add compound indexes for efficient queries
- [ ] Create CRUD operations mirroring Supabase client API
- [ ] Test IndexedDB creation in browser dev tools

### 3.5 — Offline Sync Engine (`src/lib/db/sync.ts`)
- [ ] Create `SyncEngine` class
- [ ] Implement `isOnline()` — check navigator.onLine + ping Supabase
- [ ] Implement `enqueueSync(operation)` — add to sync queue when offline
- [ ] Implement `processQueue()` — replay sync queue when back online
- [ ] Implement `syncLocalToRemote()` — push Dexie data → Supabase
- [ ] Implement `syncRemoteToLocal()` — pull Supabase data → Dexie
- [ ] Implement conflict resolution — last-write-wins based on `updated_at`
- [ ] Add `online`/`offline` event listeners for auto-sync trigger
- [ ] Handle partial sync failures — retry failed operations
- [ ] Test offline → online transition — verify data consistency

### 3.6 — Cache Fallback Logic (`src/lib/cache/fallback.ts`)
- [ ] Implement three-tier cache strategy:
  - [ ] Try Upstash Redis first
  - [ ] If Redis fails → fallback to Dexie IndexedDB
  - [ ] If Dexie fails → fallback to in-memory `Map`
- [ ] Implement `getCached(key)` — try all tiers in order
- [ ] Implement `setCached(key, value, ttl)` — write to available tier
- [ ] When Redis recovers → sync IndexedDB data → Redis
- [ ] Log cache tier used for debugging

---

## Phase 4: Download Engine Orchestrator

### 4.1 — Engine Base Interface (`src/lib/engines/base.ts`)
- [ ] Define abstract `BaseEngine` class implementing `DownloadEngine` interface
- [ ] Add shared `parseProgress(rawOutput)` method — parse CLI stdout into progress %
- [ ] Add shared `spawnProcess(command, args)` method — execute CLI binary
- [ ] Add shared `killProcess(processId)` method — terminate a running process
- [ ] Add process tracking Map to manage active download processes
- [ ] Add shared error handling and retry logic

### 4.2 — yt-dlp Engine (`src/lib/engines/ytdlp.ts`)
- [ ] Extend `BaseEngine`
- [ ] Implement `detect(url)` — use yt-dlp `--list-extractors` or URL pattern matching
- [ ] Implement `getInfo(url)` — run `yt-dlp --dump-json <url>`, parse VideoInfo
- [ ] Implement `download(url, options)`:
  - [ ] Build yt-dlp command with quality flags (`-f bestvideo+bestaudio`, etc.)
  - [ ] Add `--external-downloader aria2c --downloader-args "aria2c:-x 16 -s 16 -k 1M"` for speed
  - [ ] Add `--merge-output-format mp4` or user-selected format
  - [ ] Add `--output` template for organized output paths
  - [ ] Parse progress from yt-dlp stdout (`[download] XX.X% of ~XXX.XXMB`)
  - [ ] Emit progress events via callback
- [ ] Implement `pause(processId)` — send SIGSTOP to process
- [ ] Implement `resume(processId)` — send SIGCONT to process
- [ ] Implement `cancel(processId)` — kill process + clean up partial files
- [ ] Handle cookies for authenticated downloads (`--cookies-from-browser`)
- [ ] Handle playlist URLs — detect and split into individual items
- [ ] Add error parsing for common yt-dlp failures (geo-block, removed, private)

### 4.3 — aria2 Engine (`src/lib/engines/aria2.ts`)
- [ ] Extend `BaseEngine`
- [ ] Implement `detect(url)` — accept direct file URLs (`.mp4`, `.mkv`, etc.)
- [ ] Implement `getInfo(url)` — HTTP HEAD request for file size + content type
- [ ] Implement `download(url, options)`:
  - [ ] Build aria2c command with `-x 16 -s 16 -k 1M` (16 parallel connections)
  - [ ] Add `--dir` for output directory
  - [ ] Add `--out` for filename
  - [ ] Add `--continue=true` for resume support
  - [ ] Parse progress from aria2c stdout
  - [ ] Emit progress events
- [ ] Implement `pause(processId)` — aria2c RPC pause
- [ ] Implement `resume(processId)` — aria2c RPC unpause
- [ ] Implement `cancel(processId)` — kill process + remove `.aria2` control file
- [ ] Test with large direct download URLs

### 4.4 — N_m3u8DL-RE Engine (`src/lib/engines/nm3u8.ts`)
- [ ] Extend `BaseEngine`
- [ ] Implement `detect(url)` — match `.m3u8`, `.mpd`, HLS/DASH manifest URLs
- [ ] Implement `getInfo(url)` — parse manifest for stream info (quality options, duration)
- [ ] Implement `download(url, options)`:
  - [ ] Build N_m3u8DL-RE command with thread count, format selection
  - [ ] Add `--save-dir` for output
  - [ ] Add `--save-name` for filename
  - [ ] Add auto-mux with ffmpeg flag
  - [ ] Parse progress from N_m3u8DL-RE stdout
  - [ ] Emit progress events
- [ ] Implement `pause(processId)` — SIGSTOP
- [ ] Implement `resume(processId)` — SIGCONT
- [ ] Implement `cancel(processId)` — kill + cleanup
- [ ] Test with public HLS streams

### 4.5 — ffmpeg Post-Processor (`src/lib/engines/ffmpeg.ts`)
- [ ] Create `FFmpegProcessor` class (not a download engine, but a post-processor)
- [ ] Implement `mergeStreams(videoPath, audioPath, outputPath)` — merge separate video + audio
- [ ] Implement `convertFormat(inputPath, outputFormat, outputPath)` — transcode/remux
- [ ] Implement `extractAudio(inputPath, outputPath, format)` — extract audio track only
- [ ] Implement `addMetadata(filePath, metadata)` — embed title, thumbnail, etc.
- [ ] Parse ffmpeg progress from stderr (frame count, time, speed)
- [ ] Handle common ffmpeg errors (codec not found, corrupt file)

### 4.6 — Engine Manager & Hot-Swap (`src/lib/engines/manager.ts`)
- [ ] Create `EngineManager` singleton
- [ ] Register all engines (ytdlp, aria2, nm3u8) on initialization
- [ ] Implement `getEngine(name)` — return engine by name
- [ ] Implement `detectBestEngine(url)` — auto-select engine based on URL
- [ ] Implement `switchEngine(processId, newEngine)`:
  - [ ] Pause current engine's download
  - [ ] Record last known progress/byte position
  - [ ] Cancel old engine process
  - [ ] Start new engine from same URL (with resume if supported)
  - [ ] Return seamless progress stream
- [ ] Implement `getAvailableEngines()` — check which binaries are installed on system
- [ ] Verify binary availability on startup (yt-dlp, aria2c, ffmpeg, N_m3u8DL-RE)
- [ ] Log warnings for missing binaries

### 4.7 — URL Detector (`src/lib/url-detector.ts`)
- [ ] Create URL pattern registry (regex per platform)
- [ ] Implement `detectPlatform(url)` → `{ platform, icon, color, isValid }`
- [ ] Support detection for:
  - [ ] YouTube — `youtube.com`, `youtu.be`, `youtube.com/shorts/`
  - [ ] JioHotstar — `hotstar.com`, `jiohotstar.com`
  - [ ] Instagram — `instagram.com/reel/`, `instagram.com/p/`
  - [ ] Twitter/X — `twitter.com`, `x.com`
  - [ ] Reddit — `reddit.com`, `v.redd.it`
  - [ ] Vimeo — `vimeo.com`
  - [ ] Facebook — `facebook.com`, `fb.watch`
  - [ ] Dailymotion — `dailymotion.com`
  - [ ] Generic direct URLs — `.mp4`, `.mkv`, `.m3u8`, `.mpd`
- [ ] Implement `detectMultipleUrls(text)` — parse bulk text into individual URLs
  - [ ] Split by newline, comma, space
  - [ ] Validate each URL
  - [ ] Return array of `UrlDetectionResult`
- [ ] Add auto-engine recommendation per platform

---

## Phase 5: Queue & Worker System

### 5.1 — Queue Manager (`src/lib/queue/manager.ts`)
- [ ] Create `QueueManager` class
- [ ] Implement `addToQueue(url, options)` — create download record + enqueue
- [ ] Implement `addBulkToQueue(urls[], options)` — batch enqueue multiple URLs
- [ ] Implement `removeFromQueue(id)` — remove a pending item
- [ ] Implement `reorderQueue(id, newPosition)` — change queue priority
- [ ] Implement `clearQueue()` — remove all pending items
- [ ] Implement `getQueueStatus()` — return queue stats (pending, active, completed, failed)
- [ ] Implement `retryFailed(id)` — re-enqueue a failed download
- [ ] Implement `retryAllFailed()` — re-enqueue all failed downloads
- [ ] Respect `maxConcurrent` setting — only N downloads active at once
- [ ] Auto-start next queued download when a slot opens up
- [ ] Store queue state in Redis (primary) with Dexie fallback

### 5.2 — Download Worker (`src/lib/queue/worker.ts` + `worker.ts`)
- [ ] Create worker entry point (`worker.ts` at project root)
- [ ] Implement worker loop:
  - [ ] Poll queue for next pending download
  - [ ] Select engine (from user preference or auto-detect)
  - [ ] Run `engine.getInfo(url)` — fetch video metadata
  - [ ] Update download record with metadata (title, thumbnail, size)
  - [ ] Run `engine.download(url, options)` — start download process
  - [ ] Stream progress updates to database + cache
  - [ ] On completion → run ffmpeg post-processing if needed
  - [ ] Update download record status to `completed`
  - [ ] Move to next item in queue
- [ ] Handle worker crash recovery — detect interrupted downloads on startup
- [ ] Add graceful shutdown signal handling (SIGINT, SIGTERM)
- [ ] Add `npm run worker` script to `package.json`
- [ ] Support running worker standalone (for VPS deployment)

### 5.3 — Pause/Play/Resume Controller
- [ ] Implement `pauseDownload(id)` — pause engine process + update status to `paused`
- [ ] Implement `resumeDownload(id)` — resume engine process + update status to `downloading`
- [ ] Implement `cancelDownload(id)` — kill process + clean up temp files + update status to `cancelled`
- [ ] Implement `pauseAll()` — pause all active downloads
- [ ] Implement `resumeAll()` — resume all paused downloads
- [ ] Implement `cancelAll()` — cancel all active + paused downloads
- [ ] Persist pause state across worker restarts

---

## Phase 6: API Layer (Next.js API Routes)

### 6.1 — Download API (`src/app/api/download/route.ts`)
- [ ] `POST /api/download` — start a new download
  - [ ] Accept body: `{ url, quality?, format?, engine? }`
  - [ ] Validate URL
  - [ ] Detect platform
  - [ ] Create download record in DB
  - [ ] Add to queue
  - [ ] Return `{ id, status: 'queued', platform }`
- [ ] `POST /api/download/bulk` — start multiple downloads
  - [ ] Accept body: `{ urls: string[], quality?, format?, engine? }`
  - [ ] Validate all URLs
  - [ ] Create records + enqueue all
  - [ ] Return array of results
- [ ] `DELETE /api/download/:id` — cancel a download
- [ ] `PATCH /api/download/:id` — pause/resume/change engine
  - [ ] Accept body: `{ action: 'pause' | 'resume' | 'cancel' | 'switch_engine', engine? }`

### 6.2 — Queue API (`src/app/api/queue/route.ts`)
- [ ] `GET /api/queue` — get full queue status (all downloads grouped by status)
- [ ] `POST /api/queue/clear` — clear all pending downloads
- [ ] `POST /api/queue/retry-all` — retry all failed downloads
- [ ] `PATCH /api/queue/reorder` — reorder queue items

### 6.3 — Progress SSE Stream (`src/app/api/progress/route.ts`)
- [ ] `GET /api/progress` — Server-Sent Events stream
  - [ ] Return `Content-Type: text/event-stream`
  - [ ] Send `data: { id, progress, speed, eta, status }` per active download
  - [ ] Update every 500ms or on status change
  - [ ] Handle client disconnect cleanly
  - [ ] Support `Last-Event-ID` for reconnection
- [ ] `GET /api/progress/:id` — SSE stream for single download

### 6.4 — URL Detection API (`src/app/api/detect/route.ts`)
- [ ] `POST /api/detect` — detect platform from URL(s)
  - [ ] Accept body: `{ urls: string[] }`
  - [ ] Return `{ results: UrlDetectionResult[] }`
  - [ ] Include platform icon, color, and supported engines per URL

### 6.5 — Settings API (`src/app/api/settings/route.ts`)
- [ ] `GET /api/settings` — fetch all settings
- [ ] `PUT /api/settings` — update settings
  - [ ] Accept body: `{ key: string, value: any }`
  - [ ] Validate settings keys
  - [ ] Persist to Supabase + update local cache

---

## Phase 7: Zustand State Management

### 7.1 — Download Store (`src/store/downloadStore.ts`)
- [ ] Define store state: `downloads[]`, `activeCount`, `isConnected`
- [ ] Create actions:
  - [ ] `addDownload(download)` — add to local state
  - [ ] `updateDownload(id, partial)` — update progress/status
  - [ ] `removeDownload(id)` — remove from state
  - [ ] `setDownloads(downloads[])` — replace all (for initial load)
  - [ ] `getDownloadById(id)` — selector
  - [ ] `getActiveDownloads()` — selector for downloading/paused items
  - [ ] `getQueuedDownloads()` — selector for queued items
  - [ ] `getCompletedDownloads()` — selector for history
  - [ ] `getFailedDownloads()` — selector for failed items

### 7.2 — Settings Store (`src/store/settingsStore.ts`)
- [ ] Define store state: all `AppSettings` fields with defaults
- [ ] Create actions:
  - [ ] `loadSettings()` — fetch from API on app mount
  - [ ] `updateSetting(key, value)` — update single setting + persist via API
  - [ ] `resetSettings()` — reset to defaults

---

## Phase 8: Custom React Hooks

### 8.1 — Download Hook (`src/hooks/useDownloads.ts`)
- [ ] Create `useDownloads()` hook
- [ ] Fetch initial downloads from API on mount
- [ ] Connect to SSE progress stream
- [ ] Update Zustand store on each SSE event
- [ ] Auto-reconnect SSE on disconnect
- [ ] Return `{ downloads, isLoading, error, refetch }`

### 8.2 — Progress Hook (`src/hooks/useProgress.ts`)
- [ ] Create `useProgress(downloadId?)` hook
- [ ] Subscribe to SSE `/api/progress` or `/api/progress/:id`
- [ ] Parse incoming events and return `{ progress, speed, eta, status }`
- [ ] Handle reconnection with exponential backoff
- [ ] Clean up EventSource on unmount

### 8.3 — Offline Detection Hook (`src/hooks/useOffline.ts`)
- [ ] Create `useOffline()` hook
- [ ] Listen to `online`/`offline` browser events
- [ ] Ping Supabase/Redis health endpoints for real connectivity check
- [ ] Return `{ isOnline, isChecking, lastOnline }`
- [ ] Trigger sync engine on online recovery

---

## Phase 9: Web UI — Premium Dark Dashboard

### 9.1 — Root Layout & Theme (`src/app/layout.tsx`)
- [ ] Set up `MantineProvider` with custom dark theme
- [ ] Define color palette — deep dark (#0a0a0f), accent gradient (purple → blue → cyan)
- [ ] Set default font family (Inter or system sans-serif from Google Fonts)
- [ ] Add `ColorSchemeScript` for dark mode SSR
- [ ] Add responsive viewport meta tags
- [ ] Add SEO meta tags (title, description, og:image)
- [ ] Set up `Notifications` provider (Mantine toast system)
- [ ] Set up `NavigationProgress` for page transitions

### 9.2 — Global Styles (`src/app/globals.css`)
- [ ] Define CSS custom properties (--bg-primary, --bg-card, --accent, --glass-bg, etc.)
- [ ] Implement glassmorphism utility classes (`backdrop-filter: blur()`, semi-transparent bg)
- [ ] Add smooth scroll behavior
- [ ] Add custom scrollbar styling (thin, dark, matches theme)
- [ ] Add subtle glow/shadow utilities for cards
- [ ] Add gradient border utilities
- [ ] Add keyframe animations (fadeIn, slideUp, pulse, shimmer)

### 9.3 — Dashboard Page (`src/app/page.tsx`)
- [ ] Build main dashboard layout with sidebar navigation or top nav
- [ ] Compose dashboard from child components:
  - [ ] `<UrlInput />` — bulk URL input area (top section)
  - [ ] `<DownloadQueue />` — active downloads (main section)
  - [ ] `<EngineSwitcher />` — engine selector panel (sidebar or inline)
- [ ] Add stats summary bar — total downloads, active, completed, total data downloaded
- [ ] Add connection status indicator (online/offline, Redis, Supabase)
- [ ] Add responsive layout — stack vertically on mobile

### 9.4 — URL Input Component (`src/components/UrlInput.tsx`)
- [ ] Build large textarea with glassmorphism styling
- [ ] Implement smart paste detection:
  - [ ] Listen to `paste` event on textarea
  - [ ] Auto-split clipboard content by newline/comma/space
  - [ ] Show each detected URL as a labeled chip/tag with platform icon
- [ ] Add single URL input mode (text input + "Add" button)
- [ ] Add bulk mode toggle (switch between single and textarea)
- [ ] Add URL validation — highlight invalid URLs in red
- [ ] Add platform auto-detection badges per URL (YouTube icon, Instagram icon, etc.)
- [ ] Add drag-and-drop zone for `.txt` files containing URL lists
- [ ] Add quality selector dropdown (best, 1080p, 720p, etc.)
- [ ] Add format selector dropdown (MP4, MKV, MP3, etc.)
- [ ] Add "Add to Queue" button with loading state
- [ ] Add "Clear All" button
- [ ] Add animated micro-interactions on add/remove
- [ ] Add keyboard shortcut (Ctrl+V auto-focuses textarea)

### 9.5 — Download Queue Component (`src/components/DownloadQueue.tsx`)
- [ ] Build scrollable list of active download cards
- [ ] Group by status — downloading at top, queued below, paused section
- [ ] Add "Pause All" / "Resume All" / "Cancel All" bulk action buttons
- [ ] Add empty state with animated illustration
- [ ] Add loading skeleton while fetching
- [ ] Support drag-and-drop reordering of queued items
- [ ] Add total queue stats at top (X downloading, Y queued, Z completed)

### 9.6 — Download Card Component (`src/components/DownloadCard.tsx`)
- [ ] Display per-download card with:
  - [ ] Thumbnail (if available) or platform icon
  - [ ] Title with text truncation
  - [ ] Platform badge (colored tag)
  - [ ] Animated progress bar (gradient fill, percentage label)
  - [ ] Speed indicator (e.g., "2.5 MB/s")
  - [ ] ETA indicator (e.g., "3m 20s remaining")
  - [ ] File size indicator (e.g., "450 MB / 1.2 GB")
  - [ ] Engine badge (which engine is being used)
- [ ] Add action buttons:
  - [ ] ⏸️ Pause button (toggles to ▶️ Resume)
  - [ ] ❌ Cancel button with confirmation
  - [ ] 🔀 Switch engine dropdown (inline)
  - [ ] 📂 Open file location (completed downloads)
- [ ] Add status-specific styling:
  - [ ] Downloading — pulsing accent border + animated progress
  - [ ] Paused — dimmed card + yellow status
  - [ ] Completed — green checkmark + subtle glow
  - [ ] Failed — red border + error message tooltip + retry button
  - [ ] Queued — neutral style + queue position number
- [ ] Add hover effects and micro-animations (scale, shadow lift)

### 9.7 — Progress Bar Component (`src/components/ProgressBar.tsx`)
- [ ] Build custom animated progress bar (not using Mantine default)
- [ ] Gradient fill (accent color left → lighter right)
- [ ] Smooth CSS transition on width change
- [ ] Percentage text overlay
- [ ] Shimmer animation while downloading
- [ ] Pulse animation when paused
- [ ] Completion animation (flash + fade to solid green)
- [ ] Indeterminate mode for "detecting" status

### 9.8 — Engine Switcher Component (`src/components/EngineSwitcher.tsx`)
- [ ] Build engine selection panel:
  - [ ] yt-dlp card — icon, description ("1000+ sites, best compatibility")
  - [ ] aria2 card — icon, description ("16x parallel, fastest for direct URLs")
  - [ ] N_m3u8DL-RE card — icon, description ("Blazing fast HLS/DASH streams")
- [ ] Show which engines are installed/available (green check) vs missing (gray + install link)
- [ ] Show currently active engine with highlight
- [ ] Allow switching default engine
- [ ] Allow per-download engine override
- [ ] Show engine recommendation badge per detected platform
- [ ] Add smooth transition animations on selection

### 9.9 — History Page (`src/app/history/page.tsx` + `src/components/HistoryTable.tsx`)
- [ ] Build download history page with data table
- [ ] Display columns: Title, Platform, Size, Format, Quality, Engine, Date, Status
- [ ] Add search/filter bar:
  - [ ] Text search by title/URL
  - [ ] Filter by platform (dropdown)
  - [ ] Filter by status (completed/failed/cancelled)
  - [ ] Filter by date range
  - [ ] Sort by date/size/title
- [ ] Add pagination or infinite scroll
- [ ] Add bulk selection + bulk delete
- [ ] Add "Re-download" action per item
- [ ] Add "Open File" action per completed item
- [ ] Add download statistics summary at top (total downloads, total data, most used platform)
- [ ] Add empty state for no history
- [ ] Add export history as CSV/JSON

### 9.10 — Settings Page (`src/app/settings/page.tsx` + `src/components/SettingsForm.tsx`)
- [ ] Build settings page with organized sections:
- [ ] **Connection Settings**
  - [ ] Supabase URL input (with test connection button)
  - [ ] Supabase Service Key input (masked, with reveal toggle)
  - [ ] Upstash Redis URL input (with test connection button)
  - [ ] Upstash Redis Token input (masked)
  - [ ] Connection status indicators (green/red dot per service)
- [ ] **Download Defaults**
  - [ ] Default engine selector (yt-dlp / aria2 / N_m3u8)
  - [ ] Default quality selector (best / 1080p / 720p / etc.)
  - [ ] Default format selector (MP4 / MKV / MP3 / etc.)
  - [ ] Default download directory path
  - [ ] Max concurrent downloads slider (1-10)
- [ ] **Engine Configuration**
  - [ ] yt-dlp binary path (auto-detect or manual)
  - [ ] aria2c binary path
  - [ ] ffmpeg binary path
  - [ ] N_m3u8DL-RE binary path
  - [ ] Binary availability check with status indicators
- [ ] **Data Management**
  - [ ] Clear download history button (with confirmation modal)
  - [ ] Clear cache button
  - [ ] Export settings button
  - [ ] Import settings button
  - [ ] Sync status indicator (Supabase ↔ local)
- [ ] Add "Save Settings" button with success toast
- [ ] Add "Reset to Defaults" button with confirmation
- [ ] Add form validation for all inputs

---

## Phase 10: Animations & Micro-Interactions (Framer Motion)

### 10.1 — Page Transitions
- [ ] Add fade + slide-up animation on page load
- [ ] Add staggered children animation for lists (cards appear one by one)
- [ ] Add exit animations for page transitions

### 10.2 — Component Animations
- [ ] URL chips — bounce-in on add, shrink-out on remove
- [ ] Download cards — slide-in from right on queue add
- [ ] Progress bars — smooth spring animation on value change
- [ ] Status changes — color morph transition with scale pulse
- [ ] Buttons — hover scale (1.02) + shadow lift
- [ ] Cards — hover shadow expand + subtle translate-Y(-2px)
- [ ] Empty states — gentle float/bob animation on illustration
- [ ] Connection status — pulse animation on reconnect

### 10.3 — Layout Animations
- [ ] `AnimatePresence` for conditional rendering (show/hide sections)
- [ ] `LayoutGroup` for smooth reordering when queue changes
- [ ] Spring-based transitions (no harsh linear movements)

---

## Phase 11: Verification & End-to-End Testing

### 11.1 — Dev Server Verification
- [ ] Run `npm run dev` — verify clean startup on `localhost:3000`
- [ ] Verify no TypeScript errors in terminal
- [ ] Verify no console errors in browser
- [ ] Verify dark theme renders correctly
- [ ] Verify all pages load (dashboard, history, settings)
- [ ] Verify responsive layout on mobile viewport

### 11.2 — Database & Cache Verification
- [ ] Verify Supabase connection from Settings page (test button)
- [ ] Verify Redis connection from Settings page (test button)
- [ ] Create a download record — verify it appears in Supabase dashboard
- [ ] Disconnect internet — verify Dexie IndexedDB fallback works
- [ ] Reconnect — verify offline data syncs to Supabase

### 11.3 — URL Detection Verification
- [ ] Paste YouTube URL — verify YouTube badge appears
- [ ] Paste Instagram Reel URL — verify Instagram badge
- [ ] Paste bulk URLs (5+ different platforms) — verify all detected correctly
- [ ] Paste invalid URL — verify error state shown
- [ ] Paste text file with URLs — verify drag-and-drop works

### 11.4 — Download Flow Verification
- [ ] Add a YouTube URL to queue — verify it enters "queued" status
- [ ] Start worker (`npm run worker`) — verify download begins
- [ ] Verify progress bar animates in real-time (SSE updates)
- [ ] Verify speed and ETA display correctly
- [ ] Verify download completes — file appears in output folder
- [ ] Verify completed download shows in history page

### 11.5 — Engine Switching Verification
- [ ] Start download with yt-dlp
- [ ] Switch to aria2 mid-download — verify new engine picks up
- [ ] Start an HLS stream download — verify N_m3u8DL-RE is recommended
- [ ] Verify engine availability indicators on Settings page

### 11.6 — Pause/Resume/Cancel Verification
- [ ] Pause an active download — verify progress freezes + status changes
- [ ] Resume a paused download — verify progress continues
- [ ] Cancel a download — verify temp files cleaned up + status changes
- [ ] Test "Pause All" and "Resume All" buttons

### 11.7 — Bulk Download Verification
- [ ] Paste 10 URLs at once — verify all enqueue successfully
- [ ] Verify max concurrent limit is respected (only N active at a time)
- [ ] Verify queue auto-advances when a download completes

### 11.8 — Offline Mode Verification
- [ ] Disconnect Redis + Supabase — verify app still works with Dexie
- [ ] Add downloads while offline — verify they queue locally
- [ ] Reconnect — verify sync engine pushes local data to remote

### 11.9 — Build & Deployment Readiness
- [ ] Run `npm run build` — verify zero errors
- [ ] Verify output is deployable to Vercel/Netlify (serverless-compatible)
- [ ] Verify worker can run standalone via `npm run worker`

### 11.10 — UI/UX Polish Verification
- [ ] Verify all animations are smooth (60fps, no jank)
- [ ] Verify dark theme has no white flash on load
- [ ] Verify all interactive elements have hover/focus states
- [ ] Verify all forms have proper validation messages
- [ ] Verify all buttons have loading states where appropriate
- [ ] Verify all empty states have proper illustrations/messages
- [ ] Verify keyboard navigation works (tab order, Enter to submit)
- [ ] Take screenshots of each page for visual review
