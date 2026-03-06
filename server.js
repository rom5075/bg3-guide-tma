import express from 'express'
import webhookHandler from './bot/webhook.js'  // VPS: uses SQLite (not api/webhook.js which is Vercel-only)
import chatHandler   from './api/chat.js'

const app = express()
app.use(express.json())

app.post('/api/webhook', async (req, res) => {
  const request = new Request('http://localhost/api/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  const response = await webhookHandler(request)
  res.status(response.status).type('json').send(await response.text())
})

app.post('/api/chat', async (req, res) => {
  const request = new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  const response = await chatHandler(request)
  res.status(response.status).type('json').send(await response.text())
})

app.listen(process.env.PORT || 3000, () =>
  console.log('Minthara bot on :3000'))
