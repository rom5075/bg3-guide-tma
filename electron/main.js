// ─── Minthara Overlay — Electron Main Process ─────────────────────────────────
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron')
const path = require('path')
const cfg  = require('./config.js')

let iconWin = null
let chatWin = null

// ─── Window creation ──────────────────────────────────────────────────────────

function createWindows() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // ── Icon window: 64×64, bottom-right corner, always on top ──────────────────
  iconWin = new BrowserWindow({
    width:       64,
    height:      64,
    x:           width  - 76,
    y:           height - 76,
    transparent: true,
    frame:       false,
    resizable:   false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable:   false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })
  iconWin.loadFile(path.join(__dirname, 'icon.html'))
  iconWin.setIgnoreMouseEvents(false)

  // ── Chat window: 350×555, above icon, initially hidden ──────────────────────
  chatWin = new BrowserWindow({
    width:       350,
    height:      555,
    x:           width  - 430,
    y:           height - 640,
    transparent: true,
    frame:       false,
    resizable:   false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show:        false,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })
  chatWin.loadFile(path.join(__dirname, 'chat.html'))
}

// ─── Toggle chat visibility ───────────────────────────────────────────────────

function toggleChat() {
  if (!chatWin) return
  if (chatWin.isVisible()) {
    chatWin.hide()
  } else {
    chatWin.show()
    chatWin.focus()
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindows()

  // Global hotkey (Alt+M by default)
  const registered = globalShortcut.register(cfg.HOTKEY, toggleChat)
  if (!registered) {
    console.warn(`[overlay] Could not register hotkey: ${cfg.HOTKEY}`)
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Prevent app from quitting when all windows are closed (keep in background)
app.on('window-all-closed', e => e.preventDefault())

// ─── IPC handlers ─────────────────────────────────────────────────────────────

// Icon clicked → toggle chat
ipcMain.on('toggle-chat', () => toggleChat())

// Chat closed (✕ button)
ipcMain.on('hide-chat', () => chatWin?.hide())

// Loading state → pulse the icon
ipcMain.on('set-pulse', (_, active) => {
  iconWin?.webContents.send('pulse', active)
})

// ── API call from renderer (avoids CORS — runs in Node.js, not browser) ───────
ipcMain.handle('minthara-chat', async (_, body) => {
  try {
    const res = await fetch(cfg.API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...body, userId: cfg.USER_ID }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return { error: err.error?.message || `HTTP ${res.status}` }
    }

    return await res.json()
  } catch (e) {
    return { error: e.message || 'Ошибка соединения' }
  }
})
