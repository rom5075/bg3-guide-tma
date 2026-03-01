import { useState } from 'react'
import { BUILDS, TEAM_COMPOSITIONS, STRATEGY_SUMMARY } from '../data/builds'
import Accordion from '../components/Accordion'

const TABS = [
  { id: 'builds', label: '⚔️ Билды' },
  { id: 'team',   label: '🛡️ Команда' },
]

export default function BuildsPage() {
  const [active, setActive]   = useState('protagonist')
  const [tab, setTab]         = useState('builds')
  const build = BUILDS.find(b => b.id === active)

  return (
    <>
      <div className="page-header">
        <h1>Билды</h1>
        <p>Oathbreaker Paladin 12 · Двойная Aura of Hate</p>
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

      {tab === 'builds' && (
        <>
          {/* Character selector */}
          <div className="section-label">Персонаж</div>
          <div className="scroll-x" style={{ marginBottom: 16 }}>
            {BUILDS.map(b => (
              <button key={b.id} onClick={() => setActive(b.id)} style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 5, padding: '10px 12px',
                background: active === b.id ? b.bgGradient : 'rgba(14,10,14,.7)',
                border: `1px solid ${active === b.id ? b.color + '88' : 'rgba(42,25,28,.7)'}`,
                borderRadius: 6, cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent', minWidth: 68,
              }}>
                <span style={{ fontSize: 22 }}>{b.emoji}</span>
                <span style={{
                  fontFamily: 'Cinzel,serif', fontSize: 8.5, letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: active === b.id ? '#e8dcc8' : '#8a7a6a',
                  textAlign: 'center', lineHeight: 1.3,
                }}>{b.name}</span>
              </button>
            ))}
          </div>

          {/* Build header */}
          <div className="build-header" style={{ background: build.bgGradient, borderColor: build.color + '55' }}>
            <div className="build-avatar" style={{ background: build.bgGradient, borderColor: build.color }}>
              {build.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div className="build-name">{build.name}</div>
              <div className="build-class" style={{ color: build.color }}>{build.class}</div>
              <div style={{ fontSize: 11, color: '#8a7a6a', marginBottom: 5 }}>{build.race}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="badge b-gold">{build.subclass}</span>
                <span className="badge b-ice">{build.role}</span>
              </div>
            </div>
          </div>

          <div className="note" style={{ marginBottom: 8 }}>{build.summary}</div>

          {/* Synergy note */}
          {build.synergyNote && (
            <div className="note warn" style={{ marginBottom: 12, borderColor: 'rgba(201,168,76,.3)' }}>
              {build.synergyNote}
            </div>
          )}

          {/* Stats */}
          <Accordion icon="📊" title="Стартовые статы" defaultOpen>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {build.stats.map((s, i) => (
                <div key={i} style={{
                  background: s.highlight ? 'rgba(201,168,76,.1)' : 'rgba(10,6,10,.5)',
                  border: `1px solid ${s.highlight ? 'rgba(201,168,76,.3)' : 'rgba(42,25,28,.5)'}`,
                  borderRadius: 5, padding: '8px 10px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 2, color: '#8a7a6a', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 20, color: s.highlight ? '#e8c97a' : '#e8dcc8', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#7a5f28', marginTop: 2 }}>{s.note}</div>
                </div>
              ))}
            </div>
            <div className="section-label" style={{ marginTop: 0 }}>Ключевые показатели</div>
            {build.keyStats.map((s, i) => (
              <div key={i} className="stat-row">
                <span className="label">{s.label}</span>
                <span className="value">{s.value}</span>
              </div>
            ))}
          </Accordion>

          {/* Level plan */}
          <Accordion icon="📈" title="План прокачки" meta="по уровням">
            <ul className="step-list">
              {build.levelPlan.map((lp, i) => (
                <li key={i} className="step-item">
                  <div className="step-num" style={{
                    background: 'transparent',
                    border: '1px solid rgba(201,168,76,.35)',
                    color: '#c9a84c',
                    fontSize: 8, width: 30, height: 30, flexShrink: 0,
                    fontFamily: 'Cinzel,serif',
                  }}>{lp.level}</div>
                  <div className="step-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span className="badge b-purple" style={{ fontSize: 9 }}>{lp.class}</span>
                    </div>
                    <div className="step-desc">{lp.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Accordion>

          {/* Feats & spells */}
          <Accordion icon="🏆" title="Черты и заклинания">
            <div className="section-label" style={{ marginTop: 0 }}>Черты</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {build.feats.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: 'rgba(201,168,76,.07)',
                  border: '1px solid rgba(201,168,76,.2)',
                  borderRadius: 5, fontSize: 13.5, color: '#e8dcc8',
                }}>
                  <span style={{ color: '#c9a84c' }}>◆</span>{f}
                </div>
              ))}
            </div>
            {build.keySpells?.length > 0 && (
              <>
                <div className="section-label">Ключевые заклинания / способности</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {build.keySpells.map((sp, i) => (
                    <div key={i} style={{
                      padding: '7px 11px', borderRadius: 5,
                      background: 'rgba(123,63,160,.08)',
                      border: '1px solid rgba(123,63,160,.22)',
                      fontSize: 13, color: '#c8b4e0', lineHeight: 1.4,
                    }}>
                      {sp}
                    </div>
                  ))}
                </div>
              </>
            )}
            {build.skills?.length > 0 && (
              <>
                <div className="section-label" style={{ marginTop: 14 }}>Навыки</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {build.skills.map((sk, i) => (
                    <span key={i} className="badge b-ice">{sk}</span>
                  ))}
                </div>
              </>
            )}
          </Accordion>

          {/* Playstyle */}
          <Accordion icon="💡" title="Стиль игры">
            <ul className="approval-list">
              {build.playstyle.map((t, i) => (
                <li key={i} className="approval-item">
                  <span className="ico">▸</span><span>{t}</span>
                </li>
              ))}
            </ul>
            {build.respecNote && (
              <div className="note" style={{ marginTop: 10, borderColor: 'rgba(106,184,212,.3)', color: '#6ab8d4' }}>
                🔄 Respec: {build.respecNote}
              </div>
            )}
            {build.orbNote && (
              <div className="note danger" style={{ marginTop: 10 }}>
                ⚠ {build.orbNote}
              </div>
            )}
            {build.whyThisBuild && (
              <div className="note" style={{ marginTop: 10 }}>
                ℹ {build.whyThisBuild}
              </div>
            )}
          </Accordion>
        </>
      )}

      {tab === 'team' && (
        <>
          {/* Strategy summary */}
          <div className="note warn" style={{ marginBottom: 16, padding: '13px 14px' }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#e8c97a', marginBottom: 6 }}>
              ⚡ {STRATEGY_SUMMARY.title}
            </div>
            <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5, marginBottom: 8 }}>
              {STRATEGY_SUMMARY.description}
            </div>
            <div style={{
              padding: '8px 12px',
              background: 'rgba(201,168,76,.1)',
              border: '1px solid rgba(201,168,76,.25)',
              borderRadius: 5,
              fontFamily: 'Cinzel,serif', fontSize: 11, color: '#e8c97a',
              textAlign: 'center',
            }}>
              {STRATEGY_SUMMARY.formula}
            </div>
          </div>

          <div className="note" style={{ marginBottom: 16, fontSize: 12, borderColor: 'rgba(106,191,105,.25)', color: '#a8c89a' }}>
            🧪 {STRATEGY_SUMMARY.cloudGiantNote}
          </div>

          {/* Compositions */}
          <div className="section-label">Составы отряда</div>
          {TEAM_COMPOSITIONS.map(tc => (
            <div key={tc.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: 12, color: '#e8c97a', marginBottom: 8 }}>
                {tc.title}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {tc.members.map((m, i) => (
                  <span key={i} className="badge b-gold">{m}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5, marginBottom: 6 }}>
                {tc.strategy}
              </div>
              <div style={{
                fontSize: 12, color: '#8abf6a',
                padding: '6px 10px',
                background: 'rgba(106,191,105,.07)',
                border: '1px solid rgba(106,191,105,.2)',
                borderRadius: 4,
              }}>
                ★ {tc.synergy}
              </div>
            </div>
          ))}

          {/* Combat order */}
          <div className="section-label" style={{ marginTop: 8 }}>Порядок хода в бою</div>
          <div className="card">
            {[
              { n: '1', who: 'Шэдоухарт', action: 'Twinned Haste на Протагониста + Минтару' },
              { n: '2', who: 'Протагонист', action: 'Bless на себя + Минтару + Лаэзель → GWM-атаки → Divine Smite на критах' },
              { n: '3', who: 'Минтара', action: 'GWM-атаки + Divine Smite → Animate Dead на убитых врагов' },
              { n: '4', who: 'Лаэзель', action: 'Trip Attack → сбивает цель → advantage для всех → GWM-атаки' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                paddingBottom: i < 3 ? 10 : 0,
                marginBottom: i < 3 ? 10 : 0,
                borderBottom: i < 3 ? '1px solid rgba(42,25,28,.5)' : 'none',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(201,168,76,.15)',
                  border: '1px solid rgba(201,168,76,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Cinzel,serif', fontSize: 11, color: '#c9a84c',
                }}>{step.n}</div>
                <div>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 10, color: '#e8c97a', marginBottom: 3 }}>
                    {step.who}
                  </div>
                  <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.45 }}>{step.action}</div>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: '8px 12px',
              background: 'rgba(201,168,76,.08)',
              border: '1px solid rgba(201,168,76,.2)',
              borderRadius: 5, fontSize: 13, color: '#c9a84c', lineHeight: 1.45,
            }}>
              ★ Результат: Двойная Aura of Hate усиливает каждую melee-атаку на +8-10. Haste удваивает действия двух паладинов. Нежить армия получает бонус обеих аур.
            </div>
          </div>
        </>
      )}
    </>
  )
}
