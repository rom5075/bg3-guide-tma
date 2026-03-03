// ─── Minthara Overlay — Config Template ───────────────────────────────────────
// Скопируй этот файл в config.js и заполни своими данными.
// config.js добавлен в .gitignore — он никогда не попадёт в GitHub.

module.exports = {
  // Твой Telegram User ID (числовой).
  // Узнать: написать @userinfobot в Telegram → он ответит твоим ID.
  // Благодаря этому профиль/настроение Минтары синхронизируются
  // между оверлеем, Mini App и Telegram-ботом.
  USER_ID: 'ВАШ_TG_USER_ID',

  // URL твоего Vercel-деплоя (тот же что в Mini App и Telegram-боте).
  API_URL: 'https://ВАШ_ПРОЕКТ.vercel.app/api/chat',

  // Горячая клавиша для показа/скрытия чата.
  // Формат Electron: 'Alt+M', 'Ctrl+Shift+M', 'F12', etc.
  HOTKEY: 'Alt+M',
}
