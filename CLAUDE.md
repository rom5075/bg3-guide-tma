# BG3 Ultimate Guide — Telegram Mini App
## Контекст для Claude Code

---

## 🎯 Что это за проект

Telegram Mini App — гайд по Baldur's Gate 3 для прохождения **Dark Urge Origin** с фокусом на:
- Класс: **Oathbreaker Paladin 12** (протагонист)
- Стратегия: **Двойная Aura of Hate** (протагонист + Минтара оба Oathbreaker)
- Роман: **Полиамория** — Минтара (главная) + Астарион + Лаэзель
- Команда: **7 из 8 компаньонов** (Вилл — единственная неизбежная потеря)
- Nightsong: **выживает** (условие для романа Шэдоухарт)

Стек: **React 18 + Vite 5**, без внешних UI-библиотек, все стили — чистый CSS через переменные.

---

## 📁 Структура проекта

```
bg3-guide-tma/
├── src/
│   ├── data/               ← ВЕСЬ игровой контент здесь
│   ├── pages/              ← 10 страниц (компоненты вкладок)
│   ├── components/         ← переиспользуемые UI компоненты
│   ├── hooks/              ← useAIChat.js (Claude API + Telegram CloudStorage)
│   ├── styles/global.css   ← все стили + dark/light темы через CSS-переменные
│   ├── App.jsx             ← роутинг, топбар, навигация
│   ├── ThemeContext.jsx     ← dark/light тема
│   └── telegram.js         ← Telegram WebApp SDK утилиты
├── api/chat.js             ← Vercel Edge Function для Anthropic API
├── CLAUDE.md               ← этот файл
├── DEPLOY.md               ← инструкция по деплою
└── vercel.json             ← SPA rewrites
```

---

## 🗂️ Data файлы — экспорты

### `src/data/romances.js`
```js
export const ROMANCES          // массив всех романов с актами, диалогами, одобрением
export const ROMANCE_ORDER     // порядок отображения ['minthara', 'astarion', ...]
export const POLYAMORY         // система полиамории: acts[], whyThisTrio[], edgeCases[]
```

### `src/data/builds.js`
```js
export const BUILDS            // 6 билдов: protagonist, minthara, astarion, shadowheart, lazel, gale
export const TEAM_COMPOSITIONS // 3 состава отряда для разных ситуаций
export const STRATEGY_SUMMARY  // описание стратегии двойной ауры + формула
```

Поля объекта `BUILDS[]`:
- `id, name, emoji, race, class, subclass, role, color, bgGradient`
- `summary, synergyNote, respecNote, orbNote, whyThisBuild`
- `stats[]` — `{label, value, note, highlight}`
- `keyStats[]` — `{label, value}`
- `levelPlan[]` — `{level, class, desc}` (НЕ `lv`/`cls`/`action` — это старые v1 поля)
- `feats[], keySpells[], skills[], playstyle[]` (НЕ `spells`/`tips` — старые v1)

### `src/data/equipment.js`
```js
export const EQUIPMENT         // {act1, act2, act3} — items[] по актам
export const ARTIFACTS         // уникальные артефакты
export const POTIONS           // зелья и расходники
export const PRIORITY_LABELS   // S/A/B цвета для зелий
export const AURA_SYNERGY_ITEMS  // шмот усиливающий Aura of Hate
export const DARK_URGE_ITEMS     // эксклюзив Dark Urge Origin
```

### `src/data/party.js`
```js
export const PARTY_SUMMARY        // {max: 7, lost: 1, lostName: 'Вилл'}
export const COMPANION_CHECKLIST  // пошаговый гайд по каждому компаньону
export const PARTY_TIPS           // общие советы по одобрению
export const RESPEC_GUIDE         // когда и как делать respec каждому компаньону
export const EVIL_QUESTS          // злые квесты по актам: кого брать/оставлять
```

### `src/data/locations.js`
```js
export const MAP_ACTS    // 3 акта с yRange для SVG карты
export const LOCATIONS   // 21 локация с координатами x,y для SVG (480×680)
export const TYPE_CONFIG // story/loot/boss/camp/danger/explore — цвета и иконки
```

### `src/data/lore.js`
```js
export const WORLD_LORE      // лор мира: боги, фракции, история
export const CHARACTER_LORE  // предыстории персонажей
export const LORE_TAGS       // теги для фильтрации
```

### `src/data/searchIndex.js`
```js
export function search(query)  // глобальный поиск — читает ВСЕ data файлы
```
Индексирует: ROMANCES, POLYAMORY, BUILDS, TEAM_COMPOSITIONS, STRATEGY_SUMMARY,
EQUIPMENT, ARTIFACTS, AURA_SYNERGY_ITEMS, DARK_URGE_ITEMS, POTIONS,
WORLD_LORE, CHARACTER_LORE, LOCATIONS, COMPANION_CHECKLIST, RESPEC_GUIDE, EVIL_QUESTS.

### `src/data/aiPrompt.js`
```js
export function buildSystemPrompt()  // системный промпт для ИИ-советника
export const QUICK_QUESTIONS         // быстрые вопросы в чате
export const CHAT_STORAGE_KEY        // ключ для Telegram CloudStorage
export const MAX_HISTORY_MESSAGES    // 20
```
⚠️ **Устарел**: промпт ещё ссылается на старый билд Pal5/Warlock7 — нужно обновить на Paladin 12.

---

## 📄 Pages — вкладки

| Файл | Tab ID | Что показывает |
|------|--------|----------------|
| `RomancesPage.jsx` | `romance` | Романы + вкладка Полиамория |
| `BuildsPage.jsx` | `builds` | Билды + вкладка Команда |
| `EquipmentPage.jsx` | `equip` | Шмот + Аура-синергия + Dark Urge |
| `PotionsPage.jsx` | `potions` | Зелья и расходники |
| `PartyPage.jsx` | `party` | Отряд + Respec + Злые квесты |
| `MapPage.jsx` | `map` | SVG карта локаций |
| `LorePage.jsx` | `lore` | Лор мира и персонажей |
| `GalleryPage.jsx` | `gallery` | SVG концепт-арты Минтары |
| `AIPage.jsx` | `ai` | Чат с Claude (ИИ-советник) |
| `AboutPage.jsx` | `about` | Dark Urge путь, ключевые решения |

⚠️ **Важно**: `App.jsx` импортирует `RomancesPage` и `EquipmentPage` — НЕ старые `RomancePage`/`EquipPage`.
Старые файлы (`RomancePage.jsx`, `EquipPage.jsx`) существуют в папке но НЕ используются.

---

## 🎮 Игровые решения (факт-чек)

### Протагонист
- **Раса**: Lolth-Sworn Drow (бонус CHA, навыки скрытности)
- **Класс**: Oathbreaker Paladin 12 (чистый, без мультикласса)
- **STR**: 8 (dump stat) — компенсируется Cloud Giant Elixir (STR 27 на 10 ходов)
- **CHA**: 17 старт → 19 (ASI Lv4) → 21 с Birthright helm
- **Ключевые фичи**: Aura of Hate (Lv7), Improved Divine Smite (Lv11)

### Минтара
- Найти: Shattered Sanctum в лагере гоблинов, Акт 1
- Присоединяется: после уничтожения Рощи (пир той же ночью)
- Освободить: тюрьма нижнего этажа Moonrise Towers, Акт 2 (тихо!)
- Respec: после освобождения → Paladin 7 / Necromancer Wizard 5

### Карлах
- **НЕ умирает** при рейде Рощи — она у реки СЗ от Waukeen's Rest
- **НЕ брать в партию** во время рейда (она тифлинг → теряет одобрение)
- Нужно: 2× Infernal Iron (Blighted Village + Grymforge)

### Халсин
- **НЕ присоединяется** как компаньон (Роща уничтожена)
- Встречается как NPC в Last Light Inn, Акт 2

### Cloud Giant Elixir
- Покупать у **Акаби** — джин в Circus of Last Days, Ривингтон, Акт 3
- Стойка справа при входе в цирк
- Обновляется каждый Long Rest → скупать весь запас

### Balduran's Giantslayer
- Локация: **Ansur** (дракон) в Wyrmway / Seatower of Balduran, Акт 3
- НЕ в Wyrm's Rock Fortress — это разные места
- Wyrmway: 4 испытания → Ansur → меч в луте

### Прочие исправленные локации
- `Helmet of Arcane Acuity` → убить Tsolak (вампир) в Last Light Inn
- `Shelter of Athkatla` → Stormshore Armoury, Нижний Город
- `Ring of Regeneration` → Stormshore Tabernacle / Temple of Bhaal
- `Armour of Agility` → тюрьма Wyrm's Rock Fortress, уровень B2
- `Haste Helm` → гоблины в Shattered Sanctum или Blighted Village

---

## 🧩 Компоненты

### `Accordion.jsx`
```jsx
<Accordion icon="⚔️" title="Заголовок" meta="подпись" accentColor="#c9a84c" defaultOpen>
  {children}
</Accordion>
```

### `SearchOverlay.jsx`
Использует `search()` из `searchIndex.js`. Результат содержит `tab` — ID для навигации.

### `BottomNav.jsx`
Горизонтальный скролл, 10 вкладок.

---

## 🎨 CSS-переменные (dark тема)

```css
--gold: #c9a84c           /* заголовки, акценты */
--crimson: #7a1225        /* тёмный фон карточек */
--crimson-bright: #c42040 /* активные элементы */
--purple: #3e1460         /* магия */
--bg-dark: #0a050f        /* основной фон */
--border-gold: rgba(201,168,76,.2)
```

Классы-утилиты: `.card`, `.card-red`, `.note`, `.note warn`, `.note danger`, `.note success`,
`.badge`, `.b-gold`, `.b-red`, `.b-purple`, `.b-ice`, `.step-list`, `.step-item`,
`.approval-list`, `.dialogue-block`, `.item-card`, `.section-label`, `.scroll-x`

---

## ⚡ Типичные задачи

### Добавить новую локацию на карту
```js
// src/data/locations.js → LOCATIONS[]
{
  id: 'unique_id',
  act: 'act1',          // 'act1' | 'act2' | 'act3'
  name: 'Название',
  short: 'Короткое',
  emoji: '⚔️',
  x: 240, y: 80,        // координаты SVG (0-480, 0-680)
  type: 'story',        // story|loot|boss|camp|danger|explore
  priority: 'critical', // critical|high|medium|low
  desc: 'Описание...',
  loot: 'Что можно найти',
  darkUrge: false,
  criticalNote: 'Важно!', // опционально
}
```

### Добавить шмот в аура-синергию
```js
// src/data/equipment.js → AURA_SYNERGY_ITEMS[]
{
  name: 'Название предмета',
  slot: '🗡️',
  who: 'Протагонист',   // кто носит
  act: 3,
  priority: '★★★',      // '★★★' | '★★' | '★'
  effect: 'Что даёт...',
  location: 'Где найти с навигацией',
}
```

### Добавить шаг в план прокачки
```js
// src/data/builds.js → BUILDS[id].levelPlan[]
{ level: 'Lv5', class: 'Oathbreaker Paladin', desc: 'Extra Attack — 2 атаки за действие' }
// НЕ используй: lv, cls, action — это старые v1 поля
```

### Обновить системный промпт ИИ
```js
// src/data/aiPrompt.js → buildSystemPrompt()
// Строка с классом: заменить 'Paladin 5 / Warlock 7' → 'Oathbreaker Paladin 12'
```

---

## 🚨 Частые ошибки

- **Не используй** поля `b.spells`, `b.tips`, `lp.lv`, `lp.cls`, `lp.action` — это v1, в данных их нет
- **Используй** `b.keySpells`, `b.playstyle`, `lp.level`, `lp.class`, `lp.desc`
- При добавлении нового экспорта из data-файла — добавь его и в `searchIndex.js`
- `RomancePage.jsx` и `EquipPage.jsx` — мёртвый код, не редактируй их
- Карта SVG: координаты x от 0 до 480, y от 0 до 680. Акт 1: y 0-220, Акт 2: y 230-450, Акт 3: y 460-680

---

## 🔧 Команды

```bash
npm run dev      # dev сервер → localhost:5173
npm run build    # продакшен сборка → dist/
npm run preview  # превью dist/
```

Деплой: push в GitHub → Vercel автоматически пересобирает.

---

## 🔔 Система напоминаний (Cron)

**Файл:** `api/remind.js` — Vercel Edge Function
**Расписание:** `0 10 * * *` = каждый день в 10:00 UTC = 15:00 Екатеринбург (UTC+5)

**Переменные окружения на Vercel** (Settings → Environment Variables):
- `TELEGRAM_BOT_TOKEN` — токен бота из BotFather
- `TELEGRAM_CHAT_ID` — числовой ID получателя (узнать у @userinfobot)

**30 напоминаний** в стиле Минтары — рандомное одно в день.

**Протестировать вручную:** открыть в браузере `https://твой-домен.vercel.app/api/remind`
