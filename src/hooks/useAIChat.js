import { useState, useCallback, useRef, useEffect } from 'react'
import { buildSystemPrompt, CHAT_STORAGE_KEY, MAX_HISTORY_MESSAGES } from '../data/aiPrompt'

const tg = window.Telegram?.WebApp

// Persist chat history via Telegram CloudStorage (if available) or localStorage
async function saveHistory(messages) {
  const data = JSON.stringify(messages.slice(-MAX_HISTORY_MESSAGES))
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

    // Build API messages (only role + content)
    const apiMessages = updated
      .slice(-MAX_HISTORY_MESSAGES)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      abortRef.current = new AbortController()

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: apiMessages,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const assistantText = data.content
        ?.filter(b => b.type === 'text')
        .map(b => b.text)
        .join('') || ''

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
