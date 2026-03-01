import { useState, useEffect } from 'react'
import { initTelegram, haptic } from './telegram'
import { ThemeProvider, useTheme } from './ThemeContext'
import './styles/global.css'

import RomancePage from './pages/RomancesPage'
import BuildsPage  from './pages/BuildsPage'
import EquipPage   from './pages/EquipmentPage'
import PotionsPage from './pages/PotionsPage'
import LorePage    from './pages/LorePage'
import GalleryPage from './pages/GalleryPage'
import PartyPage   from './pages/PartyPage'
import MapPage     from './pages/MapPage'
import AIPage      from './pages/AIPage'
import AboutPage   from './pages/AboutPage'
import SearchOverlay from './components/SearchOverlay'

const TABS = [
  { id: 'romance', icon: '💋', label: 'Романы'  },
  { id: 'builds',  icon: '⚔️', label: 'Билды'   },
  { id: 'equip',   icon: '🛡️', label: 'Шмот'    },
  { id: 'potions', icon: '🧪', label: 'Зелья'   },
  { id: 'party',   icon: '👥', label: 'Отряд'   },
  { id: 'map',     icon: '🗺️', label: 'Карта'   },
  { id: 'lore',    icon: '📜', label: 'Лор'     },
  { id: 'gallery', icon: '🎨', label: 'Арты'    },
  { id: 'ai',      icon: '🩸', label: 'ИИ'      },
  { id: 'about',   icon: '📖', label: 'Путь'    },
]

function AppInner() {
  const [tab, setTab]       = useState('romance')
  const [search, setSearch] = useState(false)
  const { theme, toggle }   = useTheme()

  useEffect(() => { initTelegram() }, [])

  function switchTab(id) {
    haptic('light')
    setTab(id)
    window.scrollTo(0, 0)
  }

  return (
    <>
      {/* Top bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 44,
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border-gold)',
        display: 'flex', alignItems: 'center',
        padding: '0 14px',
        gap: 10,
      }}>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'Cinzel,serif', fontSize: 12,
            letterSpacing: 2, textTransform: 'uppercase',
            color: 'var(--gold)',
          }}>BG3 · Dark Urge</span>
        </div>
        <button
          onClick={() => { haptic('light'); setSearch(true) }}
          style={{
            background: 'rgba(201,168,76,.1)',
            border: '1px solid var(--border-gold)',
            borderRadius: 7, width: 34, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15,
            WebkitTapHighlightColor: 'transparent',
          }}
        >🔍</button>
        <button
          onClick={() => { haptic('light'); toggle() }}
          style={{
            background: 'rgba(201,168,76,.1)',
            border: '1px solid var(--border-gold)',
            borderRadius: 7, width: 34, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 15,
            WebkitTapHighlightColor: 'transparent',
          }}
        >{theme === 'dark' ? '🌙' : '☀️'}</button>
      </div>

      {/* Page */}
      <main className="page fade-in" key={tab} style={{ paddingTop: 58 }}>
        {tab === 'romance'  && <RomancePage />}
        {tab === 'builds'   && <BuildsPage  />}
        {tab === 'equip'    && <EquipPage   />}
        {tab === 'potions'  && <PotionsPage />}
        {tab === 'party'    && <PartyPage   />}
        {tab === 'map'      && <MapPage     />}
        {tab === 'lore'     && <LorePage    />}
        {tab === 'gallery'  && <GalleryPage />}
        {tab === 'ai'       && <AIPage      />}
        {tab === 'about'    && <AboutPage   />}
      </main>

      {/* Bottom nav — scrollable */}
      <nav className="bottom-nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => switchTab(t.id)}
          >
            <span className="icon">{t.icon}</span>
            <span className="label">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Search overlay */}
      {search && (
        <SearchOverlay
          onClose={() => setSearch(false)}
          onNavigate={id => switchTab(id)}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
