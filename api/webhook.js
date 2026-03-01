// Telegram Bot webhook handler
// Runs on Vercel Edge Runtime
// Redis (Upstash) stores conversation history per user — no SDK needed, using REST API directly

import { MINTHARA_SYSTEM_PROMPT, ROMANCE_MODE_ADDENDUM, GUIDE_CONTEXT_PREFIX } from '../src/ai/systemPrompt.js'
import { routeQuery } from '../src/ai/modelRouter.js'
import { getKnowledgeContext } from '../src/ai/knowledgeBase.js'

export const config = { runtime: 'edge' }

const MAX_HISTORY = 16   // messages kept per user
const SESSION_TTL = 60 * 60 * 24 * 7  // 7 days in seconds

// ─── Redis helpers (Upstash REST, no SDK) ───────────────────────────────────

// Vercel KV (Upstash Redis) — использует KV_REST_API_URL и KV_REST_API_TOKEN
function redisConfig() {
  return {
    url: process.env.KV_REST_API_URL,
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

async function redisSet(key, value) {
  const { url, token } = redisConfig()
  if (!url || !token) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['SET', key, JSON.stringify(value), 'EX', SESSION_TTL]),
    })
  } catch { /* non-critical */ }
}

async function redisDel(key) {
  const { url, token } = redisConfig()
  if (!url || !token) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['DEL', key]),
    })
  } catch { /* non-critical */ }
}

// ─── Session helpers ─────────────────────────────────────────────────────────

function sessionKey(userId) { return `minthara:session:${userId}` }

async function getSession(userId) {
  const session = await redisGet(sessionKey(userId))
  return session || { messages: [], romanceMode: false }
}

async function saveSession(userId, session) {
  // Keep first 2 (context anchor) + recent messages
  if (session.messages.length > MAX_HISTORY) {
    const first2 = session.messages.slice(0, 2)
    const recent = session.messages.slice(-(MAX_HISTORY - 2))
    session.messages = [...first2, ...recent]
  }
  await redisSet(sessionKey(userId), session)
}

// ─── Telegram API helper ─────────────────────────────────────────────────────

async function tgSend(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })
}

async function tgSendPlain(token, chatId, text) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

async function tgSendChatAction(token, chatId) {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
}

// ─── Rate limiting (in-memory, resets on cold start — good enough) ───────────

const RATE_LIMIT = new Map()
const MAX_PER_HOUR = 30

function checkRateLimit(userId) {
  const now = Date.now()
  const hourAgo = now - 3_600_000
  const stamps = (RATE_LIMIT.get(userId) || []).filter(t => t > hourAgo)
  if (stamps.length >= MAX_PER_HOUR) return false
  stamps.push(now)
  RATE_LIMIT.set(userId, stamps)
  return true
}

// ─── Romance mode detection ──────────────────────────────────────────────────

const ROMANCE_KEYWORDS = ['люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель',
  'вместе', 'красив', 'флирт', 'приди', 'хочу тебя', 'kiss', 'love', 'hold me', 'beautiful']

function detectRomance(text) {
  const lower = text.toLowerCase()
  return ROMANCE_KEYWORDS.some(kw => lower.includes(kw))
}

// ─── Main handler ────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true, status: 'Minthara webhook active' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const miniAppUrl = process.env.MINI_APP_URL

  if (!botToken || !anthropicKey) {
    return new Response('Missing env vars', { status: 500 })
  }

  let update
  try {
    update = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  // Handle callback queries (inline buttons)
  if (update.callback_query) {
    const cbq = update.callback_query
    const userId = cbq.from.id
    const chatId = cbq.message.chat.id

    // Acknowledge the callback
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: cbq.id }),
    })

    if (cbq.data === 'cb_reset') {
      await redisDel(sessionKey(userId))
      await tgSend(botToken, chatId, '_Чистый лист. Не разочаруй меня снова._')
    }

    if (cbq.data === 'cb_who') {
      await tgSend(botToken, chatId,
        '_Я — Минтара Баэнре. Первый Дом Мензоберранзана. Паладин Мести. ' +
        'Спрашивай о Dark Urge, билдах, снаряжении, романах — или попробуй завоевать моё расположение._'
      )
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // Only handle text messages
  const message = update.message
  if (!message?.text) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const userId = message.from.id
  const chatId = message.chat.id
  const text = message.text.trim()

  // ── Commands ──────────────────────────────────────────────────────────────

  if (text === '/start') {
    const kb = miniAppUrl
      ? {
          inline_keyboard: [
            [{ text: '📖 Открыть гайд', web_app: { url: miniAppUrl } }],
            [{ text: '🗡️ Кто ты?', callback_data: 'cb_who' }, { text: '🔄 Сброс памяти', callback_data: 'cb_reset' }],
          ],
        }
      : { inline_keyboard: [[{ text: '🗡️ Кто ты?', callback_data: 'cb_who' }, { text: '🔄 Сброс', callback_data: 'cb_reset' }]] }

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🗡️ *Минтара Баэнре*\n\n_Ты осмелился потревожить дочь дома Баэнре? Хорошо. Если пришёл за знаниями о пути Тёмного Порыва — говори. Если за пустой болтовнёй — я найду тебе применение получше._\n\n💬 Пиши мне — я отвечу',
        parse_mode: 'Markdown',
        reply_markup: kb,
      }),
    })
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  if (text === '/reset' || text === '/забыть') {
    await redisDel(sessionKey(userId))
    await tgSend(botToken, chatId, '_Хм. Начинаем заново? Я помню всё — но позволю тебе притвориться._')
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  if (text === '/guide' && miniAppUrl) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '_Читай и учись, смертный._',
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📖 Открыть гайд', web_app: { url: miniAppUrl } }]] },
      }),
    })
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Rate limit ────────────────────────────────────────────────────────────

  if (!checkRateLimit(userId)) {
    await tgSend(botToken, chatId, '_...ты утомляешь меня. Вернись через час, смертный._')
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── AI response ───────────────────────────────────────────────────────────

  await tgSendChatAction(botToken, chatId)

  const session = await getSession(userId)

  // Detect romance mode
  if (detectRomance(text)) session.romanceMode = true

  // Build system prompt
  const route = routeQuery(text)
  let systemPrompt = MINTHARA_SYSTEM_PROMPT
  if (session.romanceMode) systemPrompt += ROMANCE_MODE_ADDENDUM
  if (route.knowledgeKeys.length > 0) {
    systemPrompt += GUIDE_CONTEXT_PREFIX
    systemPrompt += getKnowledgeContext(route.knowledgeKeys)
  }

  // Append new user message to history
  session.messages.push({ role: 'user', content: text })
  const apiMessages = session.messages.map(m => ({ role: m.role, content: m.content }))

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: route.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    if (!aiRes.ok) {
      throw new Error(`Anthropic ${aiRes.status}`)
    }

    const aiData = await aiRes.json()
    const reply = aiData.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''

    // Save assistant reply to session
    session.messages.push({ role: 'assistant', content: reply })
    await saveSession(userId, session)

    // Try Markdown, fallback plain
    try {
      await tgSend(botToken, chatId, reply)
    } catch {
      await tgSendPlain(botToken, chatId, reply)
    }
  } catch (err) {
    console.error('Minthara AI error:', err)
    const fallbacks = [
      '_...тишина. Даже я замолкаю, когда Теневое Проклятье сгущается. Попробуй снова._',
      '_Магия Абсолюта... помехи. Повтори, смертный._',
      '_Хм. Что-то нарушило мою связь с тобой. Говори снова._',
    ]
    const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    await tgSend(botToken, chatId, fallback)
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
