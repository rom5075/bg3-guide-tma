import { useState } from 'react'
import { POTIONS, PRIORITY_LABELS } from '../data/equipment'
import Accordion from '../components/Accordion'

const FILTER_TABS = [
  { id: 'all', label: 'Все' },
  { id: 'S',   label: 'S-tier' },
  { id: 'A',   label: 'A-tier' },
  { id: 'B',   label: 'B-tier' },
]

export default function PotionsPage() {
  const [filter, setFilter] = useState('all')
  const shown = filter === 'all' ? POTIONS : POTIONS.filter(p => p.priority === filter)

  return (
    <>
      <div className="page-header">
        <h1>Зелья и расходники</h1>
        <p>Лучшие расходники — с рецептами алхимии</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(PRIORITY_LABELS).map(([tier, cfg]) => (
          <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: cfg.bg, border: `1px solid ${cfg.color}55`, borderRadius: 4 }}>
            <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: 12, color: cfg.color }}>{tier}</span>
            <span style={{ fontSize: 11, color: '#8a7a6a' }}>
              {tier === 'S' ? 'обязателен' : tier === 'A' ? 'очень важен' : 'полезен'}
            </span>
          </div>
        ))}
      </div>

      <div className="act-tabs">
        {FILTER_TABS.map(t => (
          <button key={t.id} className={`act-tab${filter === t.id ? ' active' : ''}`} onClick={() => setFilter(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="note" style={{ marginBottom: 14 }}>
        💡 Открой Alchemy в инвентаре (кнопка колбы). Большинство расходников можно скрафтить. Покупай ингредиенты у торговцев и Guex.
      </div>

      {shown.map((p, i) => {
        const prCfg = PRIORITY_LABELS[p.priority]
        return (
          <div key={i} className="potion-card" style={{ borderColor: p.priority === 'S' ? 'rgba(232,201,122,.35)' : 'rgba(42,25,28,.7)' }}>
            <div className="potion-ico">{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <div className="potion-name">{p.name}</div>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: prCfg.bg, border: `1px solid ${prCfg.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cinzel,serif', fontSize: 9, fontWeight: 700, color: prCfg.color, flexShrink: 0 }}>{p.priority}</div>
                <span className="badge b-grey" style={{ fontSize: 8.5 }}>{p.type}</span>
              </div>
              <div className="potion-effect">{p.effect}</div>
              <div className="potion-craft">🧪 {p.craft}</div>
              <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(201,168,76,.06)', borderRadius: 4, fontSize: 12.5, color: '#a89060', lineHeight: 1.45 }}>💡 {p.tip}</div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: '#c42040', fontFamily: 'Cinzel,serif', letterSpacing: 0.5 }}>📦 {p.hotkeyTip}</div>
              {p.bestFor && <div style={{ marginTop: 4, fontSize: 12, color: '#6abf69', fontStyle: 'italic' }}>🎯 {p.bestFor}</div>}
            </div>
          </div>
        )
      })}

      <div style={{ height: 16 }} />
      <Accordion icon="⚗️" title="Быстрый гайд по алхимии">
        <ul className="step-list">
          {[
            { title: 'Открой Alchemy', desc: 'Инвентарь → кнопка колбы сверху. Или нажми "Manage Items".' },
            { title: 'Собирай ингредиенты', desc: 'Каждый цветок, гриб, кость и гланда — алхимический ингредиент. Исследуй все.' },
            { title: 'Suspension = основа', desc: 'Suspension of X — базовый растворитель для 90% рецептов. Крафтится из Thin Oil.' },
            { title: 'Vitriol = эссенция', desc: 'Vitriol of X — концентрат ингредиента. Крафтится из 3х одинаковых компонентов.' },
            { title: 'Приоритеты крафта', desc: 'Haste (Speed) → Animal Speaking → Flying → Healing. В этом порядке.' },
          ].map((s, i) => (
            <li key={i} className="step-item">
              <div className="step-num">{i + 1}</div>
              <div className="step-content">
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </Accordion>
    </>
  )
}
