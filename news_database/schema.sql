-- SQLite schema for News Hub favorites and settings.
-- This schema is designed to be safe to apply multiple times:
-- - tables are created with IF NOT EXISTS
-- - indexes are created with IF NOT EXISTS
-- - settings are keyed by a fixed primary key (key TEXT PRIMARY KEY)

PRAGMA foreign_keys = ON;

-- Stores favorited articles. We keep a stable "article_id" computed by backend
-- (e.g., hash of url) and store enough metadata to render a favorites list.
CREATE TABLE IF NOT EXISTS favorites (
  article_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  content TEXT,
  author TEXT,
  source_name TEXT,
  published_at TEXT,          -- ISO string (backend normalizes)
  image_url TEXT,
  category TEXT,              -- optional: track which category it came from
  country TEXT,               -- optional: track which country setting at time of favoriting
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Optimize lookup/sorting for the favorites view.
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_published_at ON favorites(published_at DESC);

-- Simple key/value settings store (single-user/local app).
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Helpful for debugging/admin listing.
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at DESC);
