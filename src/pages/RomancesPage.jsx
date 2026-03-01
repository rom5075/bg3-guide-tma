import { useState } from 'react'
import Accordion from '../components/Accordion.jsx'
import { ROMANCES, ROMANCE_ORDER, POLYAMORY } from '../data/romances.js'

const STATUS_COLORS = {
  primary:   '#e03060',
  available: '#6abf69',
  hard:      '#d4892a',
  lost:      '#555',
}

const TABS = [
  { id: 'romances', label: '❤️ Романы' },
  { id: 'poly',     label: '🔥 Полиамория' },
]

function DialogueBlock({ dialogues }) {
  if (!dialogues?.length) return null
  return (
    <div style={{ marginTop: 8 }}>
      {dialogues.map((d, i) => (
        <div key={i} className="dialogue-block">
          <div className="dialogue-line">«{d.line}»</div>
          <div className={`dialogue-effect eff-${d.effect}`}>
            {d.effect === 'key' ? '🔑' : d.effect === 'approval' ? '▲' : d.effect === 'warning' ? '⚠' : '✗'} {d.effLabel}
          </div>
        </div>
      ))}
    </div>
  )
}

function RomanceStep({ step, num }) {
  return (
    <div className="step-item">
      <div className="step-num">{num}</div>
      <div className="step-content">
        {step.loc && <div className="step-loc">📍 {step.loc}</div>}
        <div className="step-title">{step.title}</div>
        <div className="step-desc">{step.desc}</div>
        <DialogueBlock dialogues={step.dialogues} />
        {step.avoid && (
          <div className="note danger" style={{ marginTop: 8 }}>⚠ {step.avoid}</div>
        )}
      </div>
    </div>
  )
}

function ApprovalSection({ loves, hates }) {
  if (!loves?.length && !hates?.length) return null
  return (
    <div style={{ marginBottom: 12 }}>
      {loves?.length > 0 && (
        <>
          <div className="section-label" style={{ marginBottom: 8 }}>❤️ Что одобряет</div>
          <ul className="approval-list">
            {loves.map((item, i) => (
              <li key={i} className="approval-item">
                <span className="ico">{item.ico}</span><span>{item.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {hates?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div className="section-label" style={{ marginBottom: 8 }}>💔 Что ненавидит</div>
          <ul className="approval-list">
            {hates.map((item, i) => (
              <li key={i} className="approval-item" style={{ color: '#c06060' }}>
                <span className="ico">{item.ico}</span><span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CompanionCard({ comp }) {
  const statusColor = STATUS_COLORS[comp.status] || '#666'
  return (
    <div className="card" style={{ marginBottom: 12, borderColor: statusColor + '33' }}>
      <div className="comp-header">
        <div className="comp-avatar"><span style={{ fontSize: 26 }}>{comp.emoji}</span></div>
        <div className="comp-info">
          <div className="comp-name">{comp.name}</div>
          <div className="comp-subtitle">{comp.class}</div>
        </div>
        <span className="badge" style={{
          color: statusColor, borderColor: statusColor + '66',
          background: statusColor + '15', fontSize: 9,
        }}>{comp.statusLabel}</span>
      </div>

      <div className="note" style={{ marginBottom: 10, fontSize: 13 }}>🗺 {comp.path_note}</div>

      {comp.dark_urge_bonus && (
        <div className="note warn" style={{ marginBottom: 10, fontSize: 13 }}>
          🩸 Dark Urge: {comp.dark_urge_bonus}
        </div>
      )}

      {(comp.approval_loves?.length > 0 || comp.approval_hates?.length > 0) && (
        <Accordion title="Одобрение" icon="💬" accentColor="#c9a84c">
          <ApprovalSection loves={comp.approval_loves} hates={comp.approval_hates} />
        </Accordion>
      )}

      {comp.acts?.map(act => (
        <Accordion
          key={act.act}
          title={act.title}
          icon={act.act === 1 ? '1️⃣' : act.act === 2 ? '2️⃣' : '3️⃣'}
          accentColor={statusColor}
          defaultOpen={act.act === 1 && comp.status !== 'lost'}
        >
          <ul className="step-list">
            {act.steps.map((step, idx) => (
              <RomanceStep key={idx} step={step} num={idx + 1} />
            ))}
          </ul>
        </Accordion>
      ))}
    </div>
  )
}

function PolyActCard({ actData }) {
  const actColors = ['#e03060', '#c9a84c', '#6ab8d4']
  const color = actColors[actData.act - 1] || '#8a7a6a'

  return (
    <div className="card" style={{ marginBottom: 12, borderColor: color + '33' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: color + '20', border: `1.5px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Cinzel,serif', fontSize: 12, color,
        }}>{actData.act}</div>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: '#e8dcc8' }}>{actData.title}</div>
      </div>

      {actData.warning && (
        <div className="note danger" style={{ marginBottom: 10, fontSize: 12 }}>⚠ {actData.warning}</div>
      )}

      {actData.summary && (
        <div style={{ fontSize: 13, color: '#a89878', lineHeight: 1.5, marginBottom: 12 }}>{actData.summary}</div>
      )}

      {/* Companions per act */}
      {actData.companions?.map((comp, ci) => (
        <div key={ci} style={{
          padding: '10px 12px',
          background: 'rgba(10,6,14,.5)',
          border: '1px solid rgba(42,25,28,.5)',
          borderRadius: 6, marginBottom: 8,
        }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#e8c97a', marginBottom: 5 }}>
            {comp.emoji} {comp.name}
          </div>
          {comp.trigger && (
            <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.45, marginBottom: comp.jealousyLine ? 8 : 0 }}>
              {comp.trigger}
            </div>
          )}
          {comp.jealousyLine && (
            <div style={{
              padding: '7px 10px', borderRadius: 5, marginBottom: 8,
              background: 'rgba(196,32,64,.1)', border: '1px solid rgba(196,32,64,.25)',
              fontSize: 12, color: '#e07070', fontStyle: 'italic',
            }}>
              «{comp.jealousyLine}»
            </div>
          )}
          {comp.dialogues?.map((d, di) => (
            <div key={di} style={{
              padding: '6px 10px', borderRadius: 5, marginBottom: 5,
              background: 'rgba(14,10,14,.6)',
              border: `1px solid rgba(42,25,28,.${di === 0 ? '9' : '5'})`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span style={{
                fontSize: 10, color: '#6abf69', flexShrink: 0, marginTop: 1,
                fontFamily: 'Cinzel,serif',
              }}>{d.rating}</span>
              <div>
                <div style={{ fontSize: 13, color: '#e8dcc8', lineHeight: 1.4 }}>«{d.line}»</div>
                {d.note && (
                  <div style={{ fontSize: 11, color: '#8a7a6a', marginTop: 2 }}>{d.note}</div>
                )}
              </div>
            </div>
          ))}
          {comp.resolution && (
            <div style={{ fontSize: 12, color: '#6abf69', marginTop: 4, fontStyle: 'italic' }}>
              ✓ {comp.resolution}
            </div>
          )}
          {comp.finalLine && (
            <div style={{
              fontSize: 13, color: '#e8c97a', fontStyle: 'italic',
              padding: '7px 10px',
              background: 'rgba(201,168,76,.08)',
              border: '1px solid rgba(201,168,76,.2)',
              borderRadius: 5,
            }}>«{comp.finalLine}»</div>
          )}
        </div>
      ))}

      {/* Group scene */}
      {actData.groupScene && (
        <div style={{
          padding: '12px 14px',
          background: 'linear-gradient(135deg, rgba(224,48,96,.12), rgba(123,63,160,.08))',
          border: '1px solid rgba(224,48,96,.3)',
          borderRadius: 7, marginTop: 8,
        }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: '#e03060', marginBottom: 8 }}>
            {actData.groupScene.title}
          </div>
          <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5, marginBottom: 6 }}>
            📍 {actData.groupScene.location}
          </div>
          <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5, marginBottom: 6 }}>
            ▸ {actData.groupScene.how}
          </div>
          <div style={{ fontSize: 12, color: '#8a9a7a', fontStyle: 'italic' }}>
            ℹ {actData.groupScene.condition}
          </div>
        </div>
      )}

      {actData.epilogue && (
        <div className="note" style={{ marginTop: 10, borderColor: 'rgba(201,168,76,.3)', fontSize: 12 }}>
          ✨ {actData.epilogue}
        </div>
      )}

      {actData.note && (
        <div style={{ fontSize: 12, color: '#8a7a6a', marginTop: 8, fontStyle: 'italic' }}>
          ℹ {actData.note}
        </div>
      )}
    </div>
  )
}

export default function RomancesPage() {
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('romances')

  const filters = [
    { id: 'all',       label: 'Все' },
    { id: 'primary',   label: 'Основные' },
    { id: 'available', label: 'Доступны' },
    { id: 'hard',      label: 'Сложно' },
    { id: 'lost',      label: 'Недоступны' },
  ]

  const visible = ROMANCE_ORDER
    .map(id => ROMANCES.find(r => r.id === id))
    .filter(Boolean)
    .filter(r => filter === 'all' || r.status === filter)

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>❤️ Романы</h1>
        <p>Все персонажи · Полиамория · Minthara focus</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '9px 4px',
            background: tab === t.id ? 'rgba(201,168,76,.15)' : 'rgba(14,10,14,.7)',
            border: `1px solid ${tab === t.id ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
            borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 1,
            color: tab === t.id ? '#e8c97a' : '#8a7a6a',
            WebkitTapHighlightColor: 'transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'romances' && (
        <>
          <div className="dark-banner" data-emoji="♟">
            <div className="db-title">Dark Urge & Minthara</div>
            <div className="db-sub">СТРАТЕГИЯ РОМАНОВ</div>
            <div className="db-text">
              Приоритет: Минтара (Акт 1) → Шэдоухарт (Акт 2) → Астарион (Акт 1).
              Вилл уходит при уничтожении Рощи — неизбежно.
              Nightsong НЕ убиваем — условие для романа Шэдоухарт.
            </div>
          </div>

          <div className="scroll-x" style={{ marginBottom: 14, padding: '0 0 4px' }}>
            {filters.map(f => (
              <div key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '7px 14px', borderRadius: 4,
                fontSize: 12, fontFamily: 'Cinzel, serif', letterSpacing: '1px',
                textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap',
                border: '1px solid',
                borderColor: filter === f.id ? 'rgba(201,168,76,.5)' : 'rgba(42,25,28,.7)',
                background: filter === f.id ? 'rgba(201,168,76,.1)' : 'rgba(10,6,10,.6)',
                color: filter === f.id ? '#e8c97a' : '#8a7a6a',
                transition: 'all .2s ease',
                WebkitTapHighlightColor: 'transparent',
              }}>{f.label}</div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 14, fontStyle: 'italic' }}>
            Показано: {visible.length} из {ROMANCES.length} персонажей
          </div>

          {visible.map(comp => <CompanionCard key={comp.id} comp={comp} />)}
        </>
      )}

      {tab === 'poly' && (
        <>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, rgba(224,48,96,.15), rgba(123,63,160,.1))',
            border: '1px solid rgba(224,48,96,.3)',
            borderRadius: 8, marginBottom: 16,
          }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 14, color: '#e03060', marginBottom: 6 }}>
              🔥 {POLYAMORY.title}
            </div>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#c9a84c', marginBottom: 8 }}>
              {POLYAMORY.subtitle}
            </div>
            <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5 }}>{POLYAMORY.concept}</div>
          </div>

          {/* Why this trio */}
          <Accordion icon="❓" title="Почему именно эта тройка" defaultOpen>
            <ul className="approval-list">
              {POLYAMORY.whyThisTrio.map((t, i) => (
                <li key={i} className="approval-item">
                  <span className="ico">◆</span><span>{t}</span>
                </li>
              ))}
            </ul>
          </Accordion>

          {/* Acts */}
          <div className="section-label">По актам</div>
          {POLYAMORY.acts.map(act => (
            <PolyActCard key={act.act} actData={act} />
          ))}

          {/* Edge cases */}
          <div className="section-label">Важные нюансы</div>
          <div className="card">
            {POLYAMORY.edgeCases.map((ec, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                paddingBottom: i < POLYAMORY.edgeCases.length - 1 ? 10 : 0,
                marginBottom: i < POLYAMORY.edgeCases.length - 1 ? 10 : 0,
                borderBottom: i < POLYAMORY.edgeCases.length - 1 ? '1px solid rgba(42,25,28,.5)' : 'none',
              }}>
                <span style={{ color: ec.warning ? '#e07070' : '#c9a84c', flexShrink: 0, marginTop: 1 }}>
                  {ec.warning ? '⚠' : 'ℹ'}
                </span>
                <span style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5 }}>{ec.text}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
