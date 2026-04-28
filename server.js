import express from 'express'
import webhookHandler     from './bot/webhook.js'     // Telegram bot (SQLite)
import { chatHandler }    from './bot/chatHandler.js'  // Mini App REST API (SQLite)

const app = express()
app.use(express.json({ limit: '10mb' }))  // allow base64 images

// CORS preflight for all routes
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.status(200).end()
})

// Telegram webhook
app.post('/api/webhook', (req, res) => {
  res.sendStatus(200)  // respond immediately — Telegram won't retry
  const request = new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  webhookHandler(request).catch(err => console.error('[webhook] unhandled error:', err))
})

// Mini App chat — uses same SQLite DB as bot (unified memory)
app.post('/api/chat', chatHandler)

app.listen(process.env.PORT || 3000, () =>
  console.log('Minthara bot on :3000'))
