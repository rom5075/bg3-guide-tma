import { useState } from 'react'
import { WORLD_LORE, CHARACTER_LORE, LORE_TAGS } from '../data/lore'
import Accordion from '../components/Accordion'

export default function LorePage() {
  const [section, setSection] = useState('chars') // 'chars' | 'world'
  const [activeChar, setActiveChar] = useState('minthara')
  const [activeTag, setActiveTag] = useState('Все')
  const [expandedChar, setExpandedChar] = useState(null)

  const char = CHARACTER_LORE.find(c => c.id === activeChar)

  const filteredWorld = activeTag === 'Все'
    ? WORLD_LORE
    : WORLD_LORE.filter(w => w.tags.includes(activeTag))

  return (
    <>
      <div className="page-header">
        <h1>Лор и предыстории</h1>
        <p>Мир, боги и история персонажей</p>
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'chars', icon: '👤', label: 'Персонажи' },
          { id: 'world', icon: '🌍', label: 'Мир и лор' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              flex: 1,
              padding: '11px 8px',
              background: section === s.id
                ? 'linear-gradient(135deg, rgba(122,18,37,.5), rgba(62,10,80,.4))'
                : 'rgba(14,10,14,.7)',
              border: `1px solid ${section === s.id ? 'rgba(196,32,64,.5)' : 'rgba(42,25,28,.7)'}`,
              borderRadius: 6,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'Cinzel,serif',
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: section === s.id ? '#e8dcc8' : '#8a7a6a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ CHARACTERS SECTION ═══ */}
      {section === 'chars' && (
        <>
          {/* Character selector */}
          <div className="scroll-x" style={{ marginBottom: 16 }}>
            {CHARACTER_LORE.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveChar(c.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 5, padding: '10px 12px', minWidth: 68,
                  background: activeChar === c.id
                    ? `linear-gradient(135deg, ${c.color}40, ${c.color}15)`
                    : 'rgba(14,10,14,.7)',
                  border: `1px solid ${activeChar === c.id ? c.color + '66' : 'rgba(42,25,28,.7)'}`,
                  borderRadius: 6, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: 22 }}>{c.emoji}</span>
                <span style={{
                  fontFamily: 'Cinzel,serif', fontSize: 8.5, letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: activeChar === c.id ? '#e8dcc8' : '#8a7a6a',
                  textAlign: 'center', lineHeight: 1.3,
                }}>{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Character header */}
          <div style={{
            background: `linear-gradient(135deg, ${char.color}18, rgba(8,5,10,.9))`,
            border: `1px solid ${char.color}44`,
            borderRadius: 8,
            padding: '16px 18px',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* BG emoji */}
            <div style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 70, opacity: .05, pointerEvents: 'none',
            }}>{char.emoji}</div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${char.color}60, #1a0828)`,
                border: `2px solid ${char.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>{char.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Cinzel,serif', fontSize: 16,
                  color: char.color, marginBottom: 3,
                }}>{char.name}</div>
                <div style={{
                  fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 2,
                  textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 8,
                }}>{char.subtitle}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 12.5, color: '#8a7a6a' }}>
                    <span style={{ color: '#7a5f28' }}>Происхождение: </span>{char.born}
                  </div>
                  {char.house && (
                    <div style={{ fontSize: 12.5, color: '#8a7a6a' }}>
                      <span style={{ color: '#7a5f28' }}>Дом: </span>{char.house}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Character sections as accordions */}
          {char.sections.map((sec, i) => (
            <Accordion
              key={i}
              icon={['📜', '⚔️', '🔮', '💭'][i] || '📖'}
              title={sec.title}
              defaultOpen={i === 0}
            >
              <div style={{
                fontSize: 14.5,
                color: '#c8b89a',
                lineHeight: 1.8,
                fontFamily: 'Cormorant Garamond, Georgia, serif',
                whiteSpace: 'pre-line',
              }}>
                {sec.text}
              </div>
            </Accordion>
          ))}
        </>
      )}

      {/* ═══ WORLD SECTION ═══ */}
      {section === 'world' && (
        <>
          {/* Tag filter */}
          <div className="scroll-x" style={{ marginBottom: 14 }}>
            {LORE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                style={{
                  flexShrink: 0,
                  padding: '6px 13px',
                  background: activeTag === tag
                    ? 'rgba(201,168,76,.18)'
                    : 'rgba(14,10,14,.6)',
                  border: `1px solid ${activeTag === tag ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
                  borderRadius: 20,
                  fontFamily: 'Cinzel,serif',
                  fontSize: 9.5,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: activeTag === tag ? '#e8c97a' : '#8a7a6a',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >{tag}</button>
            ))}
          </div>

          {filteredWorld.length === 0 && (
            <div className="note">Нет статей по тегу «{activeTag}»</div>
          )}

          {filteredWorld.map((w, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(14,10,14,.8)',
                border: '1px solid rgba(42,25,28,.7)',
                borderRadius: 7,
                marginBottom: 10,
                overflow: 'hidden',
                transition: 'border-color .2s ease',
              }}
            >
              {/* Header always visible */}
              <div
                onClick={() => setExpandedChar(expandedChar === w.id ? null : w.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                  background: expandedChar === w.id
                    ? 'rgba(122,18,37,.12)'
                    : 'transparent',
                  borderBottom: expandedChar === w.id
                    ? '1px solid rgba(201,168,76,.18)'
                    : '1px solid transparent',
                  transition: 'background .2s ease',
                }}
              >
                <span style={{ fontSize: 24, flexShrink: 0 }}>{w.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'Cinzel,serif', fontSize: 13,
                    color: '#e8dcc8', marginBottom: 3,
                  }}>{w.title}</div>
                  <div style={{ fontSize: 12.5, color: '#8a7a6a', fontStyle: 'italic' }}>{w.short}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
                    {w.tags.map(tag => (
                      <span key={tag} className="badge b-gold" style={{ fontSize: 8 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <span style={{
                  color: '#7a5f28', fontSize: 10,
                  transform: expandedChar === w.id ? 'rotate(180deg)' : 'none',
                  transition: 'transform .22s ease',
                  flexShrink: 0,
                }}>▼</span>
              </div>

              {/* Body */}
              <div style={{
                maxHeight: expandedChar === w.id ? 2000 : 0,
                overflow: 'hidden',
                transition: 'max-height .38s cubic-bezier(.4,0,.2,1)',
              }}>
                <div style={{
                  padding: '14px 16px',
                  fontSize: 14.5,
                  color: '#c8b89a',
                  lineHeight: 1.8,
                  fontFamily: 'Cormorant Garamond, Georgia, serif',
                  whiteSpace: 'pre-line',
                  background: 'rgba(8,5,10,.4)',
                }}>
                  {w.body}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}
