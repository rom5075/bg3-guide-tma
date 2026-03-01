import Accordion from '../components/Accordion'

const KEY_DECISIONS = [
  {
    act: 1,
    emoji: '⚔️',
    title: 'Уничтожить Изумрудную Рощу',
    result: 'good',
    desc: 'Убиваем тифлингов, помогаем Минтаре. Она присоединяется той же ночью.',
    consequence: 'Потеря: Вилл (уходит навсегда). Оствляем: всех остальных если правильно играть.',
  },
  {
    act: 2,
    emoji: '🌑',
    title: 'НЕ убивать Nightsong',
    result: 'good',
    desc: 'Убеждаем Шэдоухарт остановиться. Nightsong выживает → Шэдоухарт свободна от Шар.',
    consequence: 'Открывает полный роман с Шэдоухарт + лучшую концовку её квеста.',
  },
  {
    act: 2,
    emoji: '🏰',
    title: 'Освободить Минтару из тюрьмы Moonrise',
    result: 'good',
    desc: 'Тихо нейтрализуй стражу. Она присоединяется снова — роман возобновляется.',
    consequence: 'Критически важно для продолжения романа с Минтарой.',
  },
  {
    act: 3,
    emoji: '🧛',
    title: 'Остановить Ритуал Аскенды (Астарион)',
    result: 'good',
    desc: 'Убей Казадора, но не позволяй Астариону проводить ритуал над жертвами.',
    consequence: 'Лучший исход для Астариона. Он остаётся собой — романтическая линия улучшается.',
  },
  {
    act: 3,
    emoji: '🧙',
    title: 'Не давать Гейлу взрываться',
    result: 'good',
    desc: 'Найди альтернативное решение для финала. Гейл не должен использовать орб.',
    consequence: 'Гейл выживает → лучший финал романа с ним.',
  },
  {
    act: 1,
    emoji: '🌹',
    title: 'Вилл уходит (неизбежно)',
    result: 'bad',
    desc: 'Уничтожение Рощи = его красная линия. Он покидает отряд и его романс заблокирован.',
    consequence: 'НЕИЗБЕЖНАЯ ПОТЕРЯ. С нашим путём это невозможно изменить.',
  },
]

const COMPANION_STATUS = [
  { name: 'Астарион', emoji: '🧛', status: 'green', note: 'Остаётся. Одобряет Dark Urge и злые действия.' },
  { name: 'Шэдоухарт', emoji: '🌑', status: 'green', note: 'Остаётся. НЕ убиваем Nightsong → квест Шар открывается.' },
  { name: 'Лаэзель', emoji: '⚔️', status: 'green', note: 'Остаётся. Одобряет силу и решительность. Respec → Fighter 12.' },
  { name: 'Гейл', emoji: '🧙', status: 'yellow', note: 'Остаётся при регулярных магических предметах. В лагерь на злые квесты.' },
  { name: 'Карлах', emoji: '🔥', status: 'yellow', note: 'Остаётся — но НЕ берём в рейд Рощи (теряет одобрение как тифлинг). Нужно инфернальное железо (2 шт.).' },
  { name: 'Минтара', emoji: '🪓', status: 'green', note: 'Присоединяется после рейда. Наш приоритет. Освобождаем в Акте 2 из тюрьмы Moonrise. Respec → Pal7/Wiz5.' },
  { name: 'Халсин', emoji: '🌲', status: 'yellow', note: 'Роща уничтожена — не присоединяется как компаньон. Встречается в Акте 2 как NPC в Last Light Inn.' },
  { name: 'Вилл', emoji: '🌹', status: 'red', note: 'ПОТЕРЯ. Уходит при уничтожении Рощи — невозможно удержать на нашем пути.' },
]

export default function AboutPage() {
  return (
    <>
      <div className="page-header">
        <h1>Тёмный путь</h1>
        <p>Dark Urge · Oathbreaker · Slayer</p>
      </div>

      {/* Dark banner */}
      <div className="dark-banner" data-emoji="🩸" style={{ marginBottom: 16 }}>
        <div className="db-title">Dark Urge</div>
        <div className="db-sub">Отпрыск Бхаала · Избранный тёмного бога</div>
        <div className="db-text">
          Ты — бхаалспаун, несущий в крови неугасимую жажду убийства. Твоя тьма — не проклятие, а источник невероятной силы. Oathbreaker Paladin 12: чистый паладин с Aura of Hate, Animate Dead и Improved Divine Smite. Двойная аура с Минтарой — ключевая механика команды.
        </div>
      </div>

      {/* Companion status */}
      <Accordion icon="👥" title="Статус команды" meta="кто остаётся" defaultOpen>
        {COMPANION_STATUS.map((c, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            padding: '9px 0',
            borderBottom: i < COMPANION_STATUS.length - 1 ? '1px solid rgba(42,25,28,.4)' : 'none',
          }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{c.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'Cinzel,serif', fontSize: 12,
                color: '#e8dcc8', marginBottom: 2,
              }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#8a7a6a' }}>{c.note}</div>
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: c.status === 'green' ? '#6abf69' : c.status === 'yellow' ? '#d4892a' : '#c42040',
              boxShadow: `0 0 5px ${c.status === 'green' ? '#6abf69' : c.status === 'yellow' ? '#d4892a' : '#c42040'}`,
            }} />
          </div>
        ))}
      </Accordion>

      {/* Key decisions */}
      <Accordion icon="⚖️" title="Ключевые решения" meta="что выбирать" defaultOpen>
        {KEY_DECISIONS.map((d, i) => (
          <div key={i} style={{
            background: d.result === 'good'
              ? 'rgba(45,107,45,.07)' : 'rgba(122,18,37,.09)',
            border: `1px solid ${d.result === 'good' ? 'rgba(106,191,105,.2)' : 'rgba(196,32,64,.2)'}`,
            borderRadius: 5,
            padding: '11px 13px',
            marginBottom: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 18 }}>{d.emoji}</span>
              <span style={{ fontFamily: 'Cinzel,serif', fontSize: 10, letterSpacing: 1.5, color: '#7a5f28', textTransform: 'uppercase' }}>Акт {d.act}</span>
              <span style={{
                fontSize: 10, fontFamily: 'Cinzel,serif', letterSpacing: 1,
                color: d.result === 'good' ? '#6abf69' : '#c42040',
              }}>
                {d.result === 'good' ? '✓ Делай' : '✗ Неизбежно'}
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e8dcc8', marginBottom: 4 }}>{d.title}</div>
            <div style={{ fontSize: 13, color: '#8a7a6a', lineHeight: 1.5, marginBottom: 5 }}>{d.desc}</div>
            <div style={{
              fontSize: 12, color: d.result === 'good' ? '#6abf69' : '#c42040',
              fontStyle: 'italic', lineHeight: 1.4,
            }}>→ {d.consequence}</div>
          </div>
        ))}
      </Accordion>

      {/* Dark Urge mechanics */}
      <Accordion icon="🩸" title="Механики Dark Urge">
        <ul className="step-list">
          {[
            { title: 'Porqué Origin', desc: 'Dark Urge — это сюжетный Origin, а не просто класс. Ты играешь за Bhaalspawn с уникальными диалогами, сценами и предметами (Deathstalker Mantle с первого уровня).' },
            { title: 'Тёмные побуждения', desc: 'Периодически Dark Urge предлагает совершить жестокий поступок. ПРИНИМАЙ большинство из них — это даёт одобрение Минтары, бонусы и уникальный лор.' },
            { title: 'Сопротивляться или поддаться?', desc: 'В Акте 1 и 2 — поддавайся. В Акте 3 перед финалом — сопротивляйся (если хочешь лучший финал). Можно комбинировать.' },
            { title: 'Slayer Form', desc: 'Открывается в Акте 2. Мощнейшая трансформация — огромный HP, Frightening Presence, усиленные атаки. Приберегай для боссов.' },
            { title: 'Sceleritas Fel', desc: 'Твой дворецкий-дьявол. Разговаривай с ним в лагере — он даёт квесты и пополняет арсенал Bhaalspawn способностей.' },
            { title: 'Bhaal Temple (Акт 3)', desc: 'Финальное место силы. Здесь уникальный лут только для Dark Urge, финальные диалоги и самый мощный момент пути.' },
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

      {/* Oathbreaker */}
      <Accordion icon="💀" title="Oathbreaker путь">
        <div className="note danger" style={{ marginBottom: 12 }}>
          Oathbreaker — это не плохой билд. Это <strong>лучший</strong> темный паладин в игре.
        </div>
        <ul className="step-list">
          {[
            { title: 'Как стать Oathbreaker', desc: 'Выбери Oath of Vengeance на Lv3 → затем уничтожь Рощу или соверши другое явное нарушение клятвы. Появится Ghost of Oathbreaker в лагере.' },
            { title: 'Ghost of Oathbreaker', desc: 'Появляется в лагере. Предлагает принять Oathbreaker подкласс. Соглашайся — это усиляет персонажа, а не ослабляет.' },
            { title: 'Эксклюзивные способности', desc: 'Animate Dead, Aura of Hate (Lv7) — +CHA к melee-урону нежити и всем союзникам, Control Undead, Hellish Rebuke. Lv11: Improved Divine Smite = бесплатный +1d8 к каждой атаке.' },
            { title: 'Двойная Aura of Hate', desc: 'Стань рядом с Минтарой (тоже Oathbreaker Pal7): обе ауры суммируются. +CHA от тебя + +CHA от Минтары = +8-10 к КАЖДОЙ melee-атаке у обоих и у всей нежити.' },
            { title: 'Армия нежити', desc: 'Animate Dead + Deathstalker Mantle = каждый убитый враг может стать Shadow союзником. К Акту 3 можно иметь 4-6 нежити одновременно. Вся нежить получает бонус обеих аур.' },
            { title: 'Нет штрафов', desc: 'В отличие от других RPG, Oathbreaker не теряет силу. Он меняет пул заклинаний на тёмные аналоги — они как минимум столь же хороши.' },
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

      <div className="note success" style={{ marginTop: 8 }}>
        ✨ При правильном прохождении: Минтара — основной роман + «королева» полиамории с Астарионом и Лаэзель. Команда 7 из 8. Двойная Aura of Hate на весь отряд. Уникальный Dark Urge эпилог.
      </div>
    </>
  )
}
