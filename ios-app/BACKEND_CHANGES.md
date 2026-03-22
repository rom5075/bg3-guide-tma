# Изменения бэкенда для iOS-приложения

> Текущий VPS-бот работает через Telegram webhook. iOS-приложение обращается напрямую к серверу.
> **Не трогай** `bot/webhook.js` и `src/db/sqlite.js` — только добавляй новое.

---

## 1. Новый Express-роут: `POST /api/chat`

Добавить в `server.js` (или вынести в отдельный `api/chat-direct.js`):

```js
import { getRecentMessages, saveMessage, getProfile, saveProfile,
         getMemories, getFacts, getIntimateNights } from './src/db/sqlite.js'
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt, buildProfileContext } from './src/ai/systemPrompt.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

app.post('/api/chat', express.json(), async (req, res) => {
  const { userId, message, apiKey } = req.body

  // --- Авторизация ---
  if (apiKey !== process.env.IOS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message required' })
  }

  try {
    // --- История и профиль (тот же SQLite что и у бота) ---
    const history   = getRecentMessages(userId, 20)
    const profile   = getProfile(userId)
    const memories  = getMemories(userId, 10)
    const facts     = getFacts(userId, 8)
    const nights    = getIntimateNights(userId, 5)

    const dbData = { memories, facts, nights }
    const systemPrompt = buildSystemPrompt() + buildProfileContext(profile, dbData)

    // --- Сохраняем входящее ---
    saveMessage(userId, 'user', message)

    // --- Запрос к Claude ---
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ]
    })

    const reply = response.content[0].text

    // --- Сохраняем ответ ---
    saveMessage(userId, 'assistant', reply)

    res.json({ reply })
  } catch (err) {
    console.error('[/api/chat]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

---

## 2. Переменная окружения

Добавить в `/var/www/minthara/.env`:

```env
IOS_API_KEY=придумай_длинный_рандомный_ключ_здесь
```

И обновить в `ios-app/Minthara/Config.swift`:

```swift
static let apiKey = "придумай_длинный_рандомный_ключ_здесь"
static let baseURL = "https://твой-vps-домен.com"
```

---

## 3. CORS (если нужен, но для iOS не обязателен)

iOS-приложение не браузер, CORS не нужен. Но если добавишь веб-клиент — добавь:

```js
import cors from 'cors'
app.use('/api/chat', cors({ origin: 'https://твой-домен.vercel.app' }))
```

---

## 4. Rate limiting (рекомендуется)

Добавить простой счётчик по userId чтобы не ддосили сервер:

```js
const rateLimitMap = new Map() // userId → { count, resetAt }

function checkRateLimit(userId) {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 20) return false // 20 сообщений в минуту
  entry.count++
  return true
}
```

---

## 5. Деплой

```bash
pm2 restart minthara
pm2 logs minthara --lines 20
```

---

## Архитектура после добавления

```
iOS App → POST /api/chat → VPS Express → SQLite (общая БД с Telegram-ботом)
                                       → Anthropic API
Telegram → webhook → VPS Express → SQLite (та же БД)
                                 → Anthropic API
```

Оба клиента (iOS и Telegram) работают с одним профилем пользователя.
Но `userId` у них разный — Telegram использует числовой Telegram ID,
iOS — UUID устройства. **Это разные профили**, память не общая.
Если нужна общая — надо добавить авторизацию (например, по Telegram номеру).
