// Telegram Bot webhook handler — VPS / SQLite version
// Runs on Node.js + Express (NOT Vercel Edge Runtime)
// SQLite stores all messages + profile permanently (no TTL, no limits)

import {
  MINTHARA_SYSTEM_PROMPT,
  ROMANCE_MODE_ADDENDUM,
  INTIMATE_MODE_ADDENDUM,
  GUIDE_CONTEXT_PREFIX,
  buildProfileContext,
  MOOD_ADDENDUMS,
  SPANK_PHRASES,
  SPANK_GROUP_SUFFIX,
  TRIAL_ADDENDUM,
  IMAGE_PERCEPTION_ADDENDUM,
} from '../src/ai/systemPrompt.js'
import { routeQuery }          from '../src/ai/modelRouter.js'
import { getKnowledgeContext } from '../src/ai/knowledgeBase.js'
import { extractAndEvaluate }                          from '../src/ai/profileExtractor.js'
import { getEmbedding, findMostRelevant, serializeVector } from '../src/ai/embeddings.js'
import * as storage                                    from '../src/db/sqlite.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

const MOOD_DISPLAY = {
  neutral:    { emoji: '🩶', label: 'Нейтральна' },
  warm:       { emoji: '💛', label: 'Тепло'      },
  cold:       { emoji: '🩵', label: 'Холодна'    },
  irritated:  { emoji: '❤️‍🔥', label: 'Раздражена' },
  possessive: { emoji: '💜', label: 'Властна'    },
  in_heat:    { emoji: '🔥', label: 'Желает'     },
}

// ─── Profile normalizer (SQLite row → app object) ─────────────────────────────

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

// ─── Markdown → HTML converter ────────────────────────────────────────────────
// Telegram HTML mode is far more reliable than Markdown v1 (no emoji/Cyrillic edge cases)

function mdToHtml(text) {
  return text
    // 1. HTML-escape raw chars first (protect against broken tags in final output)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 2. Fenced code blocks ```...```
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, c) => `<pre>${c.trim()}</pre>`)
    // 3. Inline code `code`
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // 4. Bold **text**
    .replace(/\*\*(.+?)\*\*/gs, '<b>$1</b>')
    // 5. Bold/italic *text* — treat single * as bold (Minthara style)
    .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
    // 6. Italic _text_
    .replace(/_([^_\n]+)_/g, '<i>$1</i>')
}

// ─── Telegram API helpers ─────────────────────────────────────────────────────

async function tgSend(token, chatId, text, replyMarkup = null) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      chat_id:    chatId,
      text:       mdToHtml(text),
      parse_mode: 'HTML',
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

// Returns Telegram message object (contains message_id) for streaming edits
async function tgSendRaw(token, chatId, text) {
  try {
    const res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text }),
    })
    const data = await res.json()
    return data.result ?? null
  } catch { return null }
}

// Edit existing message — plain text, no parse_mode (safe for partial streaming text)
async function tgEdit(token, chatId, msgId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, message_id: msgId, text }),
    })
  } catch { /* ignore throttle / "message not modified" errors */ }
}

// Final edit — with HTML formatting and keyboard; falls back to stripped plain text
async function tgEditMarkdown(token, chatId, msgId, text, replyMarkup = null) {
  const html = mdToHtml(text)
  try {
    const res  = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    chatId,
        message_id: msgId,
        text:       html,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error('[tgEditMarkdown] HTML rejected by Telegram:', data.description)
      console.error('[tgEditMarkdown] HTML snippet (first 300):', html.slice(0, 300))
      throw new Error(data.description)
    }
  } catch (err) {
    console.error('[tgEditMarkdown] fallback triggered:', err.message)
    // Strip markdown symbols so user doesn't see raw * and _
    const plain = text
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*([^*\n]+)\*/g,  '$1')
      .replace(/_([^_\n]+)_/g,    '$1')
    await tgEdit(token, chatId, msgId, plain)
  }
}

// ─── Streaming xAI (Grok) call with Tavily tool use ──────────────────────────

const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: `Search the internet for any information the user requests. Use when:
- User asks about recent events, news, or updates (BG3 patches, real world, anything)
- User explicitly asks to "find", "search", "look up", or "check" something
- The question requires up-to-date information you may not have
- User asks about any topic outside of BG3 that benefits from a web search
Use a clear, specific search query. For BG3 questions include "Baldur's Gate 3" in the query.`,
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query string. Keep it concise and specific.' } },
      required: ['query'],
    },
  },
}

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return 'Поиск недоступен — TAVILY_API_KEY не настроен.'
  try {
    const res  = await fetch('https://api.tavily.com/search', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', max_results: 3, include_answer: true }),
    })
    if (!res.ok) return `Ошибка поиска: ${res.status}`
    const data  = await res.json()
    const parts = []
    if (data.answer) parts.push(`КРАТКИЙ ОТВЕТ: ${data.answer}`)
    if (data.results?.length) {
      parts.push(data.results.map(r => `[${r.title}]\n${(r.content || '').slice(0, 500)}\nИсточник: ${r.url}`).join('\n\n'))
    }
    return parts.join('\n\n') || 'Результатов не найдено.'
  } catch (err) { return `Ошибка поиска: ${err.message}` }
}

/**
 * Stream xAI (Grok) response. Calls onChunk(text) for each streamed text delta.
 * OpenAI-compatible SSE format. Handles tool use (Tavily) with non-streaming 2nd call.
 * @returns {Promise<{ text: string, usedSearch: boolean }>}
 */
async function streamAI({ apiKey, model, systemPrompt, messages }, onChunk) {
  const hasTavily = !!process.env.TAVILY_API_KEY

  // System prompt goes into messages array (OpenAI format)
  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body:    JSON.stringify({
      model,
      max_tokens: 1024,
      messages:   apiMessages,
      stream:     true,
      ...(hasTavily ? { tools: [WEB_SEARCH_TOOL], tool_choice: 'auto' } : {}),
    }),
  })

  if (!res.ok) throw new Error(`xAI HTTP ${res.status}`)

  const reader      = res.body.getReader()
  const decoder     = new TextDecoder()
  let buffer        = ''
  let text          = ''
  let toolCalls     = {}  // index → { id, name, argumentsStr }
  let finishReason  = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw || raw === '[DONE]') continue
      let ev
      try { ev = JSON.parse(raw) } catch { continue }

      const delta = ev.choices?.[0]?.delta
      const fr    = ev.choices?.[0]?.finish_reason
      if (fr) finishReason = fr

      // Text chunk
      if (delta?.content) {
        text += delta.content
        await onChunk(delta.content)
      }

      // Tool call chunks (accumulated by index)
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0
          if (!toolCalls[idx]) toolCalls[idx] = { id: '', name: '', argumentsStr: '' }
          if (tc.id)                  toolCalls[idx].id            = tc.id
          if (tc.function?.name)      toolCalls[idx].name          = tc.function.name
          if (tc.function?.arguments) toolCalls[idx].argumentsStr += tc.function.arguments
        }
      }
    }
  }

  // Tool use: Tavily search → non-streaming second call
  if (finishReason === 'tool_calls') {
    const toolCall = toolCalls[0]
    if (toolCall?.name === 'web_search') {
      await onChunk('\n\n_🕵️ Ищу свежие сведения..._')

      let args = {}
      try { args = JSON.parse(toolCall.argumentsStr) } catch {}
      const searchResult = await tavilySearch(args.query || '')

      const continuedMessages = [
        ...apiMessages,
        {
          role:       'assistant',
          content:    text || null,
          tool_calls: [{ id: toolCall.id, type: 'function', function: { name: toolCall.name, arguments: toolCall.argumentsStr } }],
        },
        { role: 'tool', tool_call_id: toolCall.id, content: searchResult },
      ]

      const res2 = await fetch('https://api.x.ai/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body:    JSON.stringify({ model, max_tokens: 1024, messages: continuedMessages }),
      })
      if (!res2.ok) throw new Error(`xAI 2nd call HTTP ${res2.status}`)
      const data2     = await res2.json()
      const finalText = data2.choices?.[0]?.message?.content || ''
      return { text: finalText, usedSearch: true }
    }
  }

  return { text, usedSearch: false }
}

// ─── Photo download ───────────────────────────────────────────────────────────

async function downloadPhotoAsBase64(fileId, token) {
  const fileRes  = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
  const fileData = await fileRes.json()
  const filePath = fileData?.result?.file_path
  if (!filePath) throw new Error('Cannot get file path from Telegram')

  const photoRes    = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)
  const arrayBuffer = await photoRes.arrayBuffer()

  const bytes  = new Uint8Array(arrayBuffer)
  let   binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

// ─── Persistent keyboard ──────────────────────────────────────────────────────

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '🐉 Мир BG3' },     { text: '🌍 Наш мир' }],
    [{ text: '❤️ Роман' },       { text: '🎲 Держу пари' }],
    [{ text: '🔄 Сброс' },       { text: '👋🍑 Шлепок' }],
  ],
  resize_keyboard: true,
  is_persistent:   true,
}

const KEYBOARD_QUERIES = {
  '🐉 Мир BG3':    'Расскажи о Фаэруне, нашем пути Dark Urge и отряде',
  '🌍 Наш мир':    'Расскажи о нашем мире — что тебя удивляет, как ты его воспринимаешь?',
  '❤️ Роман':      'Расскажи о нашем романе и отношениях',
  '🎲 Держу пари': 'Держу пари — ты не решишься выполнить всё что я скажу',
  '👋🍑 Шлепок':  'Шлепаю тебя по попе',
}

// ─── Rate limiting (in-memory, resets on pm2 restart) ────────────────────────

const RATE_LIMIT   = new Map()
const MAX_PER_HOUR = 100

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
const TRIAL_KW = ['испытание', 'испытани']
const TRIAL_CUSTOMS_KW = [
  'обычай', 'обычаям', 'традиц', 'нашем мире', 'нашего мира',
  'нашим миром', 'учись', 'научись', 'принять наш',
]
const BET_KW = [
  'пари', 'держу пари', 'поспорим', 'слабо тебе', 'слабо?',
  'не решишься', 'не сможешь', 'не справишься', 'докажи что',
  'dare you', 'i bet you', "bet you won't",
]

function detectRomance(t)  { const l = t.toLowerCase(); return ROMANCE_KW .some(kw => l.includes(kw)) }
function detectIntimate(t) { const l = t.toLowerCase(); return INTIMATE_KW.some(kw => l.includes(kw)) }
function detectSpank(t)    { const l = t.toLowerCase(); return SPANK_KW   .some(kw => l.includes(kw)) }
function detectTrial(t)    {
  const l = t.toLowerCase()
  return (TRIAL_KW.some(kw => l.includes(kw)) && TRIAL_CUSTOMS_KW.some(kw => l.includes(kw)))
      || BET_KW.some(kw => l.includes(kw))
}

// ─── System prompt builder ────────────────────────────────────────────────────

/**
 * @param {object} profile   - normalized profile object
 * @param {object} session   - { messages, romanceMode, intimateMode }
 * @param {boolean} spankMode
 * @param {object} dbData    - { memories[], nights[], facts[] } from SQLite
 * @param {boolean} hasPhoto
 * @param {boolean} trialMode
 */
function buildSystemPrompt(profile, session, spankMode, dbData, hasPhoto = false, trialMode = false) {
  const mood = profile?.mood || 'neutral'

  let sp = MINTHARA_SYSTEM_PROMPT
  sp += buildProfileContext(profile, dbData)   // ← VPS path: passes dbData
  sp += MOOD_ADDENDUMS[mood] || ''

  if (spankMode) {
    const phrase = SPANK_PHRASES[Math.floor(Math.random() * SPANK_PHRASES.length)]
    sp += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM + phrase + SPANK_GROUP_SUFFIX
  } else if (trialMode) {
    sp += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM + TRIAL_ADDENDUM
  } else if (session.intimateMode) {
    sp += ROMANCE_MODE_ADDENDUM + INTIMATE_MODE_ADDENDUM
  } else if (session.romanceMode || mood === 'in_heat') {
    sp += ROMANCE_MODE_ADDENDUM
  }

  if (hasPhoto) sp += IMAGE_PERCEPTION_ADDENDUM

  return sp
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: true, status: 'Minthara VPS webhook active' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const botToken     = process.env.TELEGRAM_BOT_TOKEN
  const anthropicKey = process.env.XAI_API_KEY || process.env.ANTHROPIC_API_KEY
  const miniAppUrl   = process.env.MINI_APP_URL
  const adminId      = process.env.ADMIN_ID

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
      // Delete conversation history + reset romance/intimate flags
      // Profile (name, mood, memories, etc.) is preserved
      storage.deleteMessages(userId)
      storage.resetSessionFlags(userId)
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

  // ── Only handle text or photo messages ──────────────────────────────────────

  const message = update.message
  if (!message?.text && !message?.photo) {
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  const userId   = message.from.id
  const chatId   = message.chat.id
  const hasPhoto = Boolean(message.photo?.length)
  let   text     = (message.text || message.caption || '').trim()

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
        text:         '🗡️ <b>Минтара Баэнре</b>\n\n<i>Ты осмелился потревожить дочь дома Баэнре? Хорошо. Если пришёл за знаниями о пути Тёмного Порыва — говори. Если за пустой болтовнёй — я найду тебе применение получше.</i>\n\n💬 Пиши мне — я отвечу',
        parse_mode:   'HTML',
        reply_markup: kb,
      }),
    })
    await tgSend(botToken, chatId, '_Используй кнопки ниже или пиши напрямую._', MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── /reset ───────────────────────────────────────────────────────────────────

  if (text === '/reset' || text === '/забыть' || text === '🔄 Сброс') {
    storage.deleteMessages(userId)
    storage.resetSessionFlags(userId)
    await tgSend(botToken, chatId, '_Хм. Начинаем заново? Я помню всё — но позволю тебе притвориться._', MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── /stats (admin only) ──────────────────────────────────────────────────────

  if (text === '/stats') {
    if (!adminId || String(userId) !== String(adminId)) {
      await tgSend(botToken, chatId, '_Этот приказ не для смертных._', MAIN_KEYBOARD)
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
    }

    const s = storage.getStats()
    const moodLines = s.moods
      .map(m => `  • ${m.mood || 'нет'} — ${m.cnt}`)
      .join('\n')

    const msg = `📊 *Статистика Минтары*

👥 Пользователей: ${s.users}
💬 Сообщений: ${s.messages.toLocaleString('ru')}
🔥 Активных (7 дней): ${s.active7d}
📅 Новых сегодня: ${s.newToday}

🧠 Воспоминаний: ${s.memories}${s.memoriesNoEmb ? ` _(без эмб: ${s.memoriesNoEmb})_` : ''}
🌙 Интимных ночей: ${s.nights}${s.nightsNoEmb ? ` _(без эмб: ${s.nightsNoEmb})_` : ''}
📝 Фактов: ${s.facts}${s.factsNoEmb ? ` _(без эмб: ${s.factsNoEmb})_` : ''}

💌 Романтический режим: ${s.romanceMode}
🔥 Интимный режим: ${s.intimateMode}

😊 *Настроения:*
${moodLines}`

    await tgSend(botToken, chatId, msg, MAIN_KEYBOARD)
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  // ── /guide ───────────────────────────────────────────────────────────────────

  if ((text === '/guide' || text === '📖 Гайд') && miniAppUrl) {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:      chatId,
        text:         '<i>Читай и учись, смертный.</i>',
        parse_mode:   'HTML',
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

  // ── Load from SQLite ──────────────────────────────────────────────────────────

  await tgSendChatAction(botToken, chatId)

  // Profile
  const profileRow = storage.getProfile(userId)
  const profile    = normalizeProfile(profileRow)

  // Session flags from profile
  const session = {
    messages:     storage.getRecentMessages(userId, MAX_HISTORY),
    romanceMode:  profile.romanceMode,
    intimateMode: profile.intimateMode,
  }

  // DB data for prompt — RAG (semantic search) or fallback (last N)
  const voyageKey = process.env.VOYAGE_API_KEY
  let dbMemories, dbNights, dbFacts

  if (voyageKey) {
    // RAG: embed current message, find most relevant records
    // retries=0 — no waiting in live bot handler; fallback to last-N on 429
    const queryVec = await getEmbedding(text, voyageKey, 0)
    const allMem   = storage.getAllMemories(userId)
    const allNight = storage.getAllNights(userId)
    const allFact  = storage.getAllFacts(userId)

    dbMemories = findMostRelevant(queryVec, allMem,   'summary', 10)
    dbNights   = findMostRelevant(queryVec, allNight, 'summary', 5)
    dbFacts    = findMostRelevant(queryVec, allFact,  'fact',    8).map(r => r.fact)
  } else {
    // Fallback: last N records (original behaviour)
    dbMemories = storage.getMemories(userId, 10)
    dbNights   = storage.getIntimateNights(userId, 5)
    dbFacts    = storage.getFacts(userId, 8)
  }

  const dbData = { memories: dbMemories, nights: dbNights, facts: dbFacts }

  // Apply cold mood if inactive 3+ days
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
  const trialMode = detectTrial(text)
  if (spankMode) session.intimateMode = true

  // ── Build system prompt ───────────────────────────────────────────────────────

  const route = routeQuery(text || 'посмотри на изображение')
  // Vision requests require a vision-capable model
  if (hasPhoto) route.model = 'grok-2-vision-1212'
  let systemPrompt = buildSystemPrompt(profile, session, spankMode, dbData, hasPhoto, trialMode)
  if (route.knowledgeKeys.length > 0) {
    systemPrompt += GUIDE_CONTEXT_PREFIX
    systemPrompt += getKnowledgeContext(route.knowledgeKeys)
  }

  // ── Build user content (text or text+image) ───────────────────────────────────

  let userContent
  if (hasPhoto) {
    try {
      const fileId = message.photo[message.photo.length - 1].file_id
      const base64 = await downloadPhotoAsBase64(fileId, botToken)
      // xAI / OpenAI vision format
      userContent = [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text',      text: text || 'Что ты видишь?' },
      ]
    } catch (err) {
      console.error('Photo download error:', err)
      userContent = text || 'Посмотри на это изображение'
    }
  } else {
    userContent = text
  }

  // ── Save user message to SQLite + build API messages ──────────────────────────

  const userMsgText = hasPhoto ? (text || '[фото]') : text
  storage.saveMessage(userId, 'user', userMsgText)
  session.messages.push({ role: 'user', content: userMsgText })

  // Replace last message with actual content (may include image)
  const apiMessages = session.messages.map(m => ({ role: m.role, content: m.content }))
  apiMessages[apiMessages.length - 1].content = userContent

  // ── Call AI (streaming) ───────────────────────────────────────────────────────

  let msgId = null
  try {
    // Send ▌ placeholder immediately, then stream and edit
    const placeholder = await tgSendRaw(botToken, chatId, '▌')
    msgId = placeholder?.message_id

    let accumulated = ''
    let lastEdit    = Date.now()

    const { text: reply, usedSearch } = await streamAI(
      { apiKey: anthropicKey, model: route.model, systemPrompt, messages: apiMessages },
      async (chunk) => {
        accumulated += chunk
        if (msgId && Date.now() - lastEdit > 800) {
          await tgEdit(botToken, chatId, msgId, accumulated + ' ▌')
          lastEdit = Date.now()
        }
      },
    )

    // Save assistant reply to SQLite
    storage.saveMessage(userId, 'assistant', reply)

    const moodInfo   = MOOD_DISPLAY[profile.mood] || MOOD_DISPLAY['neutral']
    const moodPrefix = `_${moodInfo.emoji} ${moodInfo.label}_\n\n`
    const finalReply = moodPrefix + (usedSearch
      ? reply + '\n\n_🕵️ Тени нашептали свежие сведения..._'
      : reply)

    // ── Final edit with HTML formatting ──────────────────────────────────────────
    // Note: editMessageText does NOT support ReplyKeyboardMarkup — only InlineKeyboard.
    // The reply keyboard persists globally from the previous tgSend call.
    if (msgId) {
      await tgEditMarkdown(botToken, chatId, msgId, finalReply)
    } else {
      try {
        await tgSend(botToken, chatId, finalReply, MAIN_KEYBOARD)
      } catch {
        await tgSendPlain(botToken, chatId, reply, MAIN_KEYBOARD)
      }
    }

    // ── Profile extraction + delta save ──────────────────────────────────────────
    // Build synthetic profile with arrays so profileExtractor works unchanged
    const existingMemorySummaries = new Set(dbMemories.map(m => m.summary))
    const existingNightSummaries  = new Set(dbNights.map(n => n.summary))
    const existingFactStrings     = new Set(dbFacts)

    const syntheticProfile = {
      ...profile,
      keyMemories: dbMemories.map(m => ({
        type:    m.memory_type,
        summary: m.summary,
        date:    m.created_at?.slice(0, 10),
      })),
      intimateLog: dbNights.map(n => ({
        ordinal: n.ordinal,
        summary: n.summary,
        date:    n.happened_at?.slice(0, 10),
      })),
      knownFacts: dbFacts,
    }

    const updatedProfile = await extractAndEvaluate(anthropicKey, text, reply, syntheticProfile)

    if (updatedProfile) {
      const now = new Date().toISOString()

      // Delta: find items that weren't in existing sets
      const newMemories = (updatedProfile.keyMemories || [])
        .filter(m => m?.summary && !existingMemorySummaries.has(m.summary))
      const newNights = (updatedProfile.intimateLog || [])
        .filter(n => n?.summary && !existingNightSummaries.has(n.summary))
      const newFacts = (updatedProfile.knownFacts || [])
        .filter(f => typeof f === 'string' && f.trim() && !existingFactStrings.has(f))

      // Persist new items to SQLite (with embeddings if Voyage key is set)
      for (const m of newMemories) {
        const emb = voyageKey ? await getEmbedding(m.summary, voyageKey, 0) : null
        storage.addMemory(userId, m.type || null, m.summary, m.date || now, emb ? serializeVector(emb) : null)
      }
      for (const n of newNights) {
        const emb = voyageKey ? await getEmbedding(n.summary, voyageKey, 0) : null
        storage.addIntimateNight(userId, n.ordinal ?? null, n.summary, n.date || now, n.location ?? null, n.behavior ?? null, emb ? serializeVector(emb) : null)
      }
      for (const f of newFacts) {
        const emb = voyageKey ? await getEmbedding(f, voyageKey, 0) : null
        storage.addFact(userId, f, now, emb ? serializeVector(emb) : null)
      }

      if (newMemories.length || newNights.length || newFacts.length) {
        console.log(`[profile] +${newMemories.length} mem, +${newNights.length} nights, +${newFacts.length} facts`)
      }

      // Spank never gives irritation
      if (spankMode && updatedProfile.mood === 'irritated') updatedProfile.mood = 'in_heat'

      // Save profile (scalar fields) — flags come from current session state
      storage.saveProfile(userId, {
        ...updatedProfile,
        romanceMode:  session.romanceMode,
        intimateMode: session.intimateMode,
      })

    } else {
      // extractAndEvaluate returned null — still save updated flags + lastSeen
      const now = new Date().toISOString()
      storage.saveProfile(userId, {
        ...profile,
        romanceMode:   session.romanceMode,
        intimateMode:  session.intimateMode,
        totalMessages: (profile.totalMessages || 0) + 2,
        lastSeen:      now,
        firstSeen:     profile.firstSeen || now,
      })
    }

  } catch (err) {
    console.error('Minthara AI error:', err)
    const fallbacks = [
      '_...тишина. Даже я замолкаю, когда Теневое Проклятье сгущается. Попробуй снова._',
      '_Магия Абсолюта... помехи. Повтори, смертный._',
      '_Хм. Что-то нарушило мою связь с тобой. Говори снова._',
    ]
    const errMsg = fallbacks[Math.floor(Math.random() * fallbacks.length)]
    if (msgId) {
      await tgEditMarkdown(botToken, chatId, msgId, errMsg)
    } else {
      await tgSend(botToken, chatId, errMsg, MAIN_KEYBOARD)
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
