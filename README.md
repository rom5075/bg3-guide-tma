# 🩸 BG3 Ultimate Guide — Экосистема Минтары

**Dark Urge · Oathbreaker · Minthara focus · Nightsong alive**

Полный гайд по прохождению BG3 на Dark Urge пути с фокусом на Минтару.
Включает четыре платформы: Telegram Mini App, бот с долгосрочной памятью, Windows overlay и iOS-приложение.

---

## 🗂️ Вкладки Mini App

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

## 📦 Платформы

### 📱 Telegram Mini App (Vercel)
React + Vite приложение внутри Telegram. Гайд + ИИ-советник.

### 🤖 Telegram бот (VPS)
Отдельный бот с ролевым режимом. SQLite память: профиль, воспоминания, интимные ночи, факты о пользователе.

### 🖥️ Windows Overlay (Electron)
Поверх-экрана приложение для игры. Собранный `.exe` в `dist-overlay/`.

### 📱 iOS App (SwiftUI) — *в разработке*
Нативное Swift-приложение. Только чат с Минтарой, подключается к VPS-бэкенду.
Исходники в `ios-app/`. Требует добавления `POST /api/chat` на VPS — см. `ios-app/BACKEND_CHANGES.md`.

---

## ✨ Фичи

- **🔍 Поиск** — глобальный по всему контенту
- **🌙 / ☀️ Тема** — тёмная / светлая
- **🩸 ИИ-советник** — чат с Claude, история через Telegram CloudStorage
- **🤖 Бот Минтары** — Telegram-бот с долгосрочной памятью (SQLite): профиль, воспоминания, интимный лог
- **🖥️ Overlay** — Electron поверх BG3, быстрый доступ к боту во время игры
- **📱 iOS** — нативное SwiftUI приложение с тёмной темой в стиле гайда
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
iOS приложение → **[ios-app/SETUP.md](./ios-app/SETUP.md)**

---

## 📁 Структура проекта

```
bg3-guide-tma/
│
├── src/                        ← Mini App (React + Vite)
│   ├── data/                   ← весь игровой контент
│   ├── pages/                  ← 10 вкладок
│   ├── components/             ← UI компоненты
│   ├── ai/                     ← systemPrompt, profileExtractor, callAI
│   ├── db/
│   │   ├── sqlite.js           ← SQLite модуль (better-sqlite3)
│   │   └── migrate.js          ← миграция Redis → SQLite (разовый)
│   ├── hooks/
│   │   └── useAIChat.js        ← Claude API + Telegram CloudStorage
│   ├── styles/global.css       ← все стили + light/dark темы
│   ├── App.jsx                 ← роутинг, топбар, навигация
│   ├── ThemeContext.jsx
│   ├── telegram.js
│   └── main.jsx
│
├── api/                        ← Vercel Edge Functions
│   ├── chat.js                 ← ИИ-советник Mini App
│   ├── remind.js               ← ежедневные напоминания (cron 10:00 UTC)
│   └── webhook.js              ← резерв
│
├── bot/
│   └── webhook.js              ← VPS обработчик Telegram-вебхука (SQLite)
│
├── server.js                   ← Express сервер для VPS (порт 3000)
│
├── electron/                   ← Windows Overlay
│   ├── main.js / preload.js
│   ├── chat.html / chat.js
│   ├── style.css
│   └── builder.json
│
├── dist-overlay/               ← собранный Electron .exe
│   └── win-unpacked/
│       └── Minthara Overlay.exe
│
├── ios-app/                    ← iOS App (SwiftUI, не трогает остальное)
│   ├── SETUP.md                ← как создать Xcode проект
│   ├── BACKEND_CHANGES.md      ← что добавить на VPS
│   └── Minthara/
│       ├── MintheraApp.swift   ← @main entry point
│       ├── Config.swift        ← URL, API key, userId
│       ├── Models/
│       │   └── Message.swift
│       ├── Services/
│       │   └── APIService.swift ← async/await HTTP клиент
│       ├── ViewModels/
│       │   └── ChatViewModel.swift
│       └── Views/
│           ├── ChatView.swift
│           ├── MessageBubble.swift
│           └── TypingIndicator.swift
│
├── public/
│   └── minthara.jpg
│
├── .github/workflows/
│   └── deploy.yml              ← push → Vercel + VPS (pm2 restart)
│
├── index.html
├── vite.config.js
├── vercel.json                 ← SPA rewrites
├── package.json
├── CLAUDE.md                   ← инструкции для Claude Code
├── DEPLOY.md
├── README.md
└── SERVER_INFO.md
```

---

## 📊 Технический стек

| Технология | Версия | Где |
|---|---|---|
| React | 18.3 | Mini App UI |
| Vite | 5.4 | Сборщик Mini App |
| SwiftUI | — | iOS App |
| Electron | — | Windows Overlay |
| @twa-dev/sdk | 7.10 | Telegram Mini App API |
| better-sqlite3 | 9.6 | SQLite для памяти бота |
| Express | 4.x | HTTP сервер на VPS |
| Anthropic SDK | — | Claude API (бот + советник) |
| Node.js | 22 LTS | VPS (обязательно 22, не 24) |

---

## 🎨 CSS-переменные (dark тема)

```css
--gold: #c9a84c           /* заголовки, акценты */
--crimson: #7a1225        /* тёмный фон карточек */
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
| iOS: нет ответа от сервера | Проверь `baseURL` и `apiKey` в `Config.swift`, добавлен ли `/api/chat` на VPS |

---

*Создано для Dark Urge Oathbreaker прохождения BG3 с фокусом на Минтару.*
*Nightsong выживает. Отряд максимален. Тьма — наша сила.*
