import { useState, useCallback, useRef, useEffect } from 'react'
import { CHAT_STORAGE_KEY, MAX_HISTORY_MESSAGES } from '../data/aiPrompt'

const tg = window.Telegram?.WebApp

// Persist chat history via Telegram CloudStorage (if available) or localStorage
async function saveHistory(messages) {
  // Keep last N messages but trim content to avoid hitting CloudStorage 4KB limit
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES).map(m => ({
    ...m,
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

// Detect romance mode from message history
function detectRomanceMode(messages) {
  const keywords = ['люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель',
    'флирт', 'хочу тебя', 'kiss', 'love', 'hold me', 'beautiful']
  return messages
    .filter(m => m.role === 'user')
    .some(m => keywords.some(kw => m.content.toLowerCase().includes(kw)))
}

export function useAIChat() {
  const [messages, setMessages]   = useState([])   // { role, content, id, ts }
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [historyLoaded, setHistoryLoaded] = useState(false)
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

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || loading) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: userText.trim(),
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

      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          romanceMode: detectRomanceMode(updated),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantText = data.text || ''

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

  return { messages, loading, error, historyLoaded, sendMessage, clearHistory, stopGeneration }
}
