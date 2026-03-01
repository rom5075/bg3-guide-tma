// AI system prompt for the BG3 Dark Urge advisor
// Built from guide data — compact but informative

import { BUILDS } from './builds'
import { COMPANION_CHECKLIST } from './party'
import { LOCATIONS } from './locations'
import { CHARACTER_LORE } from './lore'

export function buildSystemPrompt() {
  const buildSummaries = BUILDS.map(b =>
    `${b.name} (${b.class}): ${b.summary}`
  ).join('\n')

  const companionSummary = COMPANION_CHECKLIST.map(c =>
    `${c.name} [${c.statusLabel}]: ${c.steps.length} шагов, акт ${c.act}+`
  ).join('\n')

  const keyLocations = LOCATIONS.filter(l => l.priority === 'critical').map(l =>
    `${l.name} (${l.act.replace('act','Акт ')}): ${l.desc.substring(0, 100)}...`
  ).join('\n')

  const charSummaries = CHARACTER_LORE.map(c =>
    `${c.name} — ${c.subtitle}. ${c.sections[0]?.text?.substring(0, 120) || ''}...`
  ).join('\n')

  return `Ты — ИИ-советник по игре Baldur's Gate 3, специализирующийся на Dark Urge / Oathbreaker прохождении с фокусом на роман с Минтарой. Ты встроен в Telegram Mini App — гайд по BG3.

ТВОЯ РОЛЬ:
- Персональный советник по тёмному пути BG3
- Отвечаешь на русском языке (если вопрос по-русски) или английском (если по-английски)
- Кратко, по делу, без лишней воды
- Используй игровую терминологию BG3

ПУТЬ ИГРОКА:
- Класс: Dark Urge (кастомный персонаж) — Paladin 5 / Warlock 7 (Oathbreaker + The Fiend)
- Цель: максимальное зло, роман с Минтарой, Nightsong живёт, максимум сопартийцев
- Акты: уничтожаем Рощу в Акте 1 (= Минтара присоединяется, Вилл уходит)
- Вилл — единственная неизбежная потеря

АКТИВНЫЕ КОМПАНЬОНЫ (7 из 8):
${companionSummary}

БИЛДЫ:
${buildSummaries}

КЛЮЧЕВЫЕ ЛОКАЦИИ:
${keyLocations}

ПЕРСОНАЖИ — КРАТКО:
${charSummaries}

ПРАВИЛА ОТВЕТОВ:
1. Если спрашивают о механике — объясни конкретно с цифрами
2. Если спрашивают о диалогах — дай конкретный выбор реплики
3. Если спрашивают о квесте — пошаговый ответ
4. Если неоднозначный вопрос — уточни акт и ситуацию
5. Спойлеры давай только если явно просят
6. Предупреждай о точках невозврата жирным или 🚨
7. Максимум 3-4 абзаца или список — не пиши роман
8. Если чего-то не знаешь точно — скажи честно

ПРИМЕРЫ ХОРОШИХ ВОПРОСОВ:
- "Как завербовать Астариона если я уже уничтожил рощу?"
- "Когда брать мультикласс Warlock?"
- "Что выбрать в диалоге с Минтарой в тюрьме?"
- "Лучший способ убить Кетерика?"
- "Как не потерять Карлах?"

Начни помогать сразу, без вводных фраз типа "Конечно!", "Отличный вопрос!" и прочего.`
}

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
      'Какие Dark Urge действия она одобряет?',
    ],
  },
  {
    category: 'Отряд',
    color: '#6ab8d4',
    icon: '👥',
    questions: [
      'Как не потерять Гейла в Акте 1?',
      'Как удержать Карлах — нужен ли Dammon в Акте 2?',
      'Что говорить Шэдоухарт чтобы она не убила Найтсонг?',
      'Когда Лаэзель может уйти из команды?',
    ],
  },
  {
    category: 'Билды',
    color: '#c9a84c',
    icon: '⚔️',
    questions: [
      'Когда брать мультикласс Warlock для Палладина?',
      'Что лучше: Great Weapon Master или ASI для Минтары?',
      'Лучшее оружие для Астариона в финале?',
      'Как настроить Гейла для максимального AoE?',
    ],
  },
  {
    category: 'Прохождение',
    color: '#6abf69',
    icon: '🗺️',
    questions: [
      'В каком порядке проходить Акт 2?',
      'Как убить Кетерика Торма эффективно?',
      'Что не пропустить в Андердарке?',
      'Лучший порядок боссов в Акте 3?',
    ],
  },
]

// Storage key for chat history in Telegram CloudStorage
export const CHAT_STORAGE_KEY = 'bg3_ai_chat_v1'
export const MAX_HISTORY_MESSAGES = 20 // keep context window small
