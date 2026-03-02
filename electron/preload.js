// ─── Minthara Overlay — Preload (Context Bridge) ──────────────────────────────
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('overlay', {
  // Toggle chat window (from icon click)
  toggleChat: () => ipcRenderer.send('toggle-chat'),

  // Hide chat (from ✕ button)
  hideChat: () => ipcRenderer.send('hide-chat'),

  // Signal loading state to icon (shows pulse animation)
  setPulse: (active) => ipcRenderer.send('set-pulse', active),

  // Send message to Minthara via main process (avoids CORS)
  sendMessage: (body) => ipcRenderer.invoke('minthara-chat', body),

  // Listen for pulse state updates (used by icon.html)
  onPulse: (callback) => ipcRenderer.on('pulse', (_, active) => callback(active)),
})
