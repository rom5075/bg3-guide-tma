import { useState, useRef, useEffect } from 'react'
import { useAIChat } from '../hooks/useAIChat'
import { QUICK_QUESTIONS } from '../data/aiPrompt'
import { haptic } from '../telegram'

// ─── Image compression (Canvas API, no deps) ──────────────────────────────────

function compressImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        const previewUrl = canvas.toDataURL('image/jpeg', 0.5)
        const base64    = canvas.toDataURL('image/jpeg', 0.85).split(',')[1]
        resolve({ base64, previewUrl, mediaType: 'image/jpeg' })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ─── Mood config ──────────────────────────────────────────────────────────────

const MOOD_CONFIG = {
  neutral:    { color: '#4a7a4a', label: 'Нейтральна' },
  warm:       { color: '#c9a84c', label: 'Тепло'      },
  cold:       { color: '#6ab8d4', label: 'Холодна'    },
  irritated:  { color: '#c42040', label: 'Раздражена' },
  possessive: { color: '#8a3060', label: 'Властна'    },
  in_heat:    { color: '#c42040', label: 'Желает'     },
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    if (/^[-*•] /.test(line)) {
      const listItems = []
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*•] /, ''))
        i++
      }
      elements.push(
        <ul key={i} style={{ margin: '6px 0', paddingLeft: 18 }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ marginBottom: 3, fontSize: 14, color: '#c8b89a', lineHeight: 1.55 }}>
              {inlineMarkdown(item)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (/^\d+\. /.test(line)) {
      const listItems = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={i} style={{ margin: '6px 0', paddingLeft: 20 }}>
          {listItems.map((item, j) => (
            <li key={j} style={{ marginBottom: 3, fontSize: 14, color: '#c8b89a', lineHeight: 1.55 }}>
              {inlineMarkdown(item)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    if (/^### /.test(line)) {
      elements.push(<div key={i} style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a84c', margin: '10px 0 4px' }}>{line.replace(/^### /, '')}</div>)
      i++; continue
    }
    if (/^## /.test(line)) {
      elements.push(<div key={i} style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8c97a', margin: '12px 0 5px' }}>{line.replace(/^## /, '')}</div>)
      i++; continue
    }

    if (line.startsWith('```')) {
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i} style={{
          background: 'rgba(0,0,0,.4)', border: '1px solid rgba(42,25,28,.6)',
          borderRadius: 4, padding: '8px 10px', overflowX: 'auto',
          fontSize: 12, color: '#6ab8d4', margin: '6px 0',
        }}>{codeLines.join('\n')}</pre>
      )
      i++; continue
    }

    elements.push(
      <p key={i} style={{ fontSize: 14, color: '#c8b89a', lineHeight: 1.65, margin: '4px 0', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
        {inlineMarkdown(line)}
      </p>
    )
    i++
  }
  return elements
}

function inlineMarkdown(text) {
  const parts = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|🚨[^\n]*)/g
  let last = 0, m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**'))
      parts.push(<strong key={m.index} style={{ color: '#e8c97a', fontWeight: 600 }}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith('*'))
      parts.push(<em key={m.index} style={{ color: '#c8b89a', fontStyle: 'italic' }}>{token.slice(1, -1)}</em>)
    else if (token.startsWith('`'))
      parts.push(<code key={m.index} style={{ background: 'rgba(0,0,0,.4)', padding: '1px 5px', borderRadius: 3, fontSize: 12, color: '#6ab8d4' }}>{token.slice(1, -1)}</code>)
    else if (token.startsWith('🚨'))
      parts.push(<span key={m.index} style={{ color: '#e03060', fontWeight: 600 }}>{token}</span>)
    last = m.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MintharaAvatar({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden',
      border: `1px solid rgba(201,168,76,${size > 40 ? '.4' : '.25'})`,
      background: 'linear-gradient(145deg, #0d1a3e, #2a0d4a, #5a0f20)',
      boxShadow: size > 40 ? '0 0 14px rgba(196,32,64,.25)' : 'none',
    }}>
      <img
        src="/minthara.jpg"
        alt="Minthara"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top right' }}
        onError={e => { e.target.style.display = 'none' }}
      />
    </div>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ marginBottom: 10 }}>
      {/* Sender label — only for Minthara */}
      {!isUser && (
        <div style={{
          fontFamily: 'Cinzel,serif',
          fontSize: 9,
          color: 'rgba(201,168,76,.45)',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          marginLeft: 42,
          marginBottom: 3,
        }}>
          Минтара
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}>
        {!isUser && (
          <div style={{ marginRight: 8, alignSelf: 'flex-end' }}>
            <MintharaAvatar size={30} />
          </div>
        )}
        <div style={{
          maxWidth: '80%',
          padding: isUser ? '9px 13px' : '10px 14px',
          background: isUser
            ? 'linear-gradient(135deg, rgba(196,32,64,.25), rgba(122,18,37,.2))'
            : 'rgba(14,10,20,.85)',
          border: `1px solid ${isUser ? 'rgba(196,32,64,.3)' : 'rgba(42,25,28,.7)'}`,
          borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          backdropFilter: 'blur(4px)',
        }}>
          {msg.imagePreview && (
            <img
              src={msg.imagePreview}
              alt="фото"
              style={{ maxWidth: 200, borderRadius: 8, marginBottom: msg.content && msg.content !== '📷' ? 6 : 2, display: 'block' }}
            />
          )}
          {isUser
            ? (msg.content && msg.content !== '📷'
                ? <p style={{ fontSize: 14, color: '#e8dcc8', margin: 0, lineHeight: 1.55 }}>{msg.content}</p>
                : null)
            : renderMarkdown(msg.content)
          }
          <div style={{ fontSize: 9.5, color: '#4a3a3a', marginTop: 5, textAlign: 'right', fontFamily: 'Cinzel,serif' }}>
            {new Date(msg.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontFamily: 'Cinzel,serif', fontSize: 9,
        color: 'rgba(201,168,76,.45)', letterSpacing: 1.2,
        textTransform: 'uppercase', marginLeft: 42, marginBottom: 3,
      }}>
        Минтара
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <MintharaAvatar size={30} />
        <div style={{
          padding: '12px 16px',
          background: 'rgba(14,10,20,.85)',
          border: '1px solid rgba(42,25,28,.7)',
          borderRadius: '14px 14px 14px 4px',
          display: 'flex', gap: 5, alignItems: 'center',
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#c42040',
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Welcome screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onSelect }) {
  const [openCat, setOpenCat] = useState(null)

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Portrait card */}
      <div style={{
        padding: '18px 16px',
        marginBottom: 14,
        background: 'linear-gradient(135deg, rgba(122,18,37,.12), rgba(62,10,80,.08))',
        border: '1px solid rgba(196,32,64,.18)',
        borderRadius: 12,
        display: 'flex', gap: 14, alignItems: 'center',
      }}>
        <MintharaAvatar size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8c97a', marginBottom: 2, letterSpacing: 0.5 }}>
            Минтара Баэнр
          </div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: '#6a5a5a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Главный военачальник · Дом Баэнр
          </div>
          <div style={{ fontSize: 13.5, color: '#a08060', lineHeight: 1.6, fontFamily: 'Cormorant Garamond, Georgia, serif', fontStyle: 'italic' }}>
            "Ты нашёл меня. Интересно...
            <br />Чего ты хочешь?"
          </div>
        </div>
      </div>

      {/* Quick questions */}
      <div className="section-label">Начать разговор</div>
      <div className="scroll-x" style={{ gap: 8, marginBottom: 12 }}>
        {QUICK_QUESTIONS.map(cat => (
          <button
            key={cat.category}
            onClick={() => { haptic('light'); setOpenCat(openCat === cat.category ? null : cat.category) }}
            style={{
              flexShrink: 0, padding: '7px 14px',
              background: openCat === cat.category ? `${cat.color}22` : 'rgba(14,10,14,.6)',
              border: `1px solid ${openCat === cat.category ? cat.color + '55' : 'rgba(42,25,28,.7)'}`,
              borderRadius: 20,
              fontFamily: 'Cinzel,serif', fontSize: 9.5, letterSpacing: 1,
              color: openCat === cat.category ? cat.color : '#7a6a5a',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >{cat.icon} {cat.category}</button>
        ))}
      </div>

      {openCat && (() => {
        const cat = QUICK_QUESTIONS.find(c => c.category === openCat)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {cat.questions.map((q, i) => (
              <button
                key={i}
                onClick={() => { haptic('medium'); onSelect(q) }}
                style={{
                  textAlign: 'left', padding: '10px 14px',
                  background: 'rgba(10,6,14,.7)',
                  border: `1px solid ${cat.color}33`,
                  borderRadius: 8,
                  fontFamily: 'Cormorant Garamond, serif', fontSize: 14,
                  color: '#c8b89a', lineHeight: 1.45,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
              >
                <span>{q}</span>
                <span style={{ color: cat.color, fontSize: 14, flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIPage() {
  const { messages, loading, error, historyLoaded, mood, totalMessages, sendMessage, clearHistory, stopGeneration } = useAIChat()
  const [input, setInput]           = useState('')
  const [pendingImage, setPendingImage] = useState(null) // { base64, previewUrl, mediaType }
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const fileInputRef   = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    haptic('light')
    const compressed = await compressImage(file)
    setPendingImage(compressed)
  }

  function handleSend(text) {
    const q = text ?? input
    if (!q.trim() && !pendingImage) return
    setInput('')
    sendMessage(q ?? '', pendingImage?.base64 || null, pendingImage?.mediaType || 'image/jpeg')
    setPendingImage(null)
    inputRef.current?.blur()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showWelcome = historyLoaded && messages.length === 0
  const moodCfg = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral

  // Detect active modes from last few messages
  const recentUser = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase()).join(' ')
  const ROMANCE_KW = ['люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель', 'флирт', 'хочу тебя']
  const INTIMATE_KW = ['займёмся', 'займемся', 'переспи', 'в постель', 'секс', 'интим', 'трахн', 'желание']
  const isRomance  = ROMANCE_KW.some(kw => recentUser.includes(kw))
  const isIntimate = INTIMATE_KW.some(kw => recentUser.includes(kw))

  return (
    <>
      {/* ── Custom header (replaces .page-header) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 0 14px',
        marginBottom: 2,
      }}>
        <MintharaAvatar size={46} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 14, color: '#e8c97a', letterSpacing: 0.4, lineHeight: 1.2 }}>
            Минтара Баэнр
          </div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: '#5a4a4a', letterSpacing: 0.8, marginTop: 2, textTransform: 'uppercase' }}>
            Главный военачальник · Дом Баэнр
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: moodCfg.color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${moodCfg.color}88`,
              animation: mood === 'in_heat' ? 'pulse 1.2s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: 9.5, color: moodCfg.color, opacity: 0.85 }}>
              {moodCfg.label}
            </span>
            {totalMessages > 0 && (
              <>
                <span style={{ color: '#3a2a3a', fontSize: 9 }}>·</span>
                <span style={{ fontFamily: 'Cinzel,serif', fontSize: 9.5, color: '#4a3a4a' }}>
                  {totalMessages} {totalMessages === 1 ? 'сообщение' : totalMessages < 5 ? 'сообщения' : 'сообщений'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Clear history button */}
        {messages.length > 0 && (
          <button
            onClick={() => { haptic('light'); clearHistory() }}
            style={{
              background: 'none', border: '1px solid rgba(42,25,28,.5)',
              borderRadius: 6, padding: '6px 10px',
              fontFamily: 'Cinzel,serif', fontSize: 8.5, letterSpacing: 1.5,
              textTransform: 'uppercase', color: '#5a4a4a',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >🗑</button>
        )}
      </div>

      {/* ── Welcome / quick questions ── */}
      {showWelcome && (
        <WelcomeScreen onSelect={q => handleSend(q)} />
      )}

      {/* ── Messages ── */}
      {messages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          {loading && <TypingIndicator />}
          {error && (
            <div style={{
              padding: '9px 12px', marginBottom: 8,
              background: 'rgba(196,32,64,.1)',
              border: '1px solid rgba(196,32,64,.3)',
              borderRadius: 6, fontSize: 13, color: '#c42040',
            }}>⚠️ {error}</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ── Mode badges ── */}
      {messages.length > 0 && (isRomance || isIntimate) && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {isRomance && (
            <div style={{
              padding: '4px 10px', borderRadius: 10,
              background: 'rgba(196,32,64,.1)', border: '1px solid rgba(196,32,64,.22)',
              fontFamily: 'Cinzel,serif', fontSize: 8.5, color: '#c42040', letterSpacing: 0.5,
            }}>♥ Романтика</div>
          )}
          {isIntimate && (
            <div style={{
              padding: '4px 10px', borderRadius: 10,
              background: 'rgba(138,32,80,.1)', border: '1px solid rgba(138,32,80,.25)',
              fontFamily: 'Cinzel,serif', fontSize: 8.5, color: '#8a2050', letterSpacing: 0.5,
            }}>🔥 Близость</div>
          )}
        </div>
      )}

      {/* ── Quick chips below chat ── */}
      {messages.length > 0 && !loading && (
        <div style={{ marginBottom: 14 }}>
          <div className="scroll-x" style={{ gap: 7 }}>
            {QUICK_QUESTIONS.flatMap(cat =>
              cat.questions.slice(0, 1).map((q, i) => (
                <button
                  key={`${cat.category}-${i}`}
                  onClick={() => { haptic('light'); handleSend(q) }}
                  style={{
                    flexShrink: 0, padding: '6px 12px',
                    background: 'rgba(14,10,14,.6)',
                    border: `1px solid ${cat.color}33`,
                    borderRadius: 14,
                    fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: .5,
                    color: '#7a6a5a', cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >{cat.icon} {q}</button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Animations ── */}
      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>

      {/* ── Input area ── */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))',
        left: 0, right: 0,
        background: 'var(--bg-dark)',
        borderTop: '1px solid var(--border-gold)',
        zIndex: 90,
      }}>
        {/* Image preview chip */}
        {pendingImage && (
          <div style={{
            padding: '6px 12px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <img
              src={pendingImage.previewUrl}
              alt="pending"
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(196,32,64,.3)', flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: '#7a6a5a', fontFamily: 'Cinzel,serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              фото прикреплено
            </span>
            <button
              onClick={() => { haptic('light'); setPendingImage(null) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#7a4a4a', fontSize: 18, lineHeight: 1, padding: '2px 4px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >✕</button>
          </div>
        )}

        {/* Input row */}
        <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {/* 📎 button */}
          <button
            onClick={() => { haptic('light'); fileInputRef.current?.click() }}
            disabled={loading}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: pendingImage ? 'rgba(196,32,64,.15)' : 'rgba(42,25,28,.35)',
              border: `1px solid ${pendingImage ? 'rgba(196,32,64,.4)' : 'rgba(42,25,28,.6)'}`,
              cursor: loading ? 'default' : 'pointer',
              fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all .15s',
            }}
          >📎</button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Говори, смертный…"
            rows={1}
            style={{
              flex: 1,
              background: 'rgba(8,5,12,.8)',
              border: '1px solid rgba(42,25,28,.7)',
              borderRadius: 10,
              padding: '9px 12px',
              fontFamily: 'Cormorant Garamond, Georgia, serif',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.4,
              maxHeight: 100,
              overflowY: 'auto',
            }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
            }}
          />
          {loading ? (
            <button
              onClick={() => { haptic('medium'); stopGeneration() }}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(196,32,64,.15)',
                border: '1px solid rgba(196,32,64,.4)',
                cursor: 'pointer', fontSize: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >⏹</button>
          ) : (
            <button
              onClick={() => { haptic('medium'); handleSend() }}
              disabled={!input.trim() && !pendingImage}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: (input.trim() || pendingImage) ? 'rgba(196,32,64,.25)' : 'rgba(42,25,28,.4)',
                border: `1px solid ${(input.trim() || pendingImage) ? 'rgba(196,32,64,.5)' : 'rgba(42,25,28,.5)'}`,
                cursor: (input.trim() || pendingImage) ? 'pointer' : 'default',
                fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s',
              }}
            >🩸</button>
          )}
        </div>
      </div>

      {/* Spacer for fixed input */}
      <div style={{ height: pendingImage ? 116 : 66 }} />
    </>
  )
}
