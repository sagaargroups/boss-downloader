# Boss Downloader — Implementation Plan

Ultra-fast OTT video downloader with Web UI, bulk processing, switchable engines, and resilient offline-first architecture.

## User Review Required

> [!IMPORTANT]
> **Serverless Limitation**: Actual video downloads (yt-dlp, aria2, ffmpeg) need a **running process** — they can't execute inside Vercel/Netlify serverless functions (max 10s timeout). The plan uses a **hybrid approach**:
> - **Web UI + API + DB** → deployed serverless (Vercel/Netlify)
> - **Download Worker** → runs locally via `npm run worker` (or on a VPS later)
> - Local mode (`npm run dev`) runs everything together

> [!WARNING]
> **Netflix/Prime DRM** (Widevine L1) content is excluded from Phase 1. We focus on free/public platforms first (YouTube, JioHotstar free, Instagram, Twitter, Reddit, Vimeo, Facebook).

---

## The Full Wheel Inventory

Every layer uses battle-tested existing tools — **zero reinvention**:

| Layer | Wheel | Why |
|-------|-------|-----|
| **UI Framework** | Next.js 14 (App Router) | SSR, API routes, serverless-ready |
| **UI Components** | Mantine v7 | 120+ components, no Tailwind needed, dark mode, beautiful |
| **State** | Zustand | Tiny, fast global state |
| **Animations** | Framer Motion | Smooth micro-animations |
| **Database** | Supabase (PostgreSQL) | Free tier, real-time, auth-ready |
| **ORM** | Supabase JS Client | Direct SDK, no extra ORM needed |
| **Caching** | Upstash Redis | Serverless Redis, HTTP-based |
| **Local DB Fallback** | Dexie.js (IndexedDB) | Offline-first, auto-sync |
| **Download Engine 1** | yt-dlp | 1000+ site support |
| **Download Engine 2** | aria2c | 16-connection parallel download |
| **Download Engine 3** | N_m3u8DL-RE | Fastest HLS/DASH downloader |
| **Post-processor** | ffmpeg | Stream merge, format convert |
| **Queue** | Custom + Redis | Job queue with priorities |
| **Real-time** | Server-Sent Events (SSE) | Progress streaming to UI |
| **Icons** | Tabler Icons | Mantine's default icon set |

---

## Proposed Changes

### Project Scaffold

#### [NEW] Project directory
**Location**: `i:\.shortcut-targets-by-id\1b-BEMQWGxm7YDonAt65VltEAI6dZqeGn\REVOLUTIONARY ASSETS\YOU CAN USE\WORKFLOW AUTOMATION TEMPLATE\boss_downloader\`

```
boss_downloader/
├── app/                        # Next.js App Router
│   ├── layout.tsx             # Root layout (Mantine provider, dark theme)
│   ├── page.tsx               # Dashboard home
│   ├── globals.css            # Global styles
│   ├── api/                   # API routes
│   │   ├── download/route.ts  # Start download
│   │   ├── queue/route.ts     # Queue management
│   │   ├── progress/route.ts  # SSE progress stream
│   │   ├── detect/route.ts    # URL detection
│   │   └── settings/route.ts  # User settings
│   ├── history/page.tsx       # Download history
│   └── settings/page.tsx      # Settings page
├── components/                 # React components
│   ├── Dashboard.tsx          # Main dashboard
│   ├── UrlInput.tsx           # Bulk URL textarea + paste
│   ├── DownloadQueue.tsx      # Active downloads with progress
│   ├── DownloadCard.tsx       # Individual download item
│   ├── EngineSwitcher.tsx     # Switch between yt-dlp/aria2/N_m3u8
│   ├── ProgressBar.tsx        # Animated progress bar
│   ├── HistoryTable.tsx       # Past downloads
│   └── SettingsForm.tsx       # DB/Cache config form
├── lib/                        # Core libraries
│   ├── db/
│   │   ├── supabase.ts        # Supabase client
│   │   ├── dexie.ts           # Dexie.js IndexedDB setup
│   │   └── sync.ts            # Offline sync engine
│   ├── cache/
│   │   ├── redis.ts           # Upstash Redis client
│   │   └── fallback.ts        # Cache fallback logic
│   ├── engines/
│   │   ├── base.ts            # Engine interface/abstract
│   │   ├── ytdlp.ts           # yt-dlp wrapper
│   │   ├── aria2.ts           # aria2 wrapper
│   │   ├── nm3u8.ts           # N_m3u8DL-RE wrapper
│   │   └── ffmpeg.ts          # ffmpeg post-processor
│   ├── queue/
│   │   ├── manager.ts         # Download queue manager
│   │   └── worker.ts          # Worker process runner
│   ├── url-detector.ts        # Platform detection from URL
│   └── utils.ts               # Shared utilities
├── hooks/                      # Custom React hooks
│   ├── useDownloads.ts        # Download state hook
│   ├── useProgress.ts        # SSE progress hook
│   └── useOffline.ts         # Online/offline detection
├── store/                      # Zustand stores
│   ├── downloadStore.ts       # Download state
│   └── settingsStore.ts       # Settings state
├── types/                      # TypeScript types
│   └── index.ts               # All type definitions
├── worker.ts                   # Standalone worker entry point
├── .env.local                  # Environment variables
├── .env.example                # Example env file
├── next.config.js              # Next.js config
├── package.json
└── tsconfig.json
```

---

### Database Schema (Supabase)

#### [NEW] [schema.sql](file:///i:/.shortcut-targets-by-id/1b-BEMQWGxm7YDonAt65VltEAI6dZqeGn/REVOLUTIONARY%20ASSETS/YOU%20CAN%20USE/WORKFLOW%20AUTOMATION%20TEMPLATE/boss_downloader/supabase_schema.sql)

```sql
-- Downloads table
CREATE TABLE downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  platform TEXT,            -- youtube, hotstar, instagram, etc.
  engine TEXT DEFAULT 'ytdlp', -- ytdlp, aria2, nm3u8
  status TEXT DEFAULT 'queued', -- queued, downloading, paused, completed, failed
  progress REAL DEFAULT 0,
  file_size BIGINT,
  file_path TEXT,
  format TEXT,               -- mp4, mkv, mp3, etc.
  quality TEXT,              -- best, 1080p, 720p, etc.
  speed TEXT,
  eta TEXT,
  error TEXT,
  metadata JSONB,            -- thumbnail, duration, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Caching Architecture

#### [NEW] [redis.ts](file:///i:/.shortcut-targets-by-id/1b-BEMQWGxm7YDonAt65VltEAI6dZqeGn/REVOLUTIONARY%20ASSETS/YOU%20CAN%20USE/WORKFLOW%20AUTOMATION%20TEMPLATE/boss_downloader/lib/cache/redis.ts)

**Three-tier caching strategy:**
1. **Upstash Redis** (primary) — URL metadata, download info cache
2. **Browser Cache** (Service Worker) — static assets, API responses  
3. **Dexie.js IndexedDB** (fallback) — full offline mirror of all data

**Fallback logic:**
```
Try Redis → if fail → Try IndexedDB → if fail → in-memory Map
When Redis recovers → sync IndexedDB data → Redis
```

---

### Download Engine Abstraction

#### [NEW] [base.ts](file:///i:/.shortcut-targets-by-id/1b-BEMQWGxm7YDonAt65VltEAI6dZqeGn/REVOLUTIONARY%20ASSETS/YOU%20CAN%20USE/WORKFLOW%20AUTOMATION%20TEMPLATE/boss_downloader/lib/engines/base.ts)

All engines implement a common interface — **users can hot-swap engines mid-download**:

```typescript
interface DownloadEngine {
  name: string;
  detect(url: string): Promise<boolean>;
  getInfo(url: string): Promise<VideoInfo>;
  download(url: string, options: DownloadOptions): DownloadProcess;
  pause(processId: string): Promise<void>;
  resume(processId: string): Promise<void>;
  cancel(processId: string): Promise<void>;
}
```

**Engine switching logic:**
- User selects engine from UI dropdown
- Current download pauses
- New engine picks up from last known state (or restarts with resume support)
- Progress continues seamlessly

---

### Bulk URL Processing

#### [NEW] [UrlInput.tsx](file:///i:/.shortcut-targets-by-id/1b-BEMQWGxm7YDonAt65VltEAI6dZqeGn/REVOLUTIONARY%20ASSETS/YOU%20CAN%20USE/WORKFLOW%20AUTOMATION%20TEMPLATE/boss_downloader/components/UrlInput.tsx)

- Large textarea that accepts **multiple URLs** (one per line, or comma/space separated)
- Smart paste detection: auto-splits clipboard content into individual URLs
- URL validation + platform auto-detection with badge/icon per URL
- "Add to Queue" button processes all URLs at once
- Drag-and-drop text files with URL lists

---

### Web UI Design

Premium dark dashboard with glassmorphism, inspired by modern download managers:

**Dashboard** → Bulk URL input | Active downloads queue | Engine switcher  
**History** → Searchable, filterable past downloads table  
**Settings** → DB/Cache connection config, default quality, download path, engine preferences

Key UI features:
- 🌙 Dark mode by default (Mantine dark theme)
- 📊 Animated progress bars with speed/ETA
- 🔄 Real-time SSE updates (no polling)
- ⏸️ Pause/Play/Cancel per download
- 🔀 Switch engines mid-download
- 📋 Bulk paste URLs
- 🏷️ Auto-detect platform badges (YouTube logo, etc.)

---

## Verification Plan

### Automated Tests

Since this is a new project, we'll verify through **functional browser-based testing**:

1. **Dev server start test:**
   ```bash
   cd boss_downloader && npm run dev
   ```
   Verify the server starts on `localhost:3000` without errors.

2. **Browser UI test:**
   - Open `http://localhost:3000` in browser
   - Verify dashboard loads with dark theme
   - Verify URL input textarea is visible
   - Verify engine switcher shows yt-dlp/aria2/N_m3u8 options

3. **Bulk URL paste test:**
   - Paste multiple YouTube URLs into the textarea
   - Verify each URL gets detected and shows platform badge
   - Click "Add to Queue"
   - Verify downloads appear in the queue

4. **Build test (serverless readiness):**
   ```bash
   cd boss_downloader && npm run build
   ```
   Verify the build succeeds without errors (proves it's deployable to Vercel/Netlify).

### Manual Verification
- **Download a YouTube video** using the UI, verify the file appears in the output folder
- **Switch engine** mid-download and verify it handles the change gracefully
- **Disconnect Redis/Supabase** and verify IndexedDB fallback works
- **Reconnect** and verify offline data syncs up
