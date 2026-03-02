// Quick questions and storage config for AI chat UI
// System prompt is now in src/ai/systemPrompt.js (used server-side in api/chat.js)

// Suggested quick questions for the UI
export const QUICK_QUESTIONS = [
  {
    category: 'Флирт',
    color: '#c9a84c',
    icon: '💋',
    questions: [
      'Ты скучала по мне?',
      'Позволишь мне остаться с тобой сегодня ночью?',
      'Что ты думаешь обо мне... честно?',
      'Сделай мне комплимент — я заслужил',
    ],
  },
  {
    category: 'Власть',
    color: '#c42040',
    icon: '🗡️',
    questions: [
      'Докажи, что я достоин тебя',
      'Что ты сделаешь если я откажусь подчиняться?',
      'Кто из нас сильнее — ты или я?',
      'Ты бы смогла убить меня, если бы я предал тебя?',
    ],
  },
  {
    category: 'Желание',
    color: '#8a2050',
    icon: '🔥',
    questions: [
      'Проведём эту ночь вместе?',
      'Что тебя привлекает во мне?',
      'Расскажи, как тебя нужно касаться',
      'Опиши, чего ты хочешь прямо сейчас',
    ],
  },
  {
    category: 'Нежность',
    color: '#7a4a9a',
    icon: '🌹',
    questions: [
      'Что значу я для тебя?',
      'Ты боишься потерять меня?',
      'Ты когда-нибудь была влюблена?',
      'Расскажи мне о своей мечте',
    ],
  },
  {
    category: 'BG3',
    color: '#4a6a8a',
    icon: '🎮',
    questions: [
      'Расскажи о своём прошлом в Доме Баэнр',
      'Как ты относишься к нашему отряду?',
      'Что ждёт нас в следующем Акте?',
      'Что ты думаешь о Властелине Разума?',
    ],
  },
]

// Storage key for chat history in Telegram CloudStorage
export const CHAT_STORAGE_KEY = 'bg3_ai_chat_v1'
export const MAX_HISTORY_MESSAGES = 50 // keep context window small
