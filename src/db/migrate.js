// One-time migration: Redis (Upstash) → SQLite
// Run on VPS: node --env-file=/var/www/minthara/.env src/db/migrate.js
//
// What it does:
//   1. Reads minthara:profile:{userId} from Redis
//   2. Inserts profile, keyMemories[], intimateLog[], knownFacts[] into SQLite
//   3. Reads minthara:session:{userId} from Redis
//   4. Inserts all messages into SQLite
//
// Redis data is NOT deleted — it stays in Upstash until TTL expires.
// After migration, bot/webhook.js reads from SQLite only.

import * as storage from './sqlite.js'

const KV_URL   = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const USER_ID  = process.env.TELEGRAM_CHAT_ID

// ── Validate env ─────────────────────────────────────────────────────────────

if (!KV_URL || !KV_TOKEN) {
  console.error('❌ Missing env vars: KV_REST_API_URL and/or KV_REST_API_TOKEN')
  process.exit(1)
}
if (!USER_ID) {
  console.error('❌ Missing env var: TELEGRAM_CHAT_ID')
  process.exit(1)
}

// ── Redis helper ─────────────────────────────────────────────────────────────

async function redisGet(key) {
  try {
    const res = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    })
    const { result } = await res.json()
    return result ? JSON.parse(result) : null
  } catch (e) {
    console.error(`  Redis GET error (${key}):`, e.message)
    return null
  }
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate() {
  console.log(`\n🗡️  Minthara SQLite migration`)
  console.log(`   userId: ${USER_ID}`)
  console.log(`   DB: ${process.env.DB_PATH || 'data/minthara.db'}\n`)

  // ── Profile ─────────────────────────────────────────────────────────────────

  console.log('📥 Reading profile from Redis...')
  const profile = await redisGet(`minthara:profile:${USER_ID}`)

  if (profile && Object.keys(profile).length > 0) {
    console.log(`  → name: ${profile.name || '—'}`)
    console.log(`  → act: ${profile.act || 1}, mood: ${profile.mood || 'neutral'}`)
    console.log(`  → intimateCount: ${profile.intimateCount || 0}`)
    console.log(`  → totalMessages: ${profile.totalMessages || 0}`)

    // Save base profile (without arrays)
    storage.saveProfile(USER_ID, {
      name:          profile.name          || null,
      act:           profile.act           || 1,
      mood:          profile.mood          || 'neutral',
      moodScore:     profile.moodScore     || 0,
      intimateCount: profile.intimateCount || 0,
      totalMessages: profile.totalMessages || 0,
      romanceMode:   false,
      intimateMode:  false,
      firstSeen:     profile.firstSeen     || null,
      lastSeen:      profile.lastSeen      || null,
    })

    // keyMemories[]
    const memories = Array.isArray(profile.keyMemories) ? profile.keyMemories : []
    console.log(`  → keyMemories: ${memories.length}`)
    for (const m of memories) {
      if (m?.summary) {
        storage.addMemory(USER_ID, m.type || null, m.summary, m.date || null)
      }
    }

    // intimateLog[]
    const nights = Array.isArray(profile.intimateLog) ? profile.intimateLog : []
    console.log(`  → intimateLog: ${nights.length}`)
    for (const n of nights) {
      if (n?.summary) {
        storage.addIntimateNight(USER_ID, n.ordinal ?? null, n.summary, n.date || n.happened_at || null)
      }
    }

    // knownFacts[]
    const facts = Array.isArray(profile.knownFacts) ? profile.knownFacts : []
    console.log(`  → knownFacts: ${facts.length}`)
    for (const f of facts) {
      if (typeof f === 'string' && f.trim()) {
        storage.addFact(USER_ID, f.trim())
      }
    }

    console.log('  ✅ Profile migrated\n')
  } else {
    console.log('  ⚠️  No profile found in Redis — skipping\n')
  }

  // ── Session (messages) ───────────────────────────────────────────────────────

  console.log('📥 Reading session from Redis...')
  const session = await redisGet(`minthara:session:${USER_ID}`)

  if (session?.messages?.length > 0) {
    const msgs = session.messages
    console.log(`  → messages: ${msgs.length}`)
    for (const msg of msgs) {
      const content = typeof msg.content === 'string' ? msg.content : '[complex content]'
      storage.saveMessage(USER_ID, msg.role, content)
    }
    console.log('  ✅ Session migrated\n')
  } else {
    console.log('  ⚠️  No session messages found in Redis — skipping\n')
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  const dbMemories = storage.getMemories(USER_ID, 1000)
  const dbNights   = storage.getIntimateNights(USER_ID, 1000)
  const dbFacts    = storage.getFacts(USER_ID, 1000)
  const dbMsgs     = storage.getRecentMessages(USER_ID, 1000)
  const dbProfile  = storage.getProfile(USER_ID)

  console.log('📊 SQLite summary:')
  console.log(`  messages:    ${dbMsgs.length}`)
  console.log(`  memories:    ${dbMemories.length}`)
  console.log(`  nights:      ${dbNights.length}`)
  console.log(`  facts:       ${dbFacts.length}`)
  console.log(`  profile:     ${dbProfile ? 'OK' : 'empty'}`)
  console.log('\n🏁 Migration complete. Run: pm2 restart minthara\n')

  process.exit(0)
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
