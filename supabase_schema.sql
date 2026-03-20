-- ============================================
-- Boss Downloader — Supabase Schema
-- ============================================
-- Run this in your Supabase SQL Editor

-- Downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  platform TEXT DEFAULT 'unknown',
  engine TEXT DEFAULT 'ytdlp',
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','detecting','downloading','paused','merging','completed','failed','cancelled')),
  progress REAL DEFAULT 0,
  file_size BIGINT,
  file_path TEXT,
  format TEXT DEFAULT 'mp4',
  quality TEXT DEFAULT 'best',
  speed TEXT,
  eta TEXT,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
CREATE INDEX IF NOT EXISTS idx_downloads_platform ON downloads(platform);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_downloads_updated_at
  BEFORE UPDATE ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('defaultEngine', '"ytdlp"'),
  ('defaultQuality', '"best"'),
  ('defaultFormat', '"mp4"'),
  ('downloadPath', '"./downloads"'),
  ('maxConcurrent', '3')
ON CONFLICT (key) DO NOTHING;
