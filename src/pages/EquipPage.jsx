import { useState } from 'react'
import { EQUIPMENT, ARTIFACTS } from '../data/equipment'
import Accordion from '../components/Accordion'

const RARITY_ORDER = ['Легендарный', 'Редкий', 'Необычный', 'Обычный']

export default function EquipPage() {
  const [actTab, setActTab] = useState('act1')

  const acts = [
    { id: 'act1', label: 'Акт 1' },
    { id: 'act2', label: 'Акт 2' },
    { id: 'act3', label: 'Акт 3' },
  ]

  const actData = EQUIPMENT[actTab]

  return (
    <>
      <div className="page-header">
        <h1>Экипировка</h1>
        <p>Лучшее снаряжение для Dark Urge Oathbreaker</p>
      </div>

      <div className="act-tabs">
        {acts.map(a => (
          <button
            key={a.id}
            className={`act-tab${actTab === a.id ? ' active' : ''}`}
            onClick={() => setActTab(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {actData.items.map((item, i) => (
        <div key={i} className="item-card">
          <div className="item-icon">{item.slot}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <div className="item-name">{item.name}</div>
              <span className="badge" style={{
                color: item.rarityColor,
                borderColor: item.rarityColor + '55',
                background: item.rarityColor + '15',
                fontSize: 8.5,
              }}>{item.rarity}</span>
              {item.priority === 'high' && <span className="badge b-red" style={{ fontSize: 8.5 }}>Приоритет</span>}
            </div>
            <div className="item-where">📍 {item.where}</div>
            <div className="item-effect">{item.effect}</div>
          </div>
        </div>
      ))}

      {/* Artifacts section */}
      <div style={{ height: 20 }} />
      <div className="page-header" style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'Cinzel,serif', fontSize: 16, color: '#c9a84c' }}>
          ⚗️ Уникальные артефакты
        </h2>
        <p>Специальные предметы для Dark Urge и Oathbreaker</p>
      </div>

      {ARTIFACTS.map((art, i) => (
        <div key={i} style={{
          background: 'rgba(16,8,22,.85)',
          border: `1px solid ${art.mustHave ? 'rgba(201,168,76,.35)' : 'rgba(42,25,28,.7)'}`,
          borderRadius: 6,
          padding: '13px 15px',
          marginBottom: 10,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {art.mustHave && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              background: 'rgba(201,168,76,.2)',
              padding: '3px 10px',
              fontFamily: 'Cinzel,serif',
              fontSize: 9,
              letterSpacing: 1,
              color: '#c9a84c',
              borderBottomLeftRadius: 4,
            }}>MUST HAVE</div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{art.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13.5, color: '#e8c97a' }}>{art.name}</div>
                <span className="badge" style={{
                  color: art.rarityColor,
                  borderColor: art.rarityColor + '55',
                  background: art.rarityColor + '15',
                  fontSize: 8.5,
                }}>{art.rarity}</span>
                {art.darkUrge && <span className="badge b-red" style={{ fontSize: 8.5 }}>Dark Urge</span>}
                <span className="badge b-ice" style={{ fontSize: 8.5 }}>Акт {art.act}</span>
              </div>
              <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 5 }}>
                📍 {art.where}
              </div>
              <div style={{ fontSize: 13.5, color: '#e8dcc8', lineHeight: 1.5, marginBottom: 6 }}>
                {art.effect}
              </div>
              {art.synergy && (
                <div style={{
                  background: 'rgba(201,168,76,.08)',
                  border: '1px solid rgba(201,168,76,.2)',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontSize: 12.5,
                  color: '#c9a84c',
                  lineHeight: 1.45,
                }}>
                  ⚡ Синергия: {art.synergy}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
