// Quick questions and storage config for AI chat UI
// System prompt is now in src/ai/systemPrompt.js (used server-side in api/chat.js)

// Suggested quick questions for the UI
export const QUICK_QUESTIONS = [
  {
    category: 'Минтара',
    color: '#e03060',
    icon: '💋',
    questions: [
      'Как начать роман с Минтарой в Акте 1?',
      'Что выбрать когда освобождаю Минтару из тюрьмы?',
      'Как поднять одобрение Минтары быстрее?',
      'Как удержать полиаморию с Астарионом и Лаэзель?',
    ],
  },
  {
    category: 'Отряд',
    color: '#6ab8d4',
    icon: '👥',
    questions: [
      'Как не потерять Карлах — нужен ли Dammon в Акте 2?',
      'Что говорить Шэдоухарт чтобы она не убила Найтсонг?',
      'Когда Лаэзель может уйти из команды?',
      'Как завербовать всех 7 компаньонов при рейде Рощи?',
    ],
  },
  {
    category: 'Билды',
    color: '#c9a84c',
    icon: '⚔️',
    questions: [
      'Как работает двойная Aura of Hate с Минтарой?',
      'Как сделать respec Минтары в Paladin/Wizard?',
      'Лучшее оружие для протагониста — Balduran\'s Giantslayer?',
      'Как настроить Астариона на максимальный урон в первый ход?',
    ],
  },
  {
    category: 'Прохождение',
    color: '#6abf69',
    icon: '🗺️',
    questions: [
      'В каком порядке проходить Акт 2?',
      'Как убить Кетерика Торма эффективно?',
      'Где найти Cloud Giant Elixir в Акте 3?',
      'Как пройти Wyrmway и убить Ansur?',
    ],
  },
]

// Storage key for chat history in Telegram CloudStorage
export const CHAT_STORAGE_KEY = 'bg3_ai_chat_v1'
export const MAX_HISTORY_MESSAGES = 20 // keep context window small
