'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * Resolve the default DB file path for this container.
 * The backend should typically override this via an environment variable (e.g., NEWS_DB_PATH),
 * but we provide a stable default for local/dev usage.
 */
function getDefaultDbPath() {
  return path.join(__dirname, 'data', 'news_hub.sqlite3');
}

/**
 * Ensure a directory exists.
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Load schema SQL from schema.sql shipped with this container.
 * @returns {string}
 */
function loadSchemaSql() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  return fs.readFileSync(schemaPath, 'utf8');
}

/**
 * PUBLIC_INTERFACE
 * Create (or open) the SQLite database and apply schema idempotently.
 *
 * This function is safe to call multiple times:
 * - It opens a DB connection.
 * - It applies schema.sql which uses IF NOT EXISTS for tables and indexes.
 * - It sets useful PRAGMAs.
 *
 * @param {object} [options]
 * @param {string} [options.dbPath] - File path to SQLite DB. If omitted, uses container default.
 * @param {boolean} [options.readonly] - Open the DB in readonly mode (default false).
 * @returns {import('better-sqlite3').Database}
 */
function initDatabase(options = {}) {
  const dbPath = options.dbPath || getDefaultDbPath();
  const readonly = Boolean(options.readonly);

  ensureDir(path.dirname(dbPath));

  const db = new Database(dbPath, { readonly });

  // Reasonable defaults for a local single-process app.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  if (!readonly) {
    const schemaSql = loadSchemaSql();
    db.exec(schemaSql);

    // Ensure default settings exist (idempotent).
    // We intentionally do NOT overwrite user-chosen settings.
    const insertIfMissing = db.prepare(
      `INSERT INTO settings(key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO NOTHING`
    );

    insertIfMissing.run('country', 'us');
    insertIfMissing.run('default_category', 'general');
  }

  return db;
}

module.exports = {
  initDatabase,
  getDefaultDbPath,
};
