import { useState, useEffect, useRef } from 'react'
import { search } from '../data/searchIndex'
import { haptic } from '../telegram'

const TAB_COLORS = {
  romance: '#e03060',
  builds:  '#6ab8d4',
  equip:   '#c9a84c',
  potions: '#6abf69',
  lore:    '#9b59b6',
  map:     '#d4892a',
  party:   '#6ab8d4',
  gallery: '#c9a84c',
}

export default function SearchOverlay({ onClose, onNavigate }) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); return }
    setResults(search(trimmed))
  }, [query])

  function handleSelect(item) {
    haptic('light')
    onNavigate(item.tab)
    onClose()
  }

  // Group results by tab
  const grouped = results.reduce((acc, item) => {
    if (!acc[item.tab]) acc[item.tab] = { icon: item.tabIcon, label: item.tabLabel, items: [] }
    acc[item.tab].items.push(item)
    return acc
  }, {})

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'var(--bg-deep)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Search header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-dark)',
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по всему гайду…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Cinzel, serif',
            fontSize: 14,
            color: 'var(--text-primary)',
            letterSpacing: '0.5px',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}
          >✕</button>
        )}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            fontFamily: 'Cinzel,serif', fontSize: 10,
            letterSpacing: 1.5, textTransform: 'uppercase',
            color: 'var(--crimson-bright)', cursor: 'pointer',
            padding: '6px 8px',
          }}
        >Закрыть</button>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {/* Empty state */}
        {query.length < 2 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📖</div>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: 'var(--text-muted)', letterSpacing: 1 }}>
              Введи 2+ символа для поиска
            </div>
            <div style={{ fontSize: 12, color: '#4a3a3a', marginTop: 8 }}>
              Романы · Билды · Шмот · Зелья · Лор · Карта · Отряд
            </div>
          </div>
        )}

        {/* No results */}
        {query.length >= 2 && results.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🕯️</div>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: 'var(--text-muted)', letterSpacing: 1 }}>
              Ничего не найдено
            </div>
            <div style={{ fontSize: 12, color: '#4a3a3a', marginTop: 6 }}>«{query}»</div>
          </div>
        )}

        {/* Grouped results */}
        {Object.entries(grouped).map(([tabId, group]) => (
          <div key={tabId} style={{ marginBottom: 20 }}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 8,
              paddingBottom: 6,
              borderBottom: `1px solid ${TAB_COLORS[tabId] || '#c9a84c'}33`,
            }}>
              <span style={{ fontSize: 16 }}>{group.icon}</span>
              <span style={{
                fontFamily: 'Cinzel,serif', fontSize: 9.5,
                letterSpacing: 2, textTransform: 'uppercase',
                color: TAB_COLORS[tabId] || '#c9a84c',
              }}>{group.label}</span>
              <span style={{
                marginLeft: 'auto',
                fontFamily: 'Cinzel,serif', fontSize: 8.5,
                color: 'var(--text-muted)',
              }}>{group.items.length}</span>
            </div>

            {/* Items */}
            {group.items.slice(0, 5).map(item => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex', gap: 11, alignItems: 'flex-start',
                  padding: '10px 11px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 7, marginBottom: 6,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color .15s',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{item.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'Cinzel,serif', fontSize: 12,
                    color: 'var(--text-primary)', marginBottom: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.title}</div>
                  <div style={{
                    fontSize: 11.5, color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.subtitle}</div>
                </div>
                <span style={{ color: 'var(--gold-dim)', fontSize: 10, flexShrink: 0, alignSelf: 'center' }}>→</span>
              </div>
            ))}

            {group.items.length > 5 && (
              <div style={{
                textAlign: 'center', padding: '4px 0',
                fontFamily: 'Cinzel,serif', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1,
              }}>ещё {group.items.length - 5} результатов…</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
