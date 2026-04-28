// Mini App → Anthropic proxy
// Runs on Vercel Edge Runtime — ANTHROPIC_API_KEY stays server-side

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

export const config = { runtime: 'edge' }

const PROFILE_TTL = 60 * 60 * 24 * 365  // 1 year

// ─── Redis helpers ────────────────────────────────────────────────────────────

function redisConfig() {
  return {
    url:   process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  }
}

async function redisGet(key) {
  const { url, token } = redisConfig()
  if (!url || !token) return null
  try {
    const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const { result } = await res.json()
    return result ? JSON.parse(result) : null
  } catch { return null }
}

async function redisSet(key, value, ttl) {
  const { url, token } = redisConfig()
  if (!url || !token) return
  try {
    await fetch(url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(['SET', key, JSON.stringify(value), 'EX', ttl]),
    })
  } catch { /* non-critical */ }
}

function profileKey(userId) { return `minthara:profile:${userId}` }

async function getProfile(userId) {
  if (!userId) return {}
  return (await redisGet(profileKey(userId))) || {}
}

async function saveProfile(userId, profile) {
  if (!userId) return
  await redisSet(profileKey(userId), profile, PROFILE_TTL)
}

// ─── Spank detection ──────────────────────────────────────────────────────────

const SPANK_KW = [
  'шлепн', 'хлопн', 'по попе', 'по ягодиц', 'по заднице',
  'spank', 'slap your', 'slap on',
]
function detectSpank(text) {
  const l = text.toLowerCase()
  return SPANK_KW.some(kw => l.includes(kw))
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.XAI_API_KEY || process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing XAI_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try { body = await req.json() }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { messages, romanceMode, intimateMode, userId, imageBase64, imageMediaType } = body
  const hasImage = Boolean(imageBase64)

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── Load profile ──────────────────────────────────────────────────────────────

  const profile = await getProfile(userId)

  // Apply cold mood if user was inactive 3+ days
  if (profile.lastSeen) {
    const diffDays = Math.floor((Date.now() - new Date(profile.lastSeen).getTime()) / 86400000)
    if (diffDays >= 3 && (!profile.mood || profile.mood === 'neutral' || profile.mood === 'warm')) {
      profile.mood = 'cold'
    }
  }

  const mood = profile.mood || 'neutral'

  // ── Detect spank from last user message ──────────────────────────────────────

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const lastContent = lastUserMsg?.content || ''
  const spankMode   = detectSpank(lastContent)

  // ── Routing ───────────────────────────────────────────────────────────────────

  const route = lastUserMsg
    ? routeQuery(lastContent)
    : { model: 'grok-3-fast', queryType: 'roleplay', knowledgeKeys: [] }

  // ── Build system prompt ───────────────────────────────────────────────────────

  let systemPrompt = MINTHARA_SYSTEM_PROMPT
  systemPrompt += buildProfileContext(profile)
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

  // ── Strip extra fields — Anthropic only needs role + content ─────────────────

  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

  // ── Inject image into last user message if present ────────────────────────────

  if (hasImage && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1]
    // xAI / OpenAI vision format
    last.content = [
      { type: 'image_url', image_url: { url: `data:${imageMediaType || 'image/jpeg'};base64,${imageBase64}` } },
      { type: 'text',      text: last.content || 'Что ты видишь?' },
    ]
  }

  try {
    const { text, usedSearch, searchQuery } = await callAI(apiKey, route.model, systemPrompt, apiMessages)

    // ── Profile extraction (fire-and-forget, best-effort) ─────────────────────

    const lastAssistant = text
    if (userId && lastContent && lastAssistant) {
      extractAndEvaluate(apiKey, lastContent, lastAssistant, profile)
        .then(updated => { if (updated) saveProfile(userId, updated) })
        .catch(() => {})
    }

    return new Response(
      JSON.stringify({
        text, model: route.model, queryType: route.queryType, usedSearch, searchQuery,
        mood:          profile.mood          || 'neutral',
        moodScore:     profile.moodScore     || 0,
        totalMessages: profile.totalMessages || 0,
      }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Fetch failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
