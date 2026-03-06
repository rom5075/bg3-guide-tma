# 🩸 BG3 Guide TMA — Инструкция по деплою

---

## 📋 Структура проекта

```
bg3-guide-tma/
├── src/
│   ├── data/          ← Весь игровой контент
│   ├── pages/         ← 10 страниц
│   ├── components/    ← UI компоненты
│   ├── ai/            ← systemPrompt.js, profileExtractor.js, callAI.js
│   ├── db/            ← sqlite.js (БД), migrate.js (миграция Redis→SQLite)
│   ├── styles/        ← CSS (dark + light темы)
│   ├── ThemeContext.jsx
│   ├── App.jsx
│   ├── telegram.js
│   └── main.jsx
├── api/
│   ├── chat.js        ← Vercel Edge Function (ИИ-советник в Mini App)
│   └── webhook.js     ← Vercel Edge Function (не используется, оставлен)
├── bot/
│   └── webhook.js     ← VPS обработчик Telegram-вебхука (SQLite)
├── server.js          ← Express сервер для VPS
├── index.html
├── package.json
├── vite.config.js
├── vercel.json        ← SPA rewrites
└── .github/
    └── workflows/
        └── deploy.yml ← GitHub Actions → автодеплой на VPS
```

**Требования:** Node.js **22 LTS** (через nvm на VPS)
> ⚠️ Node 24 не поддерживается — `better-sqlite3` не компилируется

---

## 🏗️ Архитектура

```
Telegram
  └── Bot (Minthara)
       ├── Чат бота ──────────► VPS (server.js + bot/webhook.js)
       │                              └── SQLite (долгосрочная память)
       │                              └── Anthropic API (Claude)
       │
       └── Mini App кнопка ───► Vercel (React + Vite)
                                      ├── /api/chat  → Anthropic API
                                      └── SPA (10 вкладок)
```

---

## 🚀 Часть 1 — Mini App (Vercel)

### Шаг 1 — Загрузи на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bg3-guide-tma.git
git branch -M main
git push -u origin main
```

### Шаг 2 — Деплой на Vercel

1. https://vercel.com → **New Project** → импортируй репозиторий
2. Framework: **Vite** (авто), Build: `npm run build`, Output: `dist`
3. **Deploy**

После деплоя получишь URL: `https://YOUR_PROJECT.vercel.app`

> ✅ Каждый `git push` = автоматический редеплой Vercel.

### Шаг 3 — Переменные окружения на Vercel

**Settings → Environment Variables:**

| Переменная | Значение |
|-----------|---------|
| `ANTHROPIC_API_KEY` | Ключ с [console.anthropic.com](https://console.anthropic.com) |

---

## 🤖 Часть 2 — Telegram Bot (VPS)

### Шаг 1 — Создай бота в BotFather

1. [@BotFather](https://t.me/BotFather) → `/newbot`
2. Сохрани **Bot Token**

### Шаг 2 — Подготовь VPS

```bash
# Установить nvm + Node 22
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm alias default 22

# Установить PM2
npm install -g pm2

# Установить build tools (для native модулей)
apt install build-essential python3 -y

# Создать папку проекта
mkdir -p /var/www/minthara
```

### Шаг 3 — Клонировать репозиторий на VPS

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/bg3-guide-tma.git minthara
cd minthara
npm install
mkdir -p data
```

### Шаг 4 — Файл .env на VPS

Создай `/var/www/minthara/.env`:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
ANTHROPIC_API_KEY=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
DB_PATH=/var/www/minthara/data/minthara.db
PORT=3000
```

### Шаг 5 — Запустить бот через PM2

```bash
cd /var/www/minthara
pm2 start server.js --name minthara --node-args="--env-file=/var/www/minthara/.env"
pm2 save
pm2 logs minthara --lines 10
# Должно показать:
# [SQLite] DB ready: /var/www/minthara/data/minthara.db
# Minthara bot on :3000
```

### Шаг 6 — Зарегистрировать вебхук

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://ТВОЙ_ДОМЕН/api/webhook"
```

> Нужен nginx или reverse proxy чтобы HTTPS → port 3000.

### Шаг 7 — Привязать Mini App к боту

В BotFather: `/mybots` → твой бот → **Bot Settings** → **Menu Button**
- URL: `https://YOUR_PROJECT.vercel.app`
- Текст: `🗡 Открыть Гайд`

---

## 🔄 Автодеплой (GitHub Actions)

Файл `.github/workflows/deploy.yml` настроен на автоматический деплой при `git push` в `main`.

**Секреты GitHub** (Settings → Secrets → Actions):

| Secret | Значение |
|--------|---------|
| `VPS_HOST` | IP или домен VPS |
| `VPS_USER` | SSH пользователь (обычно `root`) |
| `VPS_SSH_KEY` | Приватный SSH ключ |

После настройки: каждый `git push main` автоматически деплоит на VPS (git pull + npm install + pm2 restart).

---

## 🗄️ Миграция данных Redis → SQLite (разово)

Если ранее использовался Redis (Upstash):

```bash
node --env-file=/var/www/minthara/.env /var/www/minthara/src/db/migrate.js
pm2 restart minthara
```

---

## 🔧 Разработка локально

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # проверить сборку
npm run preview  # превью dist/
```

Без Telegram SDK все фолбеки работают — приложение открывается в браузере.

---

## ✅ Чеклист перед запуском

**Mini App (Vercel):**
- [ ] `npm run build` без ошибок
- [ ] Vercel статус: **Ready**
- [ ] `ANTHROPIC_API_KEY` добавлен в Vercel
- [ ] Mini App открывается в Telegram

**Bot (VPS):**
- [ ] Node 22 установлен (`node -v` → v22.x.x)
- [ ] `.env` заполнен всеми ключами
- [ ] `pm2 status` → **online**
- [ ] Логи показывают `[SQLite] DB ready:`
- [ ] Вебхук зарегистрирован
- [ ] Бот отвечает на сообщения в Telegram

---

## ❓ Частые проблемы

| Проблема | Решение |
|----------|---------|
| `better-sqlite3` не компилируется | Используй Node 22 LTS (`nvm use 22`) |
| `pm2` не найден после смены Node | `npm install -g pm2` |
| Бот не отвечает | Проверь `pm2 logs` — смотри на ошибки при входящем сообщении |
| Белый экран в Mini App | URL должен быть HTTPS, проверь Vercel статус |
| `Module not found: express` | `npm install express` в папке проекта |
| Git pull конфликт | `git fetch origin main && git reset --hard origin/main` |

---

*Dark Urge · Oathbreaker · Minthara Path · BG3 Patch 7+*
