import { useState, useRef, useEffect } from 'react'
import { useAIChat } from '../hooks/useAIChat'
import { QUICK_QUESTIONS } from '../data/aiPrompt'
import { haptic } from '../telegram'

// Minimal markdown → JSX renderer (bold, italic, code, lists)
function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line
    if (!line.trim()) { i++; continue }

    // Bullet list
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

    // Numbered list
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

    // Heading
    if (/^### /.test(line)) {
      elements.push(<div key={i} style={{ fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a84c', margin: '10px 0 4px' }}>{line.replace(/^### /, '')}</div>)
      i++; continue
    }
    if (/^## /.test(line)) {
      elements.push(<div key={i} style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8c97a', margin: '12px 0 5px' }}>{line.replace(/^## /, '')}</div>)
      i++; continue
    }

    // Code block
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

    // Normal paragraph
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
  // Split by bold/italic/code/🚨
  const parts = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|🚨[^\n]*)/g
  let last = 0
  let m
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={m.index} style={{ color: '#e8c97a', fontWeight: 600 }}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      parts.push(<em key={m.index} style={{ color: '#c8b89a', fontStyle: 'italic' }}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`')) {
      parts.push(<code key={m.index} style={{ background: 'rgba(0,0,0,.4)', padding: '1px 5px', borderRadius: 3, fontSize: 12, color: '#6ab8d4' }}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('🚨')) {
      parts.push(<span key={m.index} style={{ color: '#e03060', fontWeight: 600 }}>{token}</span>)
    }
    last = m.index + token.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 10,
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #7a1225, #3e1460)',
          border: '1px solid rgba(196,32,64,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, marginRight: 8, alignSelf: 'flex-end',
        }}>🩸</div>
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
        {isUser
          ? <p style={{ fontSize: 14, color: '#e8dcc8', margin: 0, lineHeight: 1.55 }}>{msg.content}</p>
          : renderMarkdown(msg.content)
        }
        <div style={{ fontSize: 9.5, color: '#4a3a3a', marginTop: 5, textAlign: 'right', fontFamily: 'Cinzel,serif' }}>
          {new Date(msg.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #7a1225, #3e1460)',
        border: '1px solid rgba(196,32,64,.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>🩸</div>
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
  )
}

function QuickQuestionsPanel({ onSelect }) {
  const [openCat, setOpenCat] = useState(null)

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Intro */}
      <div style={{
        padding: '14px 16px', marginBottom: 12,
        background: 'linear-gradient(135deg, rgba(122,18,37,.15), rgba(62,10,80,.1))',
        border: '1px solid rgba(196,32,64,.2)',
        borderRadius: 10,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 30, flexShrink: 0 }}>🩸</span>
        <div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: '#e8c97a', marginBottom: 4, letterSpacing: 1 }}>
            Советник Dark Urge
          </div>
          <div style={{ fontSize: 13, color: '#a89878', lineHeight: 1.55 }}>
            ИИ-советник по Dark Urge пути BG3. Задай любой вопрос о прохождении, романе с Минтарой, билдах или механиках.
          </div>
        </div>
      </div>

      {/* API key notice */}
      <div style={{
        padding: '9px 12px', marginBottom: 12,
        background: 'rgba(106,184,212,.07)',
        border: '1px solid rgba(106,184,212,.2)',
        borderRadius: 6,
        fontSize: 12, color: '#6ab8d4', lineHeight: 1.5,
      }}>
        ℹ️ Для работы нужен <strong style={{ color: '#6ab8d4' }}>Anthropic API ключ</strong> в переменной окружения на сервере. <a href="https://console.anthropic.com" target="_blank" rel="noopener" style={{ color: '#6ab8d4' }}>console.anthropic.com</a>
      </div>

      {/* Category tabs */}
      <div className="section-label">Быстрые вопросы</div>
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
              color: openCat === cat.category ? cat.color : '#8a7a6a',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >{cat.icon} {cat.category}</button>
        ))}
      </div>

      {/* Questions for open category */}
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

export default function AIPage() {
  const { messages, loading, error, historyLoaded, sendMessage, clearHistory, stopGeneration } = useAIChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  function handleSend(text) {
    const q = text ?? input
    if (!q.trim()) return
    setInput('')
    sendMessage(q)
    inputRef.current?.blur()
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showWelcome = historyLoaded && messages.length === 0

  return (
    <>
      <div className="page-header">
        <h1>ИИ Советник</h1>
        <p>Claude — Dark Urge эксперт</p>
      </div>

      {/* Clear history button */}
      {messages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => { haptic('light'); clearHistory() }}
            style={{
              background: 'none', border: '1px solid rgba(42,25,28,.6)',
              borderRadius: 5, padding: '5px 12px',
              fontFamily: 'Cinzel,serif', fontSize: 8.5, letterSpacing: 1.5,
              textTransform: 'uppercase', color: '#6a5a5a',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >🗑 Очистить историю</button>
        </div>
      )}

      {/* Welcome / quick questions */}
      {showWelcome && (
        <QuickQuestionsPanel onSelect={q => handleSend(q)} />
      )}

      {/* Messages */}
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

      {/* Quick questions below chat if has messages */}
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
                    color: '#8a7a6a', cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >{cat.icon} {q}</button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
          30% { transform: scale(1.4); opacity: 1; }
        }
      `}</style>

      {/* Input area — fixed at bottom above nav */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom, 0px))',
        left: 0, right: 0,
        background: 'var(--bg-dark)',
        borderTop: '1px solid var(--border-gold)',
        padding: '8px 12px',
        display: 'flex', gap: 8, alignItems: 'flex-end',
        zIndex: 90,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Спроси что угодно о Dark Urge BG3…"
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
            disabled={!input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: input.trim() ? 'rgba(196,32,64,.25)' : 'rgba(42,25,28,.4)',
              border: `1px solid ${input.trim() ? 'rgba(196,32,64,.5)' : 'rgba(42,25,28,.5)'}`,
              cursor: input.trim() ? 'pointer' : 'default',
              fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
          >🩸</button>
        )}
      </div>

      {/* Spacer for fixed input */}
      <div style={{ height: 66 }} />
    </>
  )
}
