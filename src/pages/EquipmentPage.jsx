import { useState } from 'react'
import Accordion from '../components/Accordion.jsx'
import { EQUIPMENT, ARTIFACTS, AURA_SYNERGY_ITEMS, DARK_URGE_ITEMS, PRIORITY_LABELS } from '../data/equipment.js'

const PRIORITY_COLORS = {
  high:   { color: '#e03060', label: '★★★' },
  medium: { color: '#c9a84c', label: '★★' },
  low:    { color: '#8a7a6a', label: '★' },
}

const TABS = [
  { id: 'equip',   label: '🛡️ Шмот' },
  { id: 'aura',    label: '⚡ Аура-синергия' },
  { id: 'artifact',label: '💎 Артефакты' },
]

const ACT_KEYS = ['act1', 'act2', 'act3']
const ACT_LABELS = { act1: 'Акт 1', act2: 'Акт 2', act3: 'Акт 3' }

function ItemCard({ item }) {
  const pr = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.low
  return (
    <div className="item-card">
      <div className="item-icon">{item.slot}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
          <div className="item-name">{item.name}</div>
          <span style={{ fontSize: 9, color: item.rarityColor, fontFamily: 'Cinzel,serif', letterSpacing: 1 }}>
            {item.rarity}
          </span>
          <span style={{ fontSize: 11, color: pr.color, marginLeft: 'auto' }}>{pr.label}</span>
        </div>
        <div style={{ fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a5f28', marginBottom: 3 }}>
          {item.type}
        </div>
        <div className="item-where">📍 {item.where}</div>
        <div className="item-effect">{item.effect}</div>
      </div>
    </div>
  )
}

function ArtifactCard({ art }) {
  return (
    <div className={`card${art.mustHave ? ' card-red' : ''}`} style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{art.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#c9a84c' }}>{art.name}</div>
            {art.mustHave && <span className="badge b-red" style={{ fontSize: 8 }}>MUST HAVE</span>}
            {art.darkUrge && <span className="badge b-purple" style={{ fontSize: 8 }}>DARK URGE</span>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 9, fontFamily: 'Cinzel,serif', letterSpacing: 1, color: '#7a5f28' }}>{art.type}</span>
            <span style={{ fontSize: 9, color: art.rarityColor }}>· {art.rarity}</span>
            <span style={{ fontSize: 9, color: '#666' }}>· Акт {art.act}</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 6 }}>📍 {art.where}</div>
      <div style={{ fontSize: 13.5, color: '#c8bca8', lineHeight: 1.55, marginBottom: art.synergy ? 8 : 0 }}>{art.effect}</div>
      {art.synergy && (
        <div style={{
          background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)',
          borderRadius: 4, padding: '7px 10px', fontSize: 12.5, color: '#c9a84c', lineHeight: 1.5,
        }}>
          ⚡ Синергия: {art.synergy}
        </div>
      )}
    </div>
  )
}

function AuraSynergyCard({ item }) {
  const starColors = { '★★★': '#e8c97a', '★★': '#c9a84c', '★': '#8a7a6a' }
  const starColor = starColors[item.priority] || '#8a7a6a'
  return (
    <div className="card" style={{ marginBottom: 8, borderColor: starColor + '33' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8dcc8' }}>{item.name}</div>
            <span style={{ fontSize: 11, color: starColor }}>{item.priority}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 7, flexWrap: 'wrap' }}>
            <span className="badge b-ice" style={{ fontSize: 8 }}>{item.slot}</span>
            <span className="badge" style={{
              fontSize: 8, color: '#e03060', borderColor: 'rgba(224,48,96,.4)', background: 'rgba(224,48,96,.1)',
            }}>→ {item.who}</span>
            <span className="badge" style={{
              fontSize: 8, color: '#8a7a6a', borderColor: 'rgba(42,25,28,.5)',
            }}>Акт {item.act}</span>
          </div>
          <div style={{
            padding: '7px 10px', borderRadius: 5, marginBottom: 7,
            background: 'rgba(201,168,76,.08)', border: '1px solid rgba(201,168,76,.2)',
            fontSize: 13, color: '#c8b89a', lineHeight: 1.45,
          }}>
            ⚡ {item.effect}
          </div>
          <div style={{ fontSize: 11.5, color: '#7a5f28' }}>📍 {item.location}</div>
        </div>
      </div>
    </div>
  )
}

function DarkUrgeCard({ item }) {
  return (
    <div className={`card${item.mustHave ? ' card-red' : ''}`} style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#c9a84c', flex: 1 }}>{item.name}</div>
        {item.mustHave && <span className="badge b-red" style={{ fontSize: 8 }}>MUST HAVE</span>}
        <span className="badge b-purple" style={{ fontSize: 8 }}>Акт {item.act}</span>
      </div>
      <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5, marginBottom: 6 }}>{item.effect}</div>
      <div style={{ fontSize: 12, color: '#8a7a6a' }}>📍 {item.howToGet}</div>
    </div>
  )
}

export default function EquipmentPage() {
  const [tab, setTab]   = useState('equip')
  const [act, setAct]   = useState('act1')
  const [section, setSection] = useState('equipment')

  const actData = EQUIPMENT[act]

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>🛡️ Снаряжение</h1>
        <p>Аура-синергия · Dark Urge · Oathbreaker</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px',
            background: tab === t.id ? 'rgba(201,168,76,.15)' : 'rgba(14,10,14,.7)',
            border: `1px solid ${tab === t.id ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
            borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: .5,
            color: tab === t.id ? '#e8c97a' : '#8a7a6a',
            WebkitTapHighlightColor: 'transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* === ШМОТ ПО АКТАМ === */}
      {tab === 'equip' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['equipment', 'artifacts'].map(s => (
              <div key={s} onClick={() => setSection(s)} style={{
                flex: 1, padding: '9px 6px', borderRadius: 5,
                textAlign: 'center', cursor: 'pointer',
                fontFamily: 'Cinzel,serif', fontSize: 11, letterSpacing: 1,
                transition: 'all .2s ease', WebkitTapHighlightColor: 'transparent',
                border: '1px solid',
                borderColor: section === s ? 'rgba(196,32,64,.4)' : 'rgba(42,25,28,.7)',
                background: section === s ? 'rgba(122,18,37,.2)' : 'rgba(10,6,10,.6)',
                color: section === s ? '#e8dcc8' : '#8a7a6a',
              }}>
                {s === 'equipment' ? '🛡️ Экипировка' : '💎 Артефакты'}
              </div>
            ))}
          </div>

          {section === 'equipment' && (
            <>
              <div className="act-tabs">
                {ACT_KEYS.map(k => (
                  <div key={k} className={`act-tab${act === k ? ' active' : ''}`} onClick={() => setAct(k)}>
                    {ACT_LABELS[k]}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 11, color: '#8a7a6a' }}>
                <span style={{ color: '#e03060' }}>★★★ Обязательно</span>
                <span style={{ color: '#c9a84c' }}>★★ Рекомендую</span>
                <span>★ Ситуативно</span>
              </div>

              {['high', 'medium', 'low'].map(pr => {
                const items = actData?.items?.filter(i => i.priority === pr)
                if (!items?.length) return null
                const prData = PRIORITY_COLORS[pr]
                return (
                  <Accordion key={pr}
                    title={`${prData.label} — ${pr === 'high' ? 'Обязательно' : pr === 'medium' ? 'Рекомендую' : 'Ситуативно'}`}
                    meta={`${items.length} предм.`}
                    accentColor={prData.color}
                    defaultOpen={pr === 'high'}
                  >
                    {items.map((item, i) => <ItemCard key={i} item={item} />)}
                  </Accordion>
                )
              })}
            </>
          )}

          {section === 'artifacts' && (
            <>
              <div className="note" style={{ marginBottom: 14 }}>
                💡 Уникальные артефакты для Dark Urge пути — недоступны на других прохождениях
              </div>
              <Accordion title="🩸 Dark Urge эксклюзив" icon="" accentColor="#e03060" defaultOpen>
                {ARTIFACTS.filter(a => a.darkUrge).map(art => <ArtifactCard key={art.id} art={art} />)}
              </Accordion>
              <Accordion title="💎 Для Oathbreaker / Паладина" icon="" accentColor="#c9a84c" defaultOpen>
                {ARTIFACTS.filter(a => !a.darkUrge).map(art => <ArtifactCard key={art.id} art={art} />)}
              </Accordion>
            </>
          )}
        </>
      )}

      {/* === АУРА-СИНЕРГИЯ === */}
      {tab === 'aura' && (
        <>
          <div className="note warn" style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#e8c97a', marginBottom: 5 }}>
              ⚡ Двойная Aura of Hate
            </div>
            <div style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.5 }}>
              Предметы ниже максимально усиливают синергию двух Oathbreaker Paladin.
              Носи их на Протагонисте и Минтаре — каждый +CHA или +STR умножается на количество атак и аур.
            </div>
          </div>

          <div style={{
            padding: '8px 12px', borderRadius: 5, marginBottom: 16,
            background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)',
            fontFamily: 'Cinzel,serif', fontSize: 11, color: '#e8c97a', textAlign: 'center',
          }}>
            +CHA (ГГ аура) + +CHA (Минтара аура) = +8-10 к каждой атаке
          </div>

          <div className="section-label">Приоритетный шмот для аур</div>
          {AURA_SYNERGY_ITEMS.sort((a, b) => b.priority.length - a.priority.length).map((item, i) => (
            <AuraSynergyCard key={i} item={item} />
          ))}
        </>
      )}

      {/* === АРТЕФАКТЫ (отдельный таб) === */}
      {tab === 'artifact' && (
        <>
          <div className="note" style={{ marginBottom: 14, borderColor: 'rgba(123,63,160,.3)' }}>
            🩸 Dark Urge Origin открывает уникальные предметы недоступные другим Истоком.
            Все перечисленные ниже предметы — эксклюзив Dark Urge.
          </div>

          <div className="section-label">Dark Urge эксклюзив</div>
          {DARK_URGE_ITEMS.map((item, i) => <DarkUrgeCard key={i} item={item} />)}

          <div className="section-label" style={{ marginTop: 8 }}>Из общего снаряжения — выбрать для Oathbreaker</div>
          <div className="note" style={{ marginBottom: 12, fontSize: 12 }}>
            Самые важные предметы из вкладки «Аура-синергия» для переноски на Минтаре или протагонисте.
          </div>
          {AURA_SYNERGY_ITEMS.filter(i => i.priority === '★★★').map((item, i) => (
            <AuraSynergyCard key={i} item={item} />
          ))}
        </>
      )}
    </div>
  )
}
