import { useState, useCallback, useRef, useEffect } from 'react'
import { CHAT_STORAGE_KEY, MAX_HISTORY_MESSAGES } from '../data/aiPrompt'

const tg = window.Telegram?.WebApp

// Telegram user ID — used for server-side profile (long-term memory)
// initDataUnsafe is unverified but fine for personal use
function getTgUserId() {
  return tg?.initDataUnsafe?.user?.id?.toString() || null
}

// Persist chat history via Telegram CloudStorage (if available) or localStorage
async function saveHistory(messages) {
  // Keep last N messages but trim content to avoid hitting CloudStorage 4KB limit
  // imagePreview is excluded — base64 would blow up the 4KB limit
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES).map(m => ({
    id: m.id, role: m.role, ts: m.ts,
    content: m.content.length > 300 ? m.content.slice(0, 300) + '…' : m.content,
  }))
  const data = JSON.stringify(trimmed)
  try {
    if (tg?.CloudStorage?.setItem) {
      await new Promise((res, rej) =>
        tg.CloudStorage.setItem(CHAT_STORAGE_KEY, data, (err, ok) => err ? rej(err) : res(ok))
      )
    } else {
      localStorage.setItem(CHAT_STORAGE_KEY, data)
    }
  } catch {}
}

async function loadHistory() {
  try {
    if (tg?.CloudStorage?.getItem) {
      return await new Promise((res) =>
        tg.CloudStorage.getItem(CHAT_STORAGE_KEY, (err, val) => res(val || null))
      )
    } else {
      return localStorage.getItem(CHAT_STORAGE_KEY)
    }
  } catch { return null }
}

const ROMANCE_KW = ['люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель',
  'флирт', 'хочу тебя', 'kiss', 'love', 'hold me', 'beautiful']

const INTIMATE_KW = [
  'займёмся', 'займемся', 'переспи', 'переспать', 'в постель', 'в кровать',
  'ляжем', 'ляг со мной', 'хочу тебя', 'трахн', 'секс', 'интим',
  'раздень', 'разденься', 'обнажи', 'возьми меня', 'будь моей', 'будь моим',
  'плотские', 'утех', 'desire', 'fuck', 'bed with me', 'make love', 'sleep with',
  'take me', 'undress',
]

// Detect romance mode from message history
function detectRomanceMode(messages) {
  const userMsgs = messages.filter(m => m.role === 'user')
  return userMsgs.some(m => ROMANCE_KW.some(kw => m.content.toLowerCase().includes(kw)))
}

// Detect intimate mode — only from the latest user message
function detectIntimateMode(messages) {
  const last = [...messages].reverse().find(m => m.role === 'user')
  if (!last) return false
  const lower = last.content.toLowerCase()
  return INTIMATE_KW.some(kw => lower.includes(kw))
}

export function useAIChat() {
  const [messages, setMessages]   = useState([])   // { role, content, id, ts }
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [mood, setMood]                   = useState('neutral')
  const [totalMessages, setTotalMessages] = useState(0)
  const abortRef = useRef(null)

  // Load history on mount
  useEffect(() => {
    loadHistory().then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed)
          }
        } catch {}
      }
      setHistoryLoaded(true)
    })
  }, [])

  const sendMessage = useCallback(async (userText, imageBase64 = null, mediaType = 'image/jpeg') => {
    if (!userText.trim() && !imageBase64 || loading) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText.trim() || '📷',
      imagePreview: imageBase64 ? `data:${mediaType};base64,${imageBase64}` : null,
      ts: new Date().toISOString(),
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    setError(null)

    // Send full content to API (trimming only happens on storage)
    const apiMessages = updated
      .slice(-MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      abortRef.current = new AbortController()

      const apiUrl = import.meta.env.VITE_API_URL || '/api/chat'
      const res = await fetch(apiUrl, {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:       apiMessages,
          romanceMode:    detectRomanceMode(updated),
          intimateMode:   detectIntimateMode(updated),
          userId:         getTgUserId(),
          imageBase64:    imageBase64 || undefined,
          imageMediaType: imageBase64 ? mediaType : undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantText = data.text || ''
      if (data.mood)          setMood(data.mood)
      if (data.totalMessages) setTotalMessages(data.totalMessages)

      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantText,
        ts: new Date().toISOString(),
      }

      const final = [...updated, assistantMsg]
      setMessages(final)
      saveHistory(final)
    } catch (e) {
      if (e.name === 'AbortError') return
      setError(e.message || 'Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  function clearHistory() {
    setMessages([])
    try {
      if (tg?.CloudStorage?.removeItem) {
        tg.CloudStorage.removeItem(CHAT_STORAGE_KEY, () => {})
      } else {
        localStorage.removeItem(CHAT_STORAGE_KEY)
      }
    } catch {}
  }

  function stopGeneration() {
    abortRef.current?.abort()
    setLoading(false)
  }

  return { messages, loading, error, historyLoaded, mood, totalMessages, sendMessage, clearHistory, stopGeneration }
}
