// Backfill embeddings for existing SQLite records
// Run ONCE on VPS after deploying RAG:
//   node --env-file=/var/www/minthara/.env /var/www/minthara/src/db/backfill.js

import * as storage from './sqlite.js'
import { getEmbedding, serializeVector } from '../ai/embeddings.js'

const VOYAGE_KEY = process.env.VOYAGE_API_KEY
const DELAY_MS   = 50  // pause between API calls to avoid rate limits

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function backfillTable(label, rows, textKey, table) {
  const missing = rows.filter(r => !r.embedding)
  console.log(`[backfill] ${label}: ${rows.length} total, ${missing.length} need embedding`)

  let done = 0
  for (const row of missing) {
    const text = row[textKey]
    if (!text?.trim()) continue

    const vec = await getEmbedding(text, VOYAGE_KEY)
    if (vec) {
      storage.updateEmbedding(table, row.id, serializeVector(vec))
      done++
      process.stdout.write(`\r[backfill] ${label}: ${done}/${missing.length}`)
    }
    await sleep(DELAY_MS)
  }
  console.log(`\n[backfill] ${label}: done (${done} embedded)`)
}

console.log(`[backfill] Starting for userId: ${userId}`)

await backfillTable('memories',     storage.getAllMemories(userId), 'summary', 'memories')
await backfillTable('nights',       storage.getAllNights(userId),   'summary', 'intimate_log')
await backfillTable('facts',        storage.getAllFacts(userId),    'fact',    'known_facts')

console.log('[backfill] All done ✓')
process.exit(0)
