import { useState } from 'react'
import { COMPANION_CHECKLIST, PARTY_SUMMARY, PARTY_TIPS, RESPEC_GUIDE, EVIL_QUESTS } from '../data/party'
import { haptic } from '../telegram'

const TABS = [
  { id: 'checklist', label: '👥 Чеклист' },
  { id: 'respec',    label: '🔄 Respec' },
  { id: 'evil',      label: '🩸 Злые квесты' },
]

const STATUS_CFG = {
  join:    { label: 'Нанять',    bg: 'rgba(224,48,96,.12)',  border: 'rgba(224,48,96,.3)',  text: '#e03060' },
  easy:    { label: 'Легко',     bg: 'rgba(106,191,105,.1)', border: 'rgba(106,191,105,.3)', text: '#6abf69' },
  careful: { label: 'Осторожно', bg: 'rgba(212,137,42,.1)',  border: 'rgba(212,137,42,.3)', text: '#d4892a' },
  limited: { label: 'Ограничен', bg: 'rgba(106,184,212,.1)', border: 'rgba(106,184,212,.3)', text: '#6ab8d4' },
  lost:    { label: 'Потерян',   bg: 'rgba(60,60,60,.15)',   border: 'rgba(80,80,80,.3)',  text: '#777' },
}
const RISK_CFG = {
  none: null,
  act1: { label: 'Риск: Акт 1', color: '#d4892a' },
  act2: { label: 'Риск: Акт 2', color: '#c9a84c' },
  act3: { label: 'Риск: Акт 3', color: '#6ab8d4' },
}

const SEVERITY_CFG = {
  critical: { color: '#c42040', label: 'Критично' },
  high:     { color: '#d4892a', label: 'Важно' },
  medium:   { color: '#c9a84c', label: 'Средне' },
}

function CompanionCard({ comp, isOpen, onToggle }) {
  const sc = STATUS_CFG[comp.status]
  const risk = RISK_CFG[comp.risk]
  return (
    <div style={{
      background: isOpen
        ? `linear-gradient(135deg, ${comp.color}0e, rgba(8,5,10,.95))`
        : 'rgba(14,10,14,.8)',
      border: `1px solid ${isOpen ? comp.color + '44' : 'rgba(42,25,28,.65)'}`,
      borderRadius: 8, marginBottom: 8,
      transition: 'background .2s, border-color .2s',
      opacity: comp.status === 'lost' ? 0.6 : 1,
    }}>
      <div onClick={() => { haptic('light'); onToggle() }} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px',
        cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${comp.color}40, rgba(8,5,10,.8))`,
          border: `1.5px solid ${comp.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{comp.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8dcc8' }}>{comp.name}</span>
            <span style={{
              padding: '2px 8px', background: sc.bg, border: `1px solid ${sc.border}`,
              borderRadius: 10, fontSize: 8.5, fontFamily: 'Cinzel,serif',
              letterSpacing: .8, textTransform: 'uppercase', color: sc.text,
            }}>{sc.label}</span>
            {risk && (
              <span style={{
                padding: '2px 7px', background: 'transparent',
                border: `1px solid ${risk.color}55`, borderRadius: 10,
                fontSize: 8, fontFamily: 'Cinzel,serif', color: risk.color + 'cc',
              }}>⚠ {risk.label}</span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: '#6a5a5a' }}>
            {comp.steps.length} шагов · Акт {comp.act}+
          </div>
        </div>
        <span style={{
          color: '#7a5f28', fontSize: 10, flexShrink: 0,
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform .22s ease',
        }}>▼</span>
      </div>

      <div style={{ maxHeight: isOpen ? 2000 : 0, overflow: 'hidden', transition: 'max-height .35s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ padding: '0 15px 14px' }}>
          <div style={{ height: 1, background: `linear-gradient(90deg, ${comp.color}33, transparent)`, marginBottom: 12 }} />
          {comp.steps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10,
              marginBottom: i < comp.steps.length - 1 ? 12 : 0,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                  background: step.critical ? comp.color : '#3a2a2a',
                  border: `1.5px solid ${step.critical ? comp.color : '#4a3a3a'}`,
                  flexShrink: 0,
                  boxShadow: step.critical ? `0 0 6px ${comp.color}88` : 'none',
                }} />
                {i < comp.steps.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 16, background: 'rgba(42,25,28,.5)', margin: '3px 0' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 2 }}>
                <div style={{
                  fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 1.5,
                  textTransform: 'uppercase', color: '#7a5f28', marginBottom: 4,
                }}>📍 {step.when}</div>
                <div style={{ fontSize: 13.5, color: '#c8b89a', lineHeight: 1.55, marginBottom: step.criticalNote ? 6 : 0 }}>
                  {step.action}
                </div>
                {step.criticalNote && (
                  <div style={{
                    padding: '6px 10px',
                    background: step.critical ? `${comp.color}12` : 'rgba(8,5,10,.4)',
                    border: `1px solid ${step.critical ? comp.color + '44' : 'rgba(42,25,28,.5)'}`,
                    borderRadius: 4, fontSize: 12,
                    color: step.critical ? comp.color + 'dd' : '#8a7a6a', lineHeight: 1.45,
                  }}>
                    {step.critical ? '⚡ ' : 'ℹ '}{step.criticalNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RespecCard({ r }) {
  const priorityColors = {
    critical: '#c42040', high: '#d4892a', medium: '#c9a84c', low: '#8a7a6a',
  }
  const color = priorityColors[r.priority] || '#8a7a6a'
  return (
    <div className="card" style={{ marginBottom: 10, borderColor: color + '33' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{r.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8dcc8', marginBottom: 2 }}>{r.name}</div>
          <span className="badge" style={{ color, borderColor: color + '55', background: color + '12', fontSize: 8 }}>
            {r.priority === 'critical' ? '★ КРИТИЧНО' : r.priority === 'high' ? '★ ВАЖНО' : r.priority === 'medium' ? '⬡ СРЕДНЕ' : '○ НИЗКО'}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#7a5f28', marginBottom: 6 }}>🕐 {r.when}</div>
      <div style={{
        padding: '7px 10px', borderRadius: 5, marginBottom: 8,
        background: 'rgba(201,168,76,.08)',
        border: '1px solid rgba(201,168,76,.2)',
        fontFamily: 'Cinzel,serif', fontSize: 11, color: '#c9a84c',
      }}>→ {r.targetClass}</div>
      <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.45, marginBottom: 6 }}>{r.reason}</div>
      <div style={{
        fontSize: 12, color: '#8a9a7a',
        padding: '6px 10px', borderRadius: 4,
        background: 'rgba(106,191,105,.07)',
        border: '1px solid rgba(106,191,105,.15)',
      }}>
        📊 Статы: {r.startStats}
      </div>
    </div>
  )
}

function EvilQuestsSection() {
  return (
    <>
      <div className="note warn" style={{ marginBottom: 12, fontSize: 13 }}>
        ⚡ Правило: на явно злые квесты берёшь Минтара + Астарион + Лаэзель. Остальных — в лагерь.
      </div>
      {EVIL_QUESTS.map(actData => (
        <div key={actData.act} style={{ marginBottom: 16 }}>
          <div className="section-label">{actData.title}</div>
          {actData.quests.map((q, qi) => {
            const sev = SEVERITY_CFG[q.severity] || SEVERITY_CFG.medium
            return (
              <div key={qi} className="card" style={{ marginBottom: 8, borderColor: sev.color + '33' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: '#e8dcc8', flex: 1 }}>{q.name}</span>
                  <span className="badge" style={{ color: sev.color, borderColor: sev.color + '55', background: sev.color + '12', fontSize: 8 }}>
                    {sev.label}
                  </span>
                </div>
                {q.leave && (
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: '#c42040', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>⬡ В лагерь: </span>
                    <span style={{ fontSize: 12, color: '#c8b89a' }}>{q.leave.join(', ')}</span>
                  </div>
                )}
                {q.take && (
                  <div style={{ marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: '#6abf69', fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>★ Брать: </span>
                    <span style={{ fontSize: 12, color: '#c8b89a' }}>{q.take.join(', ')}</span>
                  </div>
                )}
                {q.note && (
                  <div style={{
                    fontSize: 12, color: '#8a7a6a', lineHeight: 1.45,
                    padding: '6px 10px', borderRadius: 4,
                    background: 'rgba(10,6,14,.4)',
                    border: '1px solid rgba(42,25,28,.4)',
                  }}>
                    ℹ {q.note}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </>
  )
}

export default function PartyPage() {
  const [openId, setOpenId] = useState('minthara')
  const [showTips, setShowTips] = useState(false)
  const [tab, setTab] = useState('checklist')

  return (
    <>
      <div className="page-header">
        <h1>Удержать отряд</h1>
        <p>7 из 8 компаньонов · Полиамория · Respec</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px',
            background: tab === t.id ? 'rgba(201,168,76,.15)' : 'rgba(14,10,14,.7)',
            border: `1px solid ${tab === t.id ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
            borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: .8,
            color: tab === t.id ? '#e8c97a' : '#8a7a6a',
            WebkitTapHighlightColor: 'transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'checklist' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <div style={{
              flex: 1, padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(106,191,105,.1), rgba(8,5,10,.8))',
              border: '1px solid rgba(106,191,105,.25)',
              borderRadius: 7, textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, color: '#6abf69', lineHeight: 1 }}>{PARTY_SUMMARY.max}</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: '#6abf69', letterSpacing: 1.5, marginTop: 4 }}>СОПАРТИЙЦЕВ</div>
              <div style={{ fontSize: 11, color: '#8a7a6a', marginTop: 3 }}>максимум на нашем пути</div>
            </div>
            <div style={{
              flex: 1, padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(196,32,64,.1), rgba(8,5,10,.8))',
              border: '1px solid rgba(196,32,64,.25)',
              borderRadius: 7, textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 28, color: '#c42040', lineHeight: 1 }}>{PARTY_SUMMARY.lost}</div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, color: '#c42040', letterSpacing: 1.5, marginTop: 4 }}>ПОТЕРЯ</div>
              <div style={{ fontSize: 11, color: '#8a7a6a', marginTop: 3 }}>{PARTY_SUMMARY.lostName} — неизбежно</div>
            </div>
          </div>

          <button onClick={() => { haptic('light'); setShowTips(s => !s) }} style={{
            width: '100%', padding: '10px 14px', marginBottom: 14,
            background: showTips ? 'rgba(201,168,76,.12)' : 'rgba(14,10,14,.7)',
            border: `1px solid ${showTips ? 'rgba(201,168,76,.4)' : 'rgba(42,25,28,.7)'}`,
            borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a84c' }}>
              💡 Общие советы по одобрению
            </span>
            <span style={{ color: '#7a5f28', fontSize: 10, transform: showTips ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
          </button>

          {showTips && (
            <div style={{ marginBottom: 14 }}>
              {PARTY_TIPS.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 11, padding: '10px 13px',
                  background: 'rgba(10,6,14,.6)', border: '1px solid rgba(42,25,28,.5)',
                  borderRadius: 6, marginBottom: 6,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#c9a84c', marginBottom: 3 }}>{t.title}</div>
                    <div style={{ fontSize: 13, color: '#a89878', lineHeight: 1.55 }}>{t.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-label">Все сопартийцы</div>
          {COMPANION_CHECKLIST.map(comp => (
            <CompanionCard
              key={comp.id} comp={comp}
              isOpen={openId === comp.id}
              onToggle={() => setOpenId(prev => prev === comp.id ? null : comp.id)}
            />
          ))}
        </>
      )}

      {tab === 'respec' && (
        <>
          <div className="note" style={{ marginBottom: 14, fontSize: 13 }}>
            🔄 Withers (скелет в лагере) делает полный respec за 100 золота. Оптимальный момент — начало Акта 2 или после получения компаньона.
          </div>
          <div className="section-label">Приоритеты respec</div>
          {RESPEC_GUIDE.map(r => <RespecCard key={r.id} r={r} />)}
        </>
      )}

      {tab === 'evil' && <EvilQuestsSection />}
    </>
  )
}
