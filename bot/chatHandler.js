// Mini App chat handler — VPS version
// Uses SQLite (same DB as Telegram bot) → unified memory
// Called from server.js as Express route: POST /api/chat

import {
  MINTHARA_SYSTEM_PROMPT,
  ROMANCE_MODE_ADDENDUM,
  INTIMATE_MODE_ADDENDUM,
  GUIDE_CONTEXT_PREFIX,
  buildProfileContext,
  MOOD_ADDENDUMS,
  SPANK_PHRASES,
  SPANK_GROUP_SUFFIX,
  IMAGE_PERCEPTION_ADDENDUM,
} from '../src/ai/systemPrompt.js'
import { routeQuery }          from '../src/ai/modelRouter.js'
import { getKnowledgeContext } from '../src/ai/knowledgeBase.js'
import { callAI }              from '../src/ai/callAI.js'
import { extractAndEvaluate }  from '../src/ai/profileExtractor.js'
import * as storage            from '../src/db/sqlite.js'

// ─── Profile helpers (SQLite) ─────────────────────────────────────────────────

function normalizeProfile(row) {
  if (!row) return {}
  return {
    name:          row.name           || null,
    act:           row.act            || 1,
    mood:          row.mood           || 'neutral',
    moodScore:     row.mood_score     || 0,
    intimateCount: row.intimate_count || 0,
    totalMessages: row.total_messages || 0,
    romanceMode:   Boolean(row.romance_mode),
    intimateMode:  Boolean(row.intimate_mode),
    firstSeen:     row.first_seen     || null,
    lastSeen:      row.last_seen      || null,
  }
}

// ─── Spank detection ──────────────────────────────────────────────────────────

const SPANK_KW = ['шлепн', 'хлопн', 'по попе', 'по ягодиц', 'по заднице', 'spank', 'slap']
function detectSpank(text) {
  const l = text.toLowerCase()
  return SPANK_KW.some(kw => l.includes(kw))
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function chatHandler(req, res) {
  // CORS — allow Mini App (Vercel domain) to call VPS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const apiKey = process.env.XAI_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing XAI_API_KEY' })
  }

  const { messages, romanceMode, intimateMode, userId, imageBase64, imageMediaType } = req.body || {}
  const hasImage = Boolean(imageBase64)

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  // ── Load profile from SQLite ──────────────────────────────────────────────

  const profileRow = userId ? storage.getProfile(userId) : null
  const profile    = normalizeProfile(profileRow)

  // Apply cold mood if inactive 3+ days
  if (profile.lastSeen) {
    const diffDays = Math.floor((Date.now() - new Date(profile.lastSeen).getTime()) / 86400000)
    if (diffDays >= 3 && (!profile.mood || profile.mood === 'neutral' || profile.mood === 'warm')) {
      profile.mood = 'cold'
    }
  }

  const mood = profile.mood || 'neutral'

  // ── Detect modes ──────────────────────────────────────────────────────────

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const lastContent = lastUserMsg?.content || ''
  const spankMode   = detectSpank(lastContent)

  // ── Load memories from SQLite ─────────────────────────────────────────────

  const dbMemories = userId ? storage.getMemories(userId, 10)       : []
  const dbNights   = userId ? storage.getIntimateNights(userId, 5)  : []
  const dbFacts    = userId ? storage.getFacts(userId, 8)           : []
  const dbData     = { memories: dbMemories, nights: dbNights, facts: dbFacts }

  // ── Build system prompt ───────────────────────────────────────────────────

  const route = lastUserMsg
    ? routeQuery(lastContent)
    : { model: 'grok-3-fast', queryType: 'roleplay', knowledgeKeys: [] }
  if (hasImage) route.model = 'grok-2-vision-1212'

  let systemPrompt = MINTHARA_SYSTEM_PROMPT
  systemPrompt += buildProfileContext(profile, dbData)
  systemPrompt += MOOD_ADDENDUMS[mood] || ''

  if (spankMode || intimateMode) {
    systemPrompt += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM
    if (spankMode) systemPrompt += SPANK_PHRASES[Math.floor(Math.random() * SPANK_PHRASES.length)] + SPANK_GROUP_SUFFIX
  } else if (romanceMode || mood === 'in_heat') {
    systemPrompt += ROMANCE_MODE_ADDENDUM
  }

  if (hasImage) systemPrompt += IMAGE_PERCEPTION_ADDENDUM

  if (route.knowledgeKeys.length > 0) {
    systemPrompt += GUIDE_CONTEXT_PREFIX
    systemPrompt += getKnowledgeContext(route.knowledgeKeys)
  }

  // ── Build API messages ────────────────────────────────────────────────────

  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

  // Inject image into last user message (OpenAI vision format)
  if (hasImage && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1]
    last.content = [
      { type: 'image_url', image_url: { url: `data:${imageMediaType || 'image/jpeg'};base64,${imageBase64}` } },
      { type: 'text',      text: last.content || 'Что ты видишь?' },
    ]
  }

  // ── Call AI ───────────────────────────────────────────────────────────────

  try {
    const { text, usedSearch, searchQuery } = await callAI(apiKey, route.model, systemPrompt, apiMessages)

    // ── Profile extraction (fire-and-forget) ─────────────────────────────────

    if (userId && lastContent && text) {
      const syntheticProfile = {
        ...profile,
        keyMemories: dbMemories.map(m => ({ type: m.memory_type, summary: m.summary, date: m.created_at?.slice(0, 10) })),
        intimateLog: dbNights.map(n => ({ ordinal: n.ordinal, summary: n.summary, date: n.happened_at?.slice(0, 10) })),
        knownFacts:  dbFacts,
      }

      extractAndEvaluate(apiKey, lastContent, text, syntheticProfile)
        .then(updated => {
          if (!updated || !userId) return
          storage.saveProfile(userId, updated)

          // Save new memories/nights/facts (delta only)
          const existingMemories = new Set(dbMemories.map(m => m.summary))
          const existingNights   = new Set(dbNights.map(n => n.summary))
          const existingFacts    = new Set(dbFacts)
          const now = new Date().toISOString()

          for (const m of (updated.keyMemories || [])) {
            if (m?.summary && !existingMemories.has(m.summary)) {
              storage.addMemory(userId, m.type || 'milestone', m.summary, now)
            }
          }
          for (const n of (updated.intimateLog || [])) {
            if (n?.summary && !existingNights.has(n.summary)) {
              storage.addIntimateNight(userId, n.ordinal, n.summary, now)
            }
          }
          for (const f of (updated.knownFacts || [])) {
            if (typeof f === 'string' && f.trim() && !existingFacts.has(f)) {
              storage.addFact(userId, f)
            }
          }
        })
        .catch(() => {})
    }

    return res.json({
      text,
      model:         route.model,
      queryType:     route.queryType,
      usedSearch,
      searchQuery,
      mood:          profile.mood          || 'neutral',
      moodScore:     profile.moodScore     || 0,
      totalMessages: profile.totalMessages || 0,
    })
  } catch (err) {
    console.error('[chatHandler] error:', err.message)
    return res.status(500).json({ error: err.message || 'AI call failed' })
  }
}
