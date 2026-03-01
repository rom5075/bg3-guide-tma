// Telegram WebApp SDK utilities

export const tg = window.Telegram?.WebApp

export function initTelegram() {
  if (!tg) return
  tg.ready()
  tg.expand()
  tg.disableVerticalSwipes?.()
  // Set header color
  try { tg.setHeaderColor('#08050a') } catch (_) {}
  try { tg.setBackgroundColor('#08050a') } catch (_) {}
}

export function getThemeParams() {
  return tg?.themeParams ?? {}
}

export function isInTelegram() {
  return !!tg?.initData
}

export function haptic(style = 'light') {
  try { tg?.HapticFeedback?.impactOccurred(style) } catch (_) {}
}

export function showMainButton(text, onClick) {
  if (!tg?.MainButton) return
  tg.MainButton.setText(text)
  tg.MainButton.onClick(onClick)
  tg.MainButton.show()
}

export function hideMainButton() {
  tg?.MainButton?.hide()
}
