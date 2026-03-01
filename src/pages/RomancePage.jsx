import { useState } from 'react'
import { ROMANCES, ROMANCE_ORDER } from '../data/romances'
import Accordion from '../components/Accordion'
import StepList from '../components/StepList'

const STATUS_CONFIG = {
  primary:   { label: 'Основной',   color: '#e03060' },
  available: { label: 'Доступен',   color: '#6abf69' },
  hard:      { label: 'Сложно',     color: '#d4892a' },
  lost:      { label: 'Недоступен', color: '#555' },
}

export default function RomancePage() {
  const [active, setActive] = useState('minthara')
  const companion = ROMANCES.find(r => r.id === active)
  const sc = STATUS_CONFIG[companion.status]

  return (
    <>
      <div className="page-header">
        <h1>Все романы</h1>
        <p>Dark Urge · Минтара главный · Nightsong жива</p>
      </div>

      {/* Companion selector */}
      <div className="section-label">Выбери персонажа</div>
      <div className="scroll-x" style={{ marginBottom: 16 }}>
        {ROMANCE_ORDER.map(id => {
          const r = ROMANCES.find(x => x.id === id)
          const sc2 = STATUS_CONFIG[r.status]
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                padding: '10px 12px',
                background: active === id
                  ? 'linear-gradient(135deg, rgba(122,18,37,.5), rgba(62,10,80,.5))'
                  : 'rgba(14,10,14,.7)',
                border: `1px solid ${active === id ? 'rgba(196,32,64,.55)' : 'rgba(42,25,28,.7)'}`,
                borderRadius: 6,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                minWidth: 70,
              }}
            >
              <span style={{ fontSize: 24 }}>{r.emoji}</span>
              <span style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 9,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: active === id ? '#e8dcc8' : '#8a7a6a',
                textAlign: 'center',
                lineHeight: 1.3,
              }}>{r.name}</span>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: sc2.color,
                boxShadow: `0 0 4px ${sc2.color}`,
              }} />
            </button>
          )
        })}
      </div>

      {/* Companion header */}
      <div className="dark-banner" data-emoji={companion.emoji} style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div className="comp-avatar" style={{ width: 56, height: 56, fontSize: 28, flexShrink: 0 }}>
            {companion.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div className="db-title">{companion.name}</div>
            <div className="db-sub">{companion.class}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: sc.color,
                boxShadow: `0 0 5px ${sc.color}`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: sc.color, fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
                {companion.statusLabel}
              </span>
            </div>
            <div className="db-text" style={{ fontSize: 13 }}>{companion.path_note}</div>
          </div>
        </div>
        {companion.dark_urge_bonus && (
          <div className="note" style={{ marginTop: 10, marginBottom: 0, fontSize: 12.5 }}>
            🩸 <strong>Dark Urge бонус:</strong> {companion.dark_urge_bonus}
          </div>
        )}
      </div>

      {/* Approval */}
      {companion.approval_loves.length > 0 && (
        <Accordion icon="💚" title="Одобряет" meta="что нравится" defaultOpen={companion.id === 'minthara'}>
          <ul className="approval-list">
            {companion.approval_loves.map((a, i) => (
              <li key={i} className="approval-item">
                <span className="ico">{a.ico}</span>
                <span>{a.text}</span>
              </li>
            ))}
          </ul>
          {companion.approval_hates.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#c42040', marginBottom: 8 }}>
                Ненавидит
              </div>
              <ul className="approval-list">
                {companion.approval_hates.map((a, i) => (
                  <li key={i} className="approval-item">
                    <span className="ico">{a.ico}</span>
                    <span style={{ color: '#c67' }}>{a.text}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Accordion>
      )}

      {/* Acts */}
      {companion.acts.map((act, ai) => (
        <Accordion
          key={ai}
          icon={act.act === 1 ? '1️⃣' : act.act === 2 ? '2️⃣' : '3️⃣'}
          title={act.title}
          defaultOpen={ai === 0}
        >
          {act.steps.map((s, si) => (
            <div key={si} style={{ marginBottom: si < act.steps.length - 1 ? 14 : 0 }}>
              {s.loc && (
                <div style={{
                  fontFamily: 'Cinzel,serif',
                  fontSize: 9,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: '#7a5f28',
                  marginBottom: 3,
                }}>📍 {s.loc}</div>
              )}
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#e8dcc8',
                marginBottom: 4,
              }}>{s.title}</div>
              <p style={{ fontSize: 13.5, marginBottom: 0 }}>{s.desc}</p>

              {/* Dialogues */}
              {s.dialogues && (
                <div style={{ marginTop: 8 }}>
                  {s.dialogues.map((d, di) => (
                    <div key={di} className="dialogue-block">
                      <div className="dialogue-line">«{d.line}»</div>
                      <div className={`dialogue-effect eff-${d.effect}`}>{d.effLabel}</div>
                    </div>
                  ))}
                </div>
              )}
              {s.avoid && (
                <div className="note warn" style={{ marginTop: 8 }}>
                  ⚠ {s.avoid}
                </div>
              )}

              {si < act.steps.length - 1 && (
                <div style={{ borderBottom: '1px solid rgba(42,25,28,.5)', marginTop: 12 }} />
              )}
            </div>
          ))}
        </Accordion>
      ))}

      {/* Lost companion note */}
      {companion.status === 'lost' && (
        <div className="note danger">
          💔 Этот персонаж <strong>недоступен</strong> при нашем пути. Уничтожение Рощи — его красная линия. Романс невозможен.
        </div>
      )}
    </>
  )
}
