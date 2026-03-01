# 🩸 BG3 Ultimate Guide — Telegram Mini App

**Dark Urge · Oathbreaker · Minthara focus · Nightsong alive**

React + Vite приложение для Telegram Mini App. Полный гайд по прохождению BG3 на Dark Urge пути с фокусом на Минтару.

---

## 🗂️ Вкладки приложения

| Иконка | Вкладка | Содержание |
|--------|---------|-----------|
| 💋 | **Романы** | Все романтические линии + **Система полиамории** (Минтара + Астарион + Лаэзель) · Диалоги ревности по актам · Групповая сцена |
| ⚔️ | **Билды** | Oathbreaker Paladin 12 + 5 билдов компаньонов · Двойная Aura of Hate · Respec гайд |
| 🛡️ | **Шмот** | Экипировка по актам · **Аура-синергия** (усилители Aura of Hate) · Dark Urge эксклюзив |
| 🧪 | **Зелья** | Алхимия, расходники, топ-12 зелий для тёмного пути |
| 👥 | **Отряд** | Удержать 7 из 8 · **Respec гайд** по актам · **Злые квесты** — кого брать / оставлять |
| 🗺️ | **Карта** | SVG карта важных локаций всех трёх актов с фильтрами и лутом |
| 📜 | **Лор** | Предыстории персонажей + лор мира: боги, фракции, история |
| 🎨 | **Арты** | Оригинальные SVG концепт-арты Минтары: 6 сцен по её истории |
| 🩸 | **ИИ** | Claude-советник: ответы на любые вопросы по Dark Urge пути в реальном времени |
| 📖 | **Путь** | Сводка Dark Urge пути, ключевые выборы, концовки |

---

## ✨ Фичи интерфейса

- **🔍 Поиск** — глобальный по всему контенту: романы, билды, шмот, лор, карта, отряд
- **🌙 / ☀️ Тема** — переключение тёмная / светлая (сохраняется между сессиями)
- **🩸 ИИ-советник** — чат с Claude: ответы по механикам, диалогам, квестам, билдам в реальном времени. История сохраняется через Telegram CloudStorage
- **Навигация** — горизонтальный скролл, все 10 вкладок без сжатия
- **Haptic feedback** — тактильный отклик при навигации (Telegram)
- **Fullscreen** — SVG арты открываются в полноэкранном просмотрщике
- **Дроуэры** — карта открывает детали локации снизу без перехода на новую страницу
- **Светлая тема** — тёплая сепия в стиле пергамента

---

## 🚀 Быстрый деплой

```bash
# 1. Установить зависимости
npm install

# 2. Собрать
npm run build

# 3. Задеплоить (GitHub → Vercel)
# Подробнее — см. DEPLOY.md
```

Полная инструкция по деплою → **[DEPLOY.md](./DEPLOY.md)**

---

## 🛠️ Разработка

```bash
npm run dev      # dev сервер → http://localhost:5173
npm run build    # продакшен сборка в /dist
npm run preview  # превью продакшен сборки
```

Без Telegram SDK все фолбеки работают корректно — приложение полностью функционально в браузере.

---

## 📁 Структура проекта

```
bg3-guide-tma/
├── src/
│   ├── data/
│   │   ├── romances.js       # Все романы + диалоги + одобрение
│   │   ├── builds.js         # Билды персонажей
│   │   ├── equipment.js      # Шмот по актам + артефакты + зелья
│   │   ├── lore.js           # Лор мира + предыстории персонажей
│   │   ├── locations.js      # Локации для карты (18 точек)
│   │   ├── party.js          # Данные по удержанию сопартийцев
│   │   ├── artworks.js       # SVG концепт-арты Минтары
│   │   ├── aiPrompt.js       # Системный промпт + быстрые вопросы для ИИ-советника
│   │   └── searchIndex.js    # Глобальный поисковый индекс
│   ├── hooks/
│   │   └── useAIChat.js      # Хук: Claude API + Telegram CloudStorage история
│   ├── pages/
│   │   ├── RomancesPage.jsx  # (активна) Романы + вкладка Полиамория
│   │   ├── BuildsPage.jsx    # (активна) Билды + вкладка Команда
│   │   ├── EquipmentPage.jsx # (активна) Шмот + Аура-синергия + Dark Urge
│   │   ├── PotionsPage.jsx
│   │   ├── PartyPage.jsx     # Отряд + Respec + Злые квесты
│   │   ├── MapPage.jsx       # Карта
│   │   ├── LorePage.jsx      # Лор + предыстории
│   │   ├── GalleryPage.jsx   # Концепт-арты
│   │   ├── AIPage.jsx        # ИИ-советник (чат с Claude)
│   │   └── AboutPage.jsx     # О Dark Urge пути
│   ├── components/
│   │   ├── Accordion.jsx
│   │   ├── DialogueBlock.jsx
│   │   ├── StepList.jsx
│   │   └── SearchOverlay.jsx # Глобальный поиск
│   ├── styles/
│   │   └── global.css        # Все стили + light/dark темы
│   ├── ThemeContext.jsx       # Контекст тёмной/светлой темы
│   ├── telegram.js           # Telegram WebApp SDK утилиты
│   ├── App.jsx               # Роутинг + топбар + навигация
│   └── main.jsx              # Точка входа
├── index.html
├── vite.config.js
├── vercel.json               # SPA rewrites для Vercel
├── README.md
└── DEPLOY.md
```

---

## ➕ Добавить новый контент

**Новый роман** → `src/data/romances.js`, добавь объект в `ROMANCES[]`

**Полиамория** → `src/data/romances.js`, редактируй `POLYAMORY` объект

**Новая локация на карте** → `src/data/locations.js`, добавь в `LOCATIONS[]` с координатами (x, y от 0 до 480/680)

**Новая экипировка** → `src/data/equipment.js`, добавь в `EQUIPMENT.act1/act2/act3.items[]`

**Аура-синергия шмот** → `src/data/equipment.js`, редактируй `AURA_SYNERGY_ITEMS[]`

**Dark Urge предметы** → `src/data/equipment.js`, редактируй `DARK_URGE_ITEMS[]`

**Новый сопартиец** → `src/data/party.js`, добавь в `COMPANION_CHECKLIST[]`

**Respec гайд** → `src/data/party.js`, редактируй `RESPEC_GUIDE[]`

**Злые квесты** → `src/data/party.js`, редактируй `EVIL_QUESTS[]`

**Новый лор** → `src/data/lore.js`, добавь в `WORLD_LORE[]` или `CHARACTER_LORE[]`

**Новый быстрый вопрос для ИИ** → `src/data/aiPrompt.js`, добавь строку в нужный раздел `QUICK_QUESTIONS[]`

> Поисковый индекс (`searchIndex.js`) обновляется автоматически — он читает данные из всех data-файлов напрямую.

---

## 🎨 Кастомизация

### Цвета (dark тема)
Все CSS переменные в `src/styles/global.css`, секция `:root`:
```css
--gold: #c9a84c          /* золото — заголовки, акценты */
--crimson-bright: #c42040 /* красный — активные элементы */
--purple: #3e1460         /* фиолетовый — магия */
```

### Светлая тема
Секция `[data-theme="light"]` в конце `global.css`. Переопределяет только нужные переменные.

### Шрифты
Загружаются из Google Fonts в `index.html`:
- **Cinzel** — все заголовки и лейблы
- **Cormorant Garamond** — основной текст

---

## 📊 Технический стек

| | Версия | Зачем |
|---|---|---|
| React | 18.3 | UI компоненты + хуки |
| Vite | 5.4 | Сборщик, dev-сервер, HMR |
| @twa-dev/sdk | 7.10 | Telegram Mini App API |
| Cinzel | — | BG3-стиль заголовков |
| Cormorant Garamond | — | Основной текст |

Нет внешних UI-библиотек — всё на чистом CSS с переменными.

---

## 🔧 Troubleshooting

| Проблема | Решение |
|----------|---------|
| Белый экран в Telegram | Проверь HTTPS, открой в браузере сначала |
| Шрифты не загружаются | Нужен интернет (Google Fonts CDN) |
| `Module not found` | `rm -rf node_modules && npm install` |
| ИИ-советник не отвечает | Нужен Anthropic API ключ — см. раздел ниже |
| Поиск не находит что-то | Проверь `searchIndex.js` — данные читаются из data-файлов |
| Вертикальная прокрутка закрывает Mini App | Обновись до последнего Telegram (TMA v6.9+) |

### Настройка ИИ-советника

Для работы вкладки **🩸 ИИ** нужен Anthropic API ключ. Получить на [console.anthropic.com](https://console.anthropic.com).

Запросы идут напрямую из браузера через `fetch` на `api.anthropic.com`. Чтобы это работало, нужно:

1. Добавить CORS-прокси или использовать edge функцию на Vercel
2. **Или** передавать ключ через переменную окружения в Vercel Edge Function

Простейший вариант — Vercel Edge Function (`/api/chat.js`):
```js
// api/chat.js — добавь этот файл, задеплой, измени URL в useAIChat.js
export default async function handler(req) {
  const body = await req.json()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })
  return new Response(res.body, { headers: { 'Content-Type': 'application/json' } })
}
export const config = { runtime: 'edge' }
```
На Vercel: **Settings → Environment Variables** → добавь `ANTHROPIC_API_KEY`.

---

*Создано для Dark Urge Oathbreaker прохождения BG3 с фокусом на Минтару.*
*Nightsong выживает. Отряд максимален. Тьма — наша сила.*
