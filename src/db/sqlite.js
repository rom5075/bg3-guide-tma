// SQLite storage — long-term memory for Minthara bot
// Synchronous (better-sqlite3), runs on VPS only (NOT Vercel)

import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'
import { mkdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

const DB_PATH = process.env.DB_PATH || join(__dirname, '../../data/minthara.db')

// Ensure data directory exists
const dbDir = dirname(DB_PATH)
if (!existsSync(dbDir)) mkdirSync(dbDir, { recursive: true })

const db = new Database(DB_PATH)

// Performance settings (WAL = fast concurrent reads, safe writes)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT    NOT NULL,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id        TEXT PRIMARY KEY,
    name           TEXT,
    act            INTEGER DEFAULT 1,
    mood           TEXT    DEFAULT 'neutral',
    mood_score     INTEGER DEFAULT 0,
    intimate_count INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    romance_mode   INTEGER DEFAULT 0,
    intimate_mode  INTEGER DEFAULT 0,
    first_seen     TEXT,
    last_seen      TEXT
  );

  CREATE TABLE IF NOT EXISTS memories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    memory_type TEXT,
    summary     TEXT NOT NULL,
    created_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS intimate_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    ordinal     INTEGER,
    summary     TEXT,
    happened_at TEXT
  );

  CREATE TABLE IF NOT EXISTS known_facts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    fact       TEXT NOT NULL,
    created_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
  CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
  CREATE INDEX IF NOT EXISTS idx_facts_user    ON known_facts(user_id);
  CREATE INDEX IF NOT EXISTS idx_nights_user   ON intimate_log(user_id);
`)

// Safe migrations — add new columns if they don't exist yet
for (const col of ['location', 'behavior']) {
  try { db.exec(`ALTER TABLE intimate_log ADD COLUMN ${col} TEXT`) } catch {}
}
for (const tbl of ['memories', 'intimate_log', 'known_facts']) {
  try { db.exec(`ALTER TABLE ${tbl} ADD COLUMN embedding BLOB`) } catch {}
}

console.log(`[SQLite] DB ready: ${DB_PATH}`)

// ── Messages ──────────────────────────────────────────────────────────────────

const stmtSaveMsg = db.prepare(
  `INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)`
)
const stmtGetMsgs = db.prepare(
  `SELECT role, content FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT ?`
)
const stmtDelMsgs = db.prepare(
  `DELETE FROM messages WHERE user_id = ?`
)

export function saveMessage(userId, role, content) {
  stmtSaveMsg.run(String(userId), role, String(content))
}

/** Returns last `limit` messages, oldest-first (ready for Claude API) */
export function getRecentMessages(userId, limit = 50) {
  const rows = stmtGetMsgs.all(String(userId), limit)
  return rows.reverse()
}

export function deleteMessages(userId) {
  stmtDelMsgs.run(String(userId))
}

// ── Profile ───────────────────────────────────────────────────────────────────

const stmtGetProfile = db.prepare(
  `SELECT * FROM profiles WHERE user_id = ?`
)
const stmtUpsertProfile = db.prepare(`
  INSERT INTO profiles (
    user_id, name, act, mood, mood_score,
    intimate_count, total_messages, romance_mode, intimate_mode,
    first_seen, last_seen
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    name           = excluded.name,
    act            = excluded.act,
    mood           = excluded.mood,
    mood_score     = excluded.mood_score,
    intimate_count = excluded.intimate_count,
    total_messages = excluded.total_messages,
    romance_mode   = excluded.romance_mode,
    intimate_mode  = excluded.intimate_mode,
    first_seen     = COALESCE(profiles.first_seen, excluded.first_seen),
    last_seen      = excluded.last_seen
`)
const stmtResetFlags = db.prepare(
  `UPDATE profiles SET romance_mode = 0, intimate_mode = 0 WHERE user_id = ?`
)

/** Returns raw SQLite row (snake_case) or null */
export function getProfile(userId) {
  return stmtGetProfile.get(String(userId)) || null
}

/**
 * Saves profile. Accepts both camelCase (from JS) and snake_case (from SQLite row).
 * first_seen is preserved from existing row (COALESCE in SQL).
 */
export function saveProfile(userId, data) {
  const now = new Date().toISOString()
  stmtUpsertProfile.run(
    String(userId),
    data.name           ?? null,
    data.act            ?? data.act            ?? 1,
    data.mood           ?? 'neutral',
    data.moodScore      ?? data.mood_score     ?? 0,
    data.intimateCount  ?? data.intimate_count ?? 0,
    data.totalMessages  ?? data.total_messages ?? 0,
    data.romanceMode    ? 1 : (data.romance_mode  ? 1 : 0),
    data.intimateMode   ? 1 : (data.intimate_mode ? 1 : 0),
    data.firstSeen      || data.first_seen  || now,
    data.lastSeen       || data.last_seen   || now,
  )
}

/** Clears romanceMode/intimateMode flags on /reset */
export function resetSessionFlags(userId) {
  stmtResetFlags.run(String(userId))
}

// ── Memories ──────────────────────────────────────────────────────────────────

const stmtAddMemory = db.prepare(
  `INSERT INTO memories (user_id, memory_type, summary, created_at, embedding) VALUES (?, ?, ?, ?, ?)`
)
const stmtGetMemories = db.prepare(
  `SELECT memory_type, summary, created_at FROM memories WHERE user_id = ? ORDER BY id DESC LIMIT ?`
)
const stmtGetAllMemories = db.prepare(
  `SELECT id, memory_type, summary, created_at, embedding FROM memories WHERE user_id = ? ORDER BY id ASC`
)

export function addMemory(userId, type, summary, date, embedding = null) {
  stmtAddMemory.run(String(userId), type || null, summary, date || new Date().toISOString(), embedding ?? null)
}

/** Returns last `limit` memories, oldest-first (fallback when no RAG) */
export function getMemories(userId, limit = 10) {
  const rows = stmtGetMemories.all(String(userId), limit)
  return rows.reverse()
}

/** Returns ALL memories with embeddings for RAG search */
export function getAllMemories(userId) {
  return stmtGetAllMemories.all(String(userId))
}

// ── Intimate log ──────────────────────────────────────────────────────────────

const stmtAddNight = db.prepare(
  `INSERT INTO intimate_log (user_id, ordinal, summary, happened_at, location, behavior, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)`
)
const stmtGetNights = db.prepare(
  `SELECT ordinal, summary, happened_at, location, behavior FROM intimate_log WHERE user_id = ? ORDER BY id DESC LIMIT ?`
)
const stmtGetAllNights = db.prepare(
  `SELECT id, ordinal, summary, happened_at, location, behavior, embedding FROM intimate_log WHERE user_id = ? ORDER BY id ASC`
)

export function addIntimateNight(userId, ordinal, summary, date, location, behavior, embedding = null) {
  stmtAddNight.run(String(userId), ordinal ?? null, summary ?? null, date || new Date().toISOString(), location ?? null, behavior ?? null, embedding ?? null)
}

/** Returns last `limit` intimate nights, oldest-first (fallback when no RAG) */
export function getIntimateNights(userId, limit = 5) {
  const rows = stmtGetNights.all(String(userId), limit)
  return rows.reverse()
}

/** Returns ALL intimate nights with embeddings for RAG search */
export function getAllNights(userId) {
  return stmtGetAllNights.all(String(userId))
}

// ── Known facts ───────────────────────────────────────────────────────────────

const stmtAddFact = db.prepare(
  `INSERT INTO known_facts (user_id, fact, created_at, embedding) VALUES (?, ?, ?, ?)`
)
const stmtGetFacts = db.prepare(
  `SELECT fact FROM known_facts WHERE user_id = ? ORDER BY id DESC LIMIT ?`
)
const stmtGetAllFacts = db.prepare(
  `SELECT id, fact, embedding FROM known_facts WHERE user_id = ? ORDER BY id ASC`
)

export function addFact(userId, fact, date, embedding = null) {
  stmtAddFact.run(String(userId), fact, date || new Date().toISOString(), embedding ?? null)
}

/** Returns last `limit` facts as string array, oldest-first (fallback when no RAG) */
export function getFacts(userId, limit = 8) {
  const rows = stmtGetFacts.all(String(userId), limit)
  return rows.reverse().map(r => r.fact)
}

/** Returns ALL facts with embeddings for RAG search */
export function getAllFacts(userId) {
  return stmtGetAllFacts.all(String(userId))
}

/** Update embedding for an existing record — used by backfill.js */
export function updateEmbedding(table, id, embeddingBuffer) {
  db.prepare(`UPDATE ${table} SET embedding = ? WHERE id = ?`).run(embeddingBuffer, id)
}
