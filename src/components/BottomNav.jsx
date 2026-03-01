import { haptic } from '../telegram.js'

const TABS = [
  { id: 'romances',  icon: '❤️', label: 'Романы' },
  { id: 'builds',    icon: '⚔️', label: 'Билды' },
  { id: 'equipment', icon: '🛡️', label: 'Шмот' },
  { id: 'potions',   icon: '🧪', label: 'Зелья' },
]

export default function BottomNav({ active, onTab }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <div
          key={t.id}
          className={`nav-tab${active === t.id ? ' active' : ''}`}
          onClick={() => {
            haptic('light')
            onTab(t.id)
          }}
        >
          <span className="icon">{t.icon}</span>
          <span className="label">{t.label}</span>
        </div>
      ))}
    </nav>
  )
}
