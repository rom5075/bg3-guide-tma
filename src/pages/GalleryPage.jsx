import { useState } from 'react'
import { MINTHARA_ART, renderMintharaScene } from '../data/artworks'
import { haptic } from '../telegram'

function ArtCard({ art, isActive, onClick }) {
  const svgContent = renderMintharaScene(art.svgScene, art.palette)

  return (
    <div
      onClick={() => { haptic('light'); onClick(art.id) }}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${isActive ? 'rgba(201,168,76,.5)' : 'rgba(42,25,28,.6)'}`,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        transition: 'border-color .2s, transform .15s',
        transform: isActive ? 'scale(1.01)' : 'scale(1)',
        background: '#0a0510',
      }}
    >
      {/* SVG artwork */}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '131.25%', background: art.palette[0] }}>
        <svg
          viewBox="0 0 320 420"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            display: 'block',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
        {/* Overlay gradient at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '35%',
          background: `linear-gradient(transparent, ${art.palette[0]}ee)`,
          pointerEvents: 'none',
        }} />
        {/* Medium badge */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,.65)',
          border: '1px solid rgba(201,168,76,.3)',
          borderRadius: 3,
          padding: '3px 8px',
          fontFamily: 'Cinzel,serif',
          fontSize: 8,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'rgba(201,168,76,.8)',
          backdropFilter: 'blur(4px)',
        }}>
          {art.medium}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', background: 'rgba(8,4,12,.9)' }}>
        <div style={{ fontFamily: 'Cinzel,serif', fontSize: 13, color: '#e8c97a', marginBottom: 3 }}>
          {art.title}
        </div>
        <div style={{ fontSize: 11, color: '#8a7a6a', marginBottom: 8, fontStyle: 'italic' }}>
          {art.subtitle}
        </div>
        <div style={{
          fontSize: 12.5,
          color: '#c8b89a',
          lineHeight: 1.55,
          fontFamily: 'Cormorant Garamond, Georgia, serif',
        }}>
          {art.description}
        </div>
        <div style={{
          marginTop: 8,
          display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {art.mood.split(' · ').map((m, i) => (
            <span key={i} style={{
              padding: '2px 8px',
              background: `${art.palette[2]}25`,
              border: `1px solid ${art.palette[2]}45`,
              borderRadius: 10,
              fontFamily: 'Cinzel,serif',
              fontSize: 8.5,
              letterSpacing: 1,
              color: art.palette[3] || '#c9a84c',
            }}>{m}</span>
          ))}
        </div>
        {/* Palette swatches */}
        <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
          {art.palette.map((c, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: 3,
              background: c,
              border: '1px solid rgba(255,255,255,.1)',
            }} />
          ))}
          <span style={{ fontSize: 10, color: '#5a4a4a', marginLeft: 4, alignSelf: 'center' }}>
            палитра
          </span>
        </div>
      </div>
    </div>
  )
}

function FullscreenViewer({ art, onClose }) {
  const svgContent = renderMintharaScene(art.svgScene, art.palette)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 10,
          overflow: 'hidden',
          border: '1px solid rgba(201,168,76,.3)',
        }}
      >
        {/* Full SVG */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: '131.25%', background: art.palette[0] }}>
          <svg
            viewBox="0 0 320 420"
            xmlns="http://www.w3.org/2000/svg"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>

        {/* Detail panel */}
        <div style={{ background: '#0a0510', padding: '16px 18px' }}>
          <div style={{
            fontFamily: 'Cinzel,serif', fontSize: 15,
            color: '#e8c97a', marginBottom: 4,
          }}>{art.title}</div>
          <div style={{
            fontFamily: 'Cinzel,serif', fontSize: 9,
            letterSpacing: 2, textTransform: 'uppercase',
            color: 'rgba(201,168,76,.5)', marginBottom: 10,
          }}>{art.subtitle} · {art.medium}</div>
          <p style={{
            fontSize: 14,
            color: '#c8b89a',
            lineHeight: 1.7,
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            marginBottom: 12,
          }}>{art.description}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {art.mood.split(' · ').map((m, i) => (
              <span key={i} style={{
                padding: '3px 10px',
                background: `${art.palette[2]}25`,
                border: `1px solid ${art.palette[2]}45`,
                borderRadius: 12,
                fontFamily: 'Cinzel,serif',
                fontSize: 9, letterSpacing: 1,
                color: art.palette[3] || '#c9a84c',
              }}>{m}</span>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px',
              background: 'rgba(196,32,64,.15)',
              border: '1px solid rgba(196,32,64,.35)',
              borderRadius: 6,
              fontFamily: 'Cinzel,serif',
              fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#c42040',
              cursor: 'pointer',
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GalleryPage() {
  const [layout, setLayout] = useState('grid') // 'grid' | 'list'
  const [fullscreen, setFullscreen] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const fullArt = fullscreen ? MINTHARA_ART.find(a => a.id === fullscreen) : null

  return (
    <>
      <div className="page-header">
        <h1>Галерея</h1>
        <p>Минтара Баэнре — концепт-арты</p>
      </div>

      {/* Intro note */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(122,18,37,.2), rgba(62,10,80,.15))',
        border: '1px solid rgba(196,32,64,.25)',
        borderRadius: 7, padding: '12px 14px', marginBottom: 16,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🎨</span>
        <div>
          <div style={{ fontFamily: 'Cinzel,serif', fontSize: 11, color: '#c9a84c', marginBottom: 4, letterSpacing: 1 }}>
            Оригинальные концепт-арты
          </div>
          <div style={{ fontSize: 12.5, color: '#a89878', lineHeight: 1.55 }}>
            SVG-иллюстрации в стиле тёмного фэнтези. Ключевые моменты истории Минтары — от детства в Мензоберранзане до финального боя.
          </div>
        </div>
      </div>

      {/* Layout toggle + count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: 'Cinzel,serif', fontSize: 9, letterSpacing: 2, color: '#7a5f28', textTransform: 'uppercase' }}>
          {MINTHARA_ART.length} работ
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'grid', icon: '⊞' },
            { id: 'list', icon: '☰' },
          ].map(l => (
            <button
              key={l.id}
              onClick={() => { haptic('light'); setLayout(l.id) }}
              style={{
                width: 32, height: 32,
                background: layout === l.id ? 'rgba(201,168,76,.18)' : 'rgba(14,10,14,.7)',
                border: `1px solid ${layout === l.id ? 'rgba(201,168,76,.45)' : 'rgba(42,25,28,.7)'}`,
                borderRadius: 5,
                color: layout === l.id ? '#e8c97a' : '#8a7a6a',
                fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >{l.icon}</button>
          ))}
        </div>
      </div>

      {/* Grid layout */}
      {layout === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {MINTHARA_ART.map(art => (
            <ArtCard
              key={art.id}
              art={art}
              isActive={activeId === art.id}
              onClick={(id) => {
                setActiveId(id)
                setTimeout(() => setFullscreen(id), 80)
              }}
            />
          ))}
        </div>
      )}

      {/* List layout */}
      {layout === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MINTHARA_ART.map(art => {
            const svgContent = renderMintharaScene(art.svgScene, art.palette)
            return (
              <div
                key={art.id}
                onClick={() => { haptic('light'); setFullscreen(art.id) }}
                style={{
                  display: 'flex', gap: 12,
                  background: 'rgba(10,5,14,.85)',
                  border: '1px solid rgba(42,25,28,.7)',
                  borderRadius: 8, overflow: 'hidden',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 80, flexShrink: 0, position: 'relative', background: art.palette[0] }}>
                  <svg
                    viewBox="0 0 320 420"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: '100%', height: '100%', display: 'block', minHeight: 105 }}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                </div>
                {/* Info */}
                <div style={{ flex: 1, padding: '12px 12px 12px 0' }}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: 12.5, color: '#e8c97a', marginBottom: 3 }}>
                    {art.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#8a7a6a', marginBottom: 6, fontStyle: 'italic' }}>
                    {art.subtitle}
                  </div>
                  <div style={{ fontSize: 12, color: '#a89878', lineHeight: 1.5, marginBottom: 8, fontFamily: 'Cormorant Garamond, serif' }}>
                    {art.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {art.palette.slice(0, 4).map((c, i) => (
                      <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,.1)' }} />
                    ))}
                    <span style={{ fontSize: 9, color: '#c42040', fontFamily: 'Cinzel,serif', letterSpacing: 1, marginLeft: 4 }}>
                      ▶ смотреть
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Fullscreen viewer */}
      {fullscreen && fullArt && (
        <FullscreenViewer art={fullArt} onClose={() => setFullscreen(null)} />
      )}
    </>
  )
}
