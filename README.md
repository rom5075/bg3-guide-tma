# 🩸 BG3 Ultimate Guide — Telegram Mini App

**Dark Urge · Oathbreaker · Minthara focus · Nightsong alive**

React + Vite приложение для Telegram Mini App. Полный гайд по прохождению BG3 на Dark Urge пути с фокусом на Минтару. Включает ИИ-бота Минтары с долгосрочной памятью на SQLite.

---

## 🗂️ Вкладки приложения

| Иконка | Вкладка | Содержание |
|--------|---------|-----------|
| 💋 | **Романы** | Все романтические линии + **Система полиамории** (Минтара + Астарион + Лаэзель) |
| ⚔️ | **Билды** | Oathbreaker Paladin 12 + 5 билдов компаньонов · Двойная Aura of Hate |
| 🛡️ | **Шмот** | Экипировка по актам · **Аура-синергия** · Dark Urge эксклюзив |
| 🧪 | **Зелья** | Алхимия, расходники, топ-12 зелий для тёмного пути |
| 👥 | **Отряд** | Удержать 7 из 8 · Respec гайд · Злые квесты |
| 🗺️ | **Карта** | SVG карта важных локаций всех трёх актов |
| 📜 | **Лор** | Предыстории персонажей + лор мира |
| 🎨 | **Арты** | Оригинальные SVG концепт-арты Минтары |
| 🩸 | **ИИ** | Claude-советник: ответы по Dark Urge пути в реальном времени |
| 📖 | **Путь** | Сводка Dark Urge пути, ключевые выборы, концовки |

---

## ✨ Фичи

- **🔍 Поиск** — глобальный по всему контенту
- **🌙 / ☀️ Тема** — тёмная / светлая
- **🩸 ИИ-советник** — чат с Claude, история через Telegram CloudStorage
- **🤖 Бот Минтары** — отдельный Telegram-бот с долгосрочной памятью (SQLite)
- **Haptic feedback** — тактильный отклик при навигации
- **Fullscreen** — SVG арты в полноэкранном просмотрщике

---

## 🚀 Быстрый старт

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # продакшен сборка
```

Полная инструкция по деплою → **[DEPLOY.md](./DEPLOY.md)**

---

## 📁 Структура проекта

```
bg3-guide-tma/
├── src/
│   ├── data/               ← Весь игровой контент
│   ├── pages/              ← 10 страниц (вкладки)
│   ├── components/         ← UI компоненты
│   ├── ai/                 ← systemPrompt, profileExtractor, callAI
│   ├── db/
│   │   ├── sqlite.js       ← SQLite модуль (better-sqlite3)
│   │   └── migrate.js      ← Миграция Redis → SQLite (разовый скрипт)
│   ├── hooks/
│   │   └── useAIChat.js    ← Хук: Claude API + Telegram CloudStorage
│   ├── styles/global.css   ← Все стили + light/dark темы
│   ├── App.jsx             ← Роутинг + топбар + навигация
│   ├── ThemeContext.jsx
│   ├── telegram.js
│   └── main.jsx
├── api/
│   ├── chat.js             ← Vercel Edge Function (Mini App ИИ)
│   └── webhook.js          ← Vercel Edge Function (резерв)
├── bot/
│   └── webhook.js          ← VPS обработчик Telegram-вебхука (SQLite)
├── server.js               ← Express сервер для VPS
├── index.html
├── vite.config.js
├── vercel.json             ← SPA rewrites
└── .github/workflows/
    └── deploy.yml          ← Автодеплой на VPS
```

---

## 📊 Технический стек

| | Версия | Зачем |
|---|---|---|
| React | 18.3 | UI компоненты |
| Vite | 5.4 | Сборщик, dev-сервер |
| @twa-dev/sdk | 7.10 | Telegram Mini App API |
| better-sqlite3 | 9.6 | SQLite для долгосрочной памяти бота |
| Express | 4.x | HTTP сервер на VPS |
| Cinzel | — | BG3-стиль заголовков |
| Cormorant Garamond | — | Основной текст |

---

## 🎨 CSS-переменные (dark тема)

```css
--gold: #c9a84c           /* заголовки, акценты */
--crimson-bright: #c42040 /* активные элементы */
--purple: #3e1460         /* магия */
--bg-dark: #0a050f        /* основной фон */
```

---

## 🔧 Troubleshooting

| Проблема | Решение |
|----------|---------|
| Белый экран в Telegram | Проверь HTTPS, открой в браузере |
| `Module not found` | `rm -rf node_modules && npm install` |
| ИИ-советник не отвечает | Нужен `ANTHROPIC_API_KEY` на Vercel |
| Бот не отвечает | `pm2 logs minthara` — смотри ошибки |
| `better-sqlite3` не собирается | Node должен быть 22 LTS (`nvm use 22`) |

---

*Создано для Dark Urge Oathbreaker прохождения BG3 с фокусом на Минтару.*
*Nightsong выживает. Отряд максимален. Тьма — наша сила.*
