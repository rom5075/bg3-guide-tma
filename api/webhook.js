// Telegram Bot webhook handler
// Runs on Vercel Edge Runtime
// Redis (Upstash/Vercel KV) stores conversation history + user profile per user

import {
  MINTHARA_SYSTEM_PROMPT,
  ROMANCE_MODE_ADDENDUM,
  INTIMATE_MODE_ADDENDUM,
  GUIDE_CONTEXT_PREFIX,
  buildProfileContext,
  MOOD_ADDENDUMS,
  SPANK_ADDENDUM,
} from '../src/ai/systemPrompt.js'
import { routeQuery }          from '../src/ai/modelRouter.js'
import { getKnowledgeContext } from '../src/ai/knowledgeBase.js'
import { callAI }              from '../src/ai/callAI.js'
import { extractAndEvaluate }  from '../src/ai/profileExtractor.js'

export const config = { runtime: 'edge' }

const MAX_HISTORY = 16
const SESSION_TTL = 60 * 60 * 24 * 7    // 7 days
const PROFILE_TTL = 60 * 60 * 24 * 365  // 1 year

// ─── Redis helpers (Upstash REST, no SDK) ────────────────────────────────────

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

async function redisSet(key, value, ttl = SESSION_TTL) {
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

async function redisDel(key) {
  const { url, token } = redisConfig()
  if (!url || !token) return
  try {
    await fetch(url, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(['DEL', key]),
    })
  } catch { /* non-critical */ }
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function sessionKey(userId) { return `minthara:session:${userId}` }
function profileKey(userId) { return `minthara:profile:${userId}` }

async function getSession(userId) {
  const s = await redisGet(sessionKey(userId))
  return s || { messages: [], romanceMode: false, intimateMode: false }
}

async function saveSession(userId, session) {
  if (session.messages.length > MAX_HISTORY) {
    const first2 = session.messages.slice(0, 2)
    const recent = session.messages.slice(-(MAX_HISTORY - 2))
    session.messages = [...first2, ...recent]
  }
  await redisSet(sessionKey(userId), session, SESSION_TTL)
}

async function getProfile(userId) {
  return (await redisGet(profileKey(userId))) || {}
}

async function saveProfile(userId, profile) {
  await redisSet(profileKey(userId), profile, PROFILE_TTL)
}

// ─── Telegram API helpers ─────────────────────────────────────────────────────

async function tgSend(token, chatId, text, replyMarkup = null) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'Markdown',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })
}

async function tgSendPlain(token, chatId, text, replyMarkup = null) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id: chatId,
      text,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    }),
  })
}

async function tgSendChatAction(token, chatId) {
  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: chatId, action: 'typing' }),
  })
}

// ─── Persistent keyboard ──────────────────────────────────────────────────────

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '⚔️ Билды' },       { text: '🗡️ Снаряжение' }],
    [{ text: '❤️ Роман' },       { text: '📍 Карта актов' }],
    [{ text: '🔄 Сброс' },       { text: '📖 Гайд' }],
  ],
  resize_keyboard: true,
  persistent:      true,
}

// Keyboard button text → natural-language query passed to AI
const KEYBOARD_QUERIES = {
  '⚔️ Билды':       'Расскажи о билдах нашего отряда',
  '🗡️ Снаряжение':  'Какое ключевое снаряжение использует наш отряд?',
  '❤️ Роман':       'Расскажи о нашем романе и отношениях',
  '📍 Карта актов': 'Какие ключевые локации нам важны?',
}

// ─── Rate limiting (in-memory, resets on cold start) ─────────────────────────

const RATE_LIMIT   = new Map()
const MAX_PER_HOUR = 30

function checkRateLimit(userId) {
  const now     = Date.now()
  const hourAgo = now - 3_600_000
  const stamps  = (RATE_LIMIT.get(userId) || []).filter(t => t > hourAgo)
  if (stamps.length >= MAX_PER_HOUR) return false
  stamps.push(now)
  RATE_LIMIT.set(userId, stamps)
  return true
}

// ─── Keyword detection ────────────────────────────────────────────────────────

const ROMANCE_KW = [
  'люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель',
  'вместе', 'красив', 'флирт', 'приди', 'хочу тебя',
  'kiss', 'love', 'hold me', 'beautiful',
]
const INTIMATE_KW = [
  'займёмся', 'займемся', 'переспи', 'переспать', 'в постель', 'в кровать',
  'ляжем', 'ляг со мной', 'хочу тебя', 'трахн', 'секс', 'интим',
  'раздень', 'разденься', 'обнажи', 'возьми меня', 'будь моей', 'будь моим',
  'плотские', 'утех', 'desire', 'fuck', 'bed with me', 'make love',
  'sleep with', 'take me', 'undress',
]
const SPANK_KW = [
  'шлепн', 'хлопн', 'по попе', 'по ягодиц', 'по заднице',
  'spank', 'slap your', 'slap on',
]

function detectRomance(t)  { const l = t.toLowerCase(); return ROMANCE_KW .some(kw => l.includes(kw)) }
function detectIntimate(t) { const l = t.toLowerCase(); return INTIMATE_KW.some(kw => l.includes(kw)) }
function detectSpank(t)    { const l = t.toLowerCase(); return SPANK_KW   .some(kw => l.includes(kw)) }

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(profile, session, spankMode) {
  const mood = profile?.mood || 'neutral'

  let sp = MINTHARA_SYSTEM_PROMPT
  sp += buildProfileContext(profile)
  sp += MOOD_ADDENDUMS[mood] || ''

  if (spankMode) {
    sp += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM + SPANK_ADDENDUM
  } else if (session.intimateMode) {
    sp += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM
  } else if (session.romanceMode || mood === 'in_heat') {
    sp += ROMANCE_MODE_ADDENDUM
  }

  return sp
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true, status: 'Minthara webhook active' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const botToken     = process.env.TELEGRAM_BOT_TOKEN
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const miniAppUrl   = process.env.MINI_APP_URL

  if (!botToken || !anthropicKey) {
    return new Response('Missing env vars', { status: 500 })
  }

  let update
  try { update = await req.json() }
  catch { return new Response('Bad JSON', { status: 400 }) }

  // ── Callback queries (inline buttons) ───────────────────────────────────────

  if (update.callback_query) {
    const cbq    = update.callback_query
    const userId = cbq.from.id
    const chatId = cbq.message.chat.id

    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ callback_query_id: cbq.id }),
    })

    if (cbq.data === 'cb_reset') {
      await redisDel(sessionKey(userId))
      await tgSend(botToken, chatId, '_Чистый лист. Не разочаруй меня снова._', MAIN_KEYBOARD)
    }

    if (cbq.data === 'cb_who') {
      await tgSend(botToken, chatId,
        '_Я — Минтара Баэнре. Первый Дом Мензоберранзана. Паладин Мести. ' +
        'Спрашивай о Dark Urge, билдах, снаряжении, романах — или попробуй завоевать моё расположение._',
        MAIN_KEYBOARD
      )
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Only handle text messages ────────────────────────────────────────────────

  const message = update.message
  if (!message?.text) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const userId = message.from.id
  const chatId = message.chat.id
  let   text   = message.text.trim()

  // ── /start ───────────────────────────────────────────────────────────────────

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
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:      chatId,
        text:         '🗡️ *Минтара Баэнре*\n\n_Ты осмелился потревожить дочь дома Баэнре? Хорошо. Если пришёл за знаниями о пути Тёмного Порыва — говори. Если за пустой болтовнёй — я найду тебе применение получше._\n\n💬 Пиши мне — я отвечу',
        parse_mode:   'Markdown',
        reply_markup: kb,
      }),
    })
    // Send keyboard separately so it attaches as persistent
    await tgSend(botToken, chatId, '_Используй кнопки ниже или пиши напрямую._', MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── /reset ───────────────────────────────────────────────────────────────────

  if (text === '/reset' || text === '/забыть' || text === '🔄 Сброс') {
    await redisDel(sessionKey(userId))
    await tgSend(botToken, chatId, '_Хм. Начинаем заново? Я помню всё — но позволю тебе притвориться._', MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── /guide ───────────────────────────────────────────────────────────────────

  if ((text === '/guide' || text === '📖 Гайд') && miniAppUrl) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:      chatId,
        text:         '_Читай и учись, смертный._',
        parse_mode:   'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '📖 Открыть гайд', web_app: { url: miniAppUrl } }]] },
      }),
    })
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Translate keyboard buttons → natural-language queries ────────────────────

  if (KEYBOARD_QUERIES[text]) text = KEYBOARD_QUERIES[text]

  // ── Rate limit ───────────────────────────────────────────────────────────────

  if (!checkRateLimit(userId)) {
    await tgSend(botToken, chatId, '_...ты утомляешь меня. Вернись через час, смертный._', MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── Load session + profile in parallel ───────────────────────────────────────

  await tgSendChatAction(botToken, chatId)

  const [session, profile] = await Promise.all([
    getSession(userId),
    getProfile(userId),
  ])

  // Apply cold mood if user was inactive 3+ days
  if (profile.lastSeen) {
    const diffDays = Math.floor((Date.now() - new Date(profile.lastSeen).getTime()) / 86400000)
    if (diffDays >= 3 && (!profile.mood || profile.mood === 'neutral' || profile.mood === 'warm')) {
      profile.mood = 'cold'
    }
  }

  // ── Detect modes ─────────────────────────────────────────────────────────────

  if (detectRomance(text))  session.romanceMode  = true
  if (detectIntimate(text)) session.intimateMode = true
  const spankMode = detectSpank(text)
  if (spankMode)            session.intimateMode = true

  // ── Build system prompt ───────────────────────────────────────────────────────

  const route = routeQuery(text)
  let systemPrompt = buildSystemPrompt(profile, session, spankMode)
  if (route.knowledgeKeys.length > 0) {
    systemPrompt += GUIDE_CONTEXT_PREFIX
    systemPrompt += getKnowledgeContext(route.knowledgeKeys)
  }

  // ── Call AI ───────────────────────────────────────────────────────────────────

  session.messages.push({ role: 'user', content: text })
  const apiMessages = session.messages.map(m => ({ role: m.role, content: m.content }))

  try {
    const { text: reply, usedSearch } = await callAI(anthropicKey, route.model, systemPrompt, apiMessages)

    session.messages.push({ role: 'assistant', content: reply })
    await saveSession(userId, session)

    const finalReply = usedSearch
      ? reply + '\n\n_🕵️ Тени нашептали свежие сведения..._'
      : reply

    // ── Send response ────────────────────────────────────────────────────────────
    try {
      await tgSend(botToken, chatId, finalReply, MAIN_KEYBOARD)
    } catch {
      await tgSendPlain(botToken, chatId, reply, MAIN_KEYBOARD)
    }

    // ── Profile extraction + save (synchronous, runs after user sees message) ───
    const updatedProfile = await extractAndEvaluate(anthropicKey, text, reply, profile)
    if (updatedProfile) await saveProfile(userId, updatedProfile)

  } catch (err) {
    console.error('Minthara AI error:', err)
    const fallbacks = [
      '_...тишина. Даже я замолкаю, когда Теневое Проклятье сгущается. Попробуй снова._',
      '_Магия Абсолюта... помехи. Повтори, смертный._',
      '_Хм. Что-то нарушило мою связь с тобой. Говори снова._',
    ]
    await tgSend(botToken, chatId, fallbacks[Math.floor(Math.random() * fallbacks.length)], MAIN_KEYBOARD)
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
