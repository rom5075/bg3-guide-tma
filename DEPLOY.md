# 🩸 BG3 Guide TMA — Инструкция по деплою

---

## 📋 Что у тебя есть

```
bg3-guide-tma/
├── src/
│   ├── data/          ← Весь игровой контент
│   ├── pages/         ← 10 страниц (v2)
│   ├── components/    ← UI компоненты + SearchOverlay
│   ├── styles/        ← CSS (dark + light темы)
│   ├── ThemeContext.jsx
│   ├── App.jsx
│   ├── telegram.js
│   └── main.jsx
├── dist/              ← Готовая сборка (если уже собрано)
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

**Требования:** Node.js 18+ или 20+ LTS

---

## 🚀 Деплой — шаг за шагом

### Шаг 1 — Проверь Node.js

```bash
node --version   # нужно v18+ или v20+
npm --version    # нужно 9+
```

Если нет — скачай с https://nodejs.org (LTS версия).

---

### Шаг 2 — Установи зависимости и проверь сборку

```bash
cd bg3-guide-tma
npm install
npm run build
# → ✓ built in X.XXs — всё ок
```

Для проверки локально:
```bash
npm run dev
# Открой http://localhost:5173
```

---

### Шаг 3 — Загрузи на GitHub

1. Зайди на https://github.com → **New repository**
2. Название: `bg3-guide-tma`
3. Visibility: **Public** (требование Vercel Free)
4. Нажми **Create repository** (без README — он уже есть)

```bash
cd bg3-guide-tma

git init
git add .
git commit -m "Initial commit — BG3 Ultimate Guide TMA"

# Замени YOUR_USERNAME на свой GitHub ник
git remote add origin https://github.com/YOUR_USERNAME/bg3-guide-tma.git
git branch -M main
git push -u origin main
```

---

### Шаг 4 — Деплой на Vercel

1. Зайди на https://vercel.com → **Sign Up через GitHub**
2. Нажми **New Project**
3. Найди `bg3-guide-tma` → **Import**
4. Настройки оставь дефолтными — Vercel сам определит Vite:
   - Framework: **Vite** (авто)
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Нажми **Deploy**

Через ~30-60 секунд получишь URL:
```
https://YOUR_PROJECT.vercel.app
```

> ✅ Теперь каждый `git push` = автоматический редеплой.

---

### Шаг 5 — Создай Telegram Bot

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. `/newbot`
3. Имя: `BG3 Ultimate Guide`
4. Username: `bg3_ultimateguide_bot` (или любой свободный, должен кончаться на `_bot`)
5. Сохрани **Bot Token** — он нужен для следующего шага

---

### Шаг 6 — Привяжи Mini App к боту

**Вариант A — через кнопку меню (рекомендуется):**

В BotFather:
```
/mybots
```
→ Выбери бота → **Bot Settings** → **Menu Button** → **Configure menu button**

- URL кнопки: `https://YOUR_PROJECT.vercel.app`
- Текст: `🗡 Открыть Гайд`

**Вариант B — отдельное Mini App приложение:**

```
/newapp
```
→ Выбери бота → заполни:

| Поле | Значение |
|------|----------|
| Title | BG3 Ultimate Guide |
| Description | Гайд: романы, билды, карта, лор, арты |
| Photo | Картинка 640×360px |
| Web App URL | https://YOUR_PROJECT.vercel.app |

Получишь ссылку вида `https://t.me/bg3_ultimateguide_bot/app`

---

### Шаг 7 — Настрой ИИ-советника (вкладка 🩸)

Вкладка ИИ использует Anthropic API. Без ключа чат покажет ошибку соединения.

**Получи ключ:** [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key

**Добавь Vercel Edge Function** — создай файл `api/chat.js` в корне проекта:

```js
export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
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
  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
export const config = { runtime: 'edge' }
```

**Добавь переменную окружения на Vercel:**
1. Vercel Dashboard → твой проект → **Settings** → **Environment Variables**
2. Добавь: `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Сохрани → **Redeploy**

**Обнови URL в `src/hooks/useAIChat.js`:**
```js
// Замени строку с fetch:
const res = await fetch('/api/chat', {   // вместо api.anthropic.com
```

После этого запросы пойдут через твой Vercel Edge Function, ключ не светится на клиенте.

---

### Шаг 8 — Проверка

1. Найди бота в Telegram → нажми кнопку меню
2. Mini App откроется прямо внутри Telegram
3. Проверь все 10 вкладок: Романы / Билды / Шмот / Зелья / Отряд / Карта / Лор / Арты / ИИ / Путь
4. Проверь поиск (🔍 в топбаре) — введи "Минтара" или "Астарион"
5. Проверь переключатель темы (🌙/☀️ в топбаре)

---

## 🔄 Обновление контента

```bash
# Внеси изменения в src/data/
# Например, добавь новую локацию в src/data/locations.js

git add .
git commit -m "Update: добавил локацию Last Light Inn"
git push
# Vercel автоматически задеплоит через ~30 сек
```

---

## 🧪 Тестирование Telegram-специфики локально

Telegram WebApp SDK работает только внутри Telegram. Для тестирования SDK на реальном устройстве используй ngrok:

```bash
# Терминал 1 — запусти dev сервер
npm run dev

# Терминал 2 — создай туннель
npx ngrok http 5173
# Получишь URL вида: https://xxxx.ngrok.io

# В BotFather временно поменяй Web App URL на ngrok URL
```

---

## 🌐 Переменные окружения (если нужны)

Создай `.env.local` в корне проекта:
```env
VITE_APP_VERSION=1.0.0
```

В коде: `import.meta.env.VITE_APP_VERSION`

На Vercel: **Project Settings** → **Environment Variables** → добавь те же переменные.

---

## ✅ Чеклист перед публикацией

- [ ] `npm run build` проходит без ошибок
- [ ] Приложение открывается в браузере на `localhost:5173`
- [ ] Все 10 вкладок работают
- [ ] Поиск находит результаты
- [ ] Светлая тема переключается
- [ ] ИИ-советник отвечает (нужен API ключ)
- [ ] Код запушен на GitHub
- [ ] Vercel задеплоил (статус: **Ready**)
- [ ] URL открывается в браузере (не только localhost)
- [ ] Бот создан в BotFather
- [ ] Web App URL привязан к боту
- [ ] Mini App открывается внутри Telegram

---

## ❓ Частые проблемы

**Белый экран в Telegram**
- URL должен быть HTTPS (Vercel даёт автоматически)
- Открой тот же URL в браузере телефона — должно работать
- Проверь `vercel.json` — должны быть rewrites для SPA

**`npm install` падает**
- Проверь версию Node: `node --version` (нужно 18+)
- Попробуй: `npm install --legacy-peer-deps`

**Шрифты не загружаются**
- Нужен интернет при первом открытии (Google Fonts CDN)
- Шрифт Cinzel и Cormorant Garamond загружаются из `fonts.googleapis.com`

**Поиск не находит что-то новое**
- `searchIndex.js` читает данные напрямую из data-файлов — пересборка не нужна
- Убедись что добавил данные в правильный файл и правильный массив

**Вертикальный свайп закрывает Mini App**
- Уже отключено через `tg.disableVerticalSwipes()` в `telegram.js`
- Если не работает — требуется Telegram 9.0+ (TMA SDK v6.9+)

---

## 📱 Требования Telegram Mini Apps

Все уже соблюдены в проекте:

- ✅ HTTPS URL (Vercel)
- ✅ `<meta name="viewport" content="width=device-width, initial-scale=1">` без zoom
- ✅ Telegram WebApp SDK подключён через CDN в `index.html`
- ✅ `tg.ready()` вызывается при загрузке (`initTelegram()` в App.jsx)
- ✅ `tg.expand()` — разворачивает на весь экран
- ✅ `tg.disableVerticalSwipes()` — отключает случайное закрытие
- ✅ Цвета хедера подхватываются из Telegram темы через CSS-переменные `--tg-theme-*`

---

## 🏗️ Архитектура приложения

```
Telegram
  └── Bot
       └── Menu Button → Web App URL (Vercel)
                              └── React App (SPA)
                                   ├── TopBar (Поиск + Тема)
                                   ├── Pages (10 вкладок)
                                   │    ├── RomancesPage   (Романы + Полиамория)
                                   │    ├── BuildsPage     (Билды + Команда)
                                   │    ├── EquipmentPage  (Шмот + Аура + Dark Urge)
                                   │    ├── PotionsPage
                                   │    ├── PartyPage      (Отряд + Respec + Квесты)
                                   │    ├── MapPage
                                   │    ├── LorePage
                                   │    ├── GalleryPage
                                   │    ├── AIPage
                                   │    └── AboutPage
                                   ├── SearchOverlay (оверлей)
                                   └── BottomNav (скролл)
```

---

*Dark Urge · Oathbreaker · Minthara Path*
*BG3 Patch 7+*
