// ─── Minthara Overlay — Chat Logic ────────────────────────────────────────────

const MAX_HISTORY  = 20
const STORAGE_KEY  = 'minthara_overlay_history'

const QUICK_CHIPS = [
  { icon: '⚔️', label: 'Тактика',   text: 'Какая лучшая тактика в бою для Oathbreaker Paladin?' },
  { icon: '🛡️', label: 'Шмот',      text: 'Какой лучший шмот надеть в Акт 3?' },
  { icon: '❤️', label: 'Романс',    text: 'Ты скучала по мне, Минтара?' },
  { icon: '🌑', label: 'Dark Urge', text: 'Что важно знать при прохождении за Dark Urge?' },
  { icon: '🔄', label: 'Respec',    text: 'Когда лучше сделать respec? И как?' },
]

const MOOD_CONFIG = {
  neutral:    { color: '#4a7a4a', label: 'Нейтральна' },
  warm:       { color: '#c9a84c', label: 'Тепло'      },
  cold:       { color: '#6ab8d4', label: 'Холодна'    },
  irritated:  { color: '#c42040', label: 'Раздражена' },
  possessive: { color: '#8a3060', label: 'Властна'    },
  in_heat:    { color: '#c42040', label: 'Желает'     },
}

const ROMANCE_KW  = ['люблю', 'любовь', 'поцелу', 'обними', 'ночь', 'постель', 'флирт', 'хочу тебя', 'kiss', 'love']
const INTIMATE_KW = ['займёмся', 'займемся', 'переспи', 'в постель', 'секс', 'интим', 'трахн', 'желание', 'desire', 'fuck', 'undress']

// ─── State ────────────────────────────────────────────────────────────────────

let messages = []
let loading  = false
let mood     = 'neutral'

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  loadHistory()
  renderChips()
  renderAllMessages()
  updateMood(mood)
}

// ─── History (localStorage) ───────────────────────────────────────────────────

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        messages = parsed
      }
    }
  } catch {}
}

function saveHistory() {
  try {
    const trimmed = messages
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: m.content.slice(0, 400), ts: m.ts }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

// ─── Mood ─────────────────────────────────────────────────────────────────────

function updateMood(newMood) {
  mood = newMood
  const cfg   = MOOD_CONFIG[mood] || MOOD_CONFIG.neutral
  const dot   = document.getElementById('mood-dot')
  const label = document.getElementById('mood-label')
  dot.style.background = cfg.color
  dot.style.boxShadow  = `0 0 6px ${cfg.color}88`
  label.textContent    = cfg.label
  label.style.color    = cfg.color
}

// ─── Chips ────────────────────────────────────────────────────────────────────

function renderChips() {
  const container = document.getElementById('chips')

  // data-text + addEventListener — избегаем проблем с кавычками в onclick=""
  container.innerHTML = QUICK_CHIPS.map(c =>
    `<button class="chip" data-text="${c.text.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}">${c.icon} ${c.label}</button>`
  ).join('')

  container.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => handleSend(btn.dataset.text))
  })

  // Колёсико мыши → горизонтальный скролл
  container.addEventListener('wheel', e => {
    if (e.deltaY !== 0) {
      e.preventDefault()
      container.scrollLeft += e.deltaY * 0.8
    }
  }, { passive: false })
}

// ─── Render ───────────────────────────────────────────────────────────────────

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineMarkdown(text) {
  return escHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,     '<em>$1</em>')
    .replace(/`([^`]+)`/g,       '<code>$1</code>')
}

function renderMarkdown(text) {
  return text.split('\n')
    .filter(line => line.trim())
    .map(line => {
      if (/^#{1,2} /.test(line))   return `<div class="md-heading">${escHtml(line.replace(/^#{1,3} /, ''))}</div>`
      if (/^[-*•] /.test(line))    return `<div class="md-item">• ${inlineMarkdown(line.replace(/^[-*•] /, ''))}</div>`
      if (/^\d+\. /.test(line))    return `<div class="md-item">${inlineMarkdown(line)}</div>`
      return `<p>${inlineMarkdown(line)}</p>`
    })
    .join('')
}

function buildBubbleHTML(msg) {
  const isUser = msg.role === 'user'
  const time   = new Date(msg.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
  const content = isUser
    ? `<p>${escHtml(msg.content)}</p>`
    : renderMarkdown(msg.content)

  if (isUser) {
    return `
      <div class="message user">
        <div class="bubble-row">
          <div class="bubble bubble-user">
            ${content}
            <div class="bubble-time">${time}</div>
          </div>
        </div>
      </div>`
  }

  return `
    <div class="message assistant">
      <div class="sender-label">Минтара</div>
      <div class="bubble-row">
        <img class="bubble-avatar" src="../public/minthara.jpg" alt="M"
             onerror="this.style.background='linear-gradient(145deg,#0d1a3e,#5a0f20)'; this.src=''">
        <div class="bubble bubble-assistant">
          ${content}
          <div class="bubble-time">${time}</div>
        </div>
      </div>
    </div>`
}

function renderAllMessages() {
  const container = document.getElementById('messages')
  const empty     = document.getElementById('empty-state')

  if (messages.length === 0) {
    container.innerHTML = ''
    container.appendChild(empty)
    return
  }

  if (empty) empty.remove()
  container.innerHTML = messages.map(buildBubbleHTML).join('')
  scrollToBottom()
}

function appendBubble(msg) {
  const container = document.getElementById('messages')
  const empty     = document.getElementById('empty-state')
  if (empty) empty.remove()

  const div = document.createElement('div')
  div.innerHTML = buildBubbleHTML(msg)
  container.appendChild(div.firstElementChild)
  scrollToBottom()
}

function showTyping() {
  const container = document.getElementById('messages')
  const div       = document.createElement('div')
  div.id          = 'typing-indicator'
  div.innerHTML = `
    <div class="message assistant">
      <div class="sender-label">Минтара</div>
      <div class="bubble-row">
        <img class="bubble-avatar" src="../public/minthara.jpg" alt="M"
             onerror="this.style.background='linear-gradient(145deg,#0d1a3e,#5a0f20)'; this.src=''">
        <div class="bubble bubble-assistant typing-bubble">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>`
  container.appendChild(div)
  scrollToBottom()
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove()
}

function scrollToBottom() {
  const container = document.getElementById('messages')
  container.scrollTop = container.scrollHeight
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function updateSendBtn() {
  const btn  = document.getElementById('send-btn')
  const text = document.getElementById('msg-input').value.trim()
  if (loading) {
    btn.textContent = '⏹'
    btn.className   = 'loading'
  } else {
    btn.textContent = '🩸'
    btn.className   = text ? 'active' : ''
  }
}

function handleInput(el) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  updateSendBtn()
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (loading) return
    handleSend()
  }
}

// ─── Send ─────────────────────────────────────────────────────────────────────

async function handleSend(prefill) {
  if (loading) return

  const inputEl = document.getElementById('msg-input')
  const text    = prefill ?? inputEl.value.trim()
  if (!text) return

  // Clear input
  inputEl.value      = ''
  inputEl.style.height = 'auto'

  // Add user message
  const userMsg = { role: 'user', content: text, ts: new Date().toISOString() }
  messages.push(userMsg)
  appendBubble(userMsg)

  // Loading state
  loading = true
  updateSendBtn()
  window.overlay.setPulse(true)
  showTyping()

  // Build context for API
  const apiMessages = messages
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content }))

  const recentText   = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content.toLowerCase()).join(' ')
  const romanceMode  = ROMANCE_KW.some(kw  => recentText.includes(kw))
  const intimateMode = INTIMATE_KW.some(kw => recentText.includes(kw))

  // Call API via IPC → main.js → Vercel
  const result = await window.overlay.sendMessage({ messages: apiMessages, romanceMode, intimateMode })

  // Done loading
  hideTyping()
  window.overlay.setPulse(false)
  loading = false
  updateSendBtn()

  if (result.error) {
    const errMsg = {
      role:    'assistant',
      content: `⚠️ ${result.error}`,
      ts:      new Date().toISOString(),
    }
    messages.push(errMsg)
    appendBubble(errMsg)
  } else {
    const assistantMsg = {
      role:    'assistant',
      content: result.text || '…',
      ts:      new Date().toISOString(),
    }
    messages.push(assistantMsg)
    appendBubble(assistantMsg)
    if (result.mood) updateMood(result.mood)
  }

  saveHistory()
}

// ─── Start ────────────────────────────────────────────────────────────────────

init()
