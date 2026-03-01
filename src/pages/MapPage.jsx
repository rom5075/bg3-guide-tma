import { useState } from 'react'
import { LOCATIONS, MAP_ACTS, TYPE_CONFIG } from '../data/locations'
import { haptic } from '../telegram'

const W = 480
const H = 680

// Road/path lines between locations [from_id, to_id]
const PATHS = [
  ['nautiloid_crash', 'emerald_grove'],
  ['nautiloid_crash', 'goblin_camp'],
  ['emerald_grove',   'blighted_village'],
  ['blighted_village','underdark'],
  ['blighted_village','goblin_camp'],
  ['goblin_camp',     'githyanki_patrol'],
  ['blighted_village','camp_act1'],
  ['last_light_inn',  'moonrise_towers'],
  ['moonrise_towers', 'gauntlet_shar'],
  ['last_light_inn',  'shadow_cursed_lands'],
  ['shadow_cursed_lands','gauntlet_shar'],
  ['moonrise_towers', 'ketheric_arena'],
  ['rivington',       'lower_city'],
  ['lower_city',      'bhaal_temple'],
  ['lower_city',      'wyrms_rock'],
  ['lower_city',      'house_of_grief'],
  ['lower_city',      'elder_brain_arena'],
]

function getXY(id) {
  const loc = LOCATIONS.find(l => l.id === id)
  return loc ? [loc.x, loc.y] : null
}

function LocationDetail({ loc, onClose }) {
  const tc = TYPE_CONFIG[loc.type]
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'linear-gradient(180deg, #0e0a14, #08050a)',
          border: '1px solid rgba(42,25,28,.8)',
          borderRadius: 16,
          padding: '20px 18px 24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10, flexShrink: 0,
            background: `${tc.color}18`,
            border: `1.5px solid ${tc.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>{loc.emoji}</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cinzel,serif', fontSize: 15, color: '#e8dcc8', marginBottom: 3 }}>
              {loc.name}
            </div>
            <div style={{ fontSize: 12, color: '#8a7a6a', marginBottom: 6, fontStyle: 'italic' }}>{loc.short}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                padding: '2px 9px',
                background: `${tc.color}18`, border: `1px solid ${tc.color}44`,
                borderRadius: 10, fontFamily: 'Cinzel,serif', fontSize: 8.5,
                letterSpacing: .8, color: tc.color,
              }}>{tc.label}</span>
              {loc.darkUrge && (
                <span style={{
                  padding: '2px 9px',
                  background: 'rgba(196,32,64,.15)', border: '1px solid rgba(196,32,64,.35)',
                  borderRadius: 10, fontFamily: 'Cinzel,serif', fontSize: 8.5,
                  letterSpacing: .8, color: '#c42040',
                }}>Dark Urge</span>
              )}
              {loc.priority === 'critical' && (
                <span style={{
                  padding: '2px 9px',
                  background: 'rgba(224,48,96,.15)', border: '1px solid rgba(224,48,96,.35)',
                  borderRadius: 10, fontFamily: 'Cinzel,serif', fontSize: 8.5,
                  letterSpacing: .8, color: '#e03060',
                }}>⚡ Критично</span>
              )}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#c8b89a', lineHeight: 1.65, marginBottom: loc.loot || loc.criticalNote ? 12 : 0, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
          {loc.desc}
        </p>

        {loc.criticalNote && (
          <div style={{
            padding: '8px 12px', marginBottom: 10,
            background: 'rgba(224,48,96,.1)',
            border: '1px solid rgba(224,48,96,.3)',
            borderRadius: 5, fontSize: 13, color: '#e03060', lineHeight: 1.5,
          }}>⚡ {loc.criticalNote}</div>
        )}

        {loc.loot && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(106,184,212,.07)',
            border: '1px solid rgba(106,184,212,.2)',
            borderRadius: 5, fontSize: 13, color: '#6ab8d4', lineHeight: 1.55,
          }}>🎁 {loc.loot}</div>
        )}
      </div>
    </div>
  )
}

export default function MapPage() {
  const [selected, setSelected] = useState(null)
  const [filterAct, setFilterAct] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const selectedLoc = selected ? LOCATIONS.find(l => l.id === selected) : null

  const visibleLocs = LOCATIONS.filter(l => {
    if (filterAct !== 'all' && l.act !== filterAct) return false
    if (filterType !== 'all' && l.type !== filterType) return false
    return true
  })

  function handlePin(id) {
    haptic('light')
    setSelected(prev => prev === id ? null : id)
  }

  return (
    <>
      <div className="page-header">
        <h1>Карта</h1>
        <p>Важные локации Dark Urge пути</p>
      </div>

      {/* Act filter */}
      <div className="scroll-x" style={{ marginBottom: 10, gap: 6 }}>
        {[
          { id: 'all', label: 'Все акты' },
          ...MAP_ACTS.map(a => ({ id: a.id, label: a.label })),
        ].map(f => (
          <button key={f.id} onClick={() => setFilterAct(f.id)} style={{
            flexShrink: 0, padding: '6px 14px',
            background: filterAct === f.id ? 'rgba(201,168,76,.18)' : 'rgba(14,10,14,.6)',
            border: `1px solid ${filterAct === f.id ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
            borderRadius: 20, fontFamily: 'Cinzel,serif', fontSize: 9.5,
            letterSpacing: 1, textTransform: 'uppercase',
            color: filterAct === f.id ? '#e8c97a' : '#8a7a6a',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Type filter */}
      <div className="scroll-x" style={{ marginBottom: 14, gap: 6 }}>
        <button onClick={() => setFilterType('all')} style={{
          flexShrink: 0, padding: '5px 12px',
          background: filterType === 'all' ? 'rgba(201,168,76,.12)' : 'rgba(14,10,14,.5)',
          border: `1px solid ${filterType === 'all' ? 'rgba(201,168,76,.35)' : 'rgba(42,25,28,.6)'}`,
          borderRadius: 12, fontFamily: 'Cinzel,serif', fontSize: 8.5,
          color: filterType === 'all' ? '#c9a84c' : '#6a5a5a',
          cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
        }}>Все</button>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterType(key)} style={{
            flexShrink: 0, padding: '5px 12px',
            background: filterType === key ? `${cfg.color}18` : 'rgba(14,10,14,.5)',
            border: `1px solid ${filterType === key ? cfg.color + '44' : 'rgba(42,25,28,.6)'}`,
            borderRadius: 12, fontFamily: 'Cinzel,serif', fontSize: 8.5,
            color: filterType === key ? cfg.color : '#6a5a5a',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
          }}>{cfg.icon} {cfg.label}</button>
        ))}
      </div>

      {/* Map SVG */}
      <div style={{
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(42,25,28,.7)',
        background: '#05030a',
        touchAction: 'pan-y',
      }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          <defs>
            <filter id="pin_glow">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="sel_glow">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(42,25,28,.18)" strokeWidth="0.5"/>
            </pattern>
          </defs>

          {/* Act backgrounds */}
          {MAP_ACTS.map(act => (
            <g key={act.id}>
              <rect x="0" y={act.yRange[0]} width={W} height={act.yRange[1] - act.yRange[0]}
                fill={act.bgColor} />
              <rect x="0" y={act.yRange[0]} width={W} height={act.yRange[1] - act.yRange[0]}
                fill="url(#grid)" />
              {/* Act label */}
              <text
                x="16" y={act.yRange[0] + 22}
                fontFamily="Cinzel, serif" fontSize="13" fill="rgba(201,168,76,.5)"
                letterSpacing="2"
              >{act.label.toUpperCase()}</text>
              <text
                x="16" y={act.yRange[0] + 37}
                fontFamily="Cinzel, serif" fontSize="8" fill="rgba(201,168,76,.25)"
                letterSpacing="1"
              >{act.sublabel}</text>
              {/* Act border */}
              <line x1="0" y1={act.yRange[1]} x2={W} y2={act.yRange[1]}
                stroke={act.borderColor} strokeWidth="1.5" opacity="0.6"/>
            </g>
          ))}

          {/* Act separators decorative */}
          <rect x="0" y="220" width={W} height="10" fill="rgba(0,0,0,.4)" />
          <rect x="0" y="450" width={W} height="10" fill="rgba(0,0,0,.4)" />

          {/* Paths */}
          {PATHS.map(([a, b], i) => {
            const p1 = getXY(a), p2 = getXY(b)
            if (!p1 || !p2) return null
            const aLoc = LOCATIONS.find(l => l.id === a)
            const bLoc = LOCATIONS.find(l => l.id === b)
            if (!visibleLocs.includes(aLoc) || !visibleLocs.includes(bLoc)) return null
            return (
              <line key={i}
                x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                stroke="rgba(201,168,76,.18)" strokeWidth="1.2"
                strokeDasharray="4 3"
              />
            )
          })}

          {/* Location pins */}
          {visibleLocs.map(loc => {
            const tc = TYPE_CONFIG[loc.type]
            const isSelected = selected === loc.id
            const isCritical = loc.priority === 'critical'
            const radius = isCritical ? 14 : 11

            return (
              <g key={loc.id} onClick={() => handlePin(loc.id)} style={{ cursor: 'pointer' }}>
                {/* Glow ring for selected */}
                {isSelected && (
                  <circle cx={loc.x} cy={loc.y} r={radius + 8}
                    fill={tc.color + '22'}
                    stroke={tc.color}
                    strokeWidth="1.5"
                    filter="url(#sel_glow)"
                  />
                )}

                {/* Pulse ring for critical */}
                {isCritical && (
                  <circle cx={loc.x} cy={loc.y} r={radius + 5}
                    fill="none"
                    stroke={tc.color + '55'}
                    strokeWidth="1"
                  />
                )}

                {/* Pin body */}
                <circle
                  cx={loc.x} cy={loc.y} r={radius}
                  fill={isSelected ? tc.color + 'cc' : tc.color + '30'}
                  stroke={tc.color}
                  strokeWidth={isSelected ? 2 : 1.5}
                  filter={isSelected ? 'url(#pin_glow)' : undefined}
                />

                {/* Emoji */}
                <text
                  x={loc.x} y={loc.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={isCritical ? 11 : 9}
                >{loc.emoji}</text>

                {/* Label */}
                <text
                  x={loc.x} y={loc.y + radius + 11}
                  textAnchor="middle"
                  fontFamily="Cinzel, serif"
                  fontSize="7"
                  fill={isSelected ? tc.color : 'rgba(201,168,76,.6)'}
                  letterSpacing="0.5"
                >{loc.name.length > 16 ? loc.name.substring(0, 15) + '…' : loc.name}</text>

                {/* Dark Urge indicator */}
                {loc.darkUrge && (
                  <circle cx={loc.x + radius - 2} cy={loc.y - radius + 2} r="4"
                    fill="#c42040" stroke="#08050a" strokeWidth="1"/>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'Cinzel,serif', fontSize: 8.5, color: '#8a7a6a' }}>{cfg.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c42040', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Cinzel,serif', fontSize: 8.5, color: '#8a7a6a' }}>Dark Urge</span>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedLoc && (
        <LocationDetail loc={selectedLoc} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
