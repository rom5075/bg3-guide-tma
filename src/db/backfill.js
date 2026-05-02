// Backfill embeddings for existing SQLite records
// Runs daily via GitHub Actions (22:00 UTC = 03:00 Ekaterinburg)
// Manual run: node --env-file=/var/www/minthara/.env /var/www/minthara/src/db/backfill.js

import * as storage from './sqlite.js'
import { getEmbedding, serializeVector } from '../ai/embeddings.js'

const VOYAGE_KEY          = process.env.VOYAGE_API_KEY
const DELAY_MS            = 2000   // 2s between requests = 30 RPM — very conservative
const COOLDOWN_MS         = 60_000 // 60s cooldown after retries exhausted

if (!VOYAGE_KEY) {
  console.error('[backfill] VOYAGE_API_KEY not set — exiting')
  process.exit(1)
}

// Get userId from env (same as TELEGRAM_CHAT_ID)
const userId = process.env.TELEGRAM_CHAT_ID
if (!userId) {
  console.error('[backfill] TELEGRAM_CHAT_ID not set — exiting')
  process.exit(1)
}

// ── Telegram notifications ────────────────────────────────────────────────────

async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch {}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function backfillTable(label, rows, textKey, table) {
  const missing = rows.filter(r => !r.embedding)
  console.log(`[backfill] ${label}: ${rows.length} total, ${missing.length} need embedding`)

  let done = 0
  let failed = 0
  for (const row of missing) {
    const text = row[textKey]
    if (!text?.trim()) { failed++; continue }

    const vec = await getEmbedding(text, VOYAGE_KEY)
    if (vec) {
      storage.updateEmbedding(table, row.id, serializeVector(vec))
      done++
    } else {
      failed++
      console.error(`\n[backfill] ${label}: FAILED id=${row.id} — cooling down ${COOLDOWN_MS / 1000}s...`)
      await sleep(COOLDOWN_MS)  // long pause after retries exhausted
    }
    process.stdout.write(`\r[backfill] ${label}: ${done}/${missing.length} embedded, ${failed} failed`)
    await sleep(DELAY_MS)
  }
  console.log(`\n[backfill] ${label}: done ✓ (${done} embedded, ${failed} failed)`)
}

console.log(`[backfill] Starting for userId: ${userId}`)
await sendTelegram('🕵️ <i>Тени отправились в разведку... Обновляю слои памяти о тебе.</i>')

await backfillTable('memories', storage.getAllMemories(userId), 'summary', 'memories')
await backfillTable('nights',   storage.getAllNights(userId),   'summary', 'intimate_log')
await backfillTable('facts',    storage.getAllFacts(userId),    'fact',    'known_facts')

console.log('[backfill] All done ✓')
await sendTelegram('✅ <i>Разведка завершена. Слои памяти обновлены — всё сохранено в вечности.</i>')
process.exit(0)
