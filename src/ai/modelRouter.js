// Model routing: Haiku for simple roleplay, Sonnet for complex guide queries

const GUIDE_KEYWORDS = {
  builds: ['билд', 'build', 'класс', 'class', 'паладин', 'paladin', 'маг', 'wizard',
           'клирик', 'cleric', 'уровень', 'level', 'мультикласс', 'характеристик',
           'stat', 'str', 'dex', 'cha', 'респек', 'respec', 'oathbreaker', 'gloom',
           'assassin', 'tempest', 'necromancy', 'battle master', 'прокачк', 'feat',
           'черта', 'способност', 'spell slot', 'divine smite', 'aura'],
  equipment: ['шлем', 'helm', 'меч', 'sword', 'броня', 'armour', 'armor', 'кольц',
              'ring', 'снаряж', 'equip', 'предмет', 'item', 'где найти', 'щит', 'shield',
              'плащ', 'cloak', 'сапог', 'boot', 'амулет', 'amulet', 'giantslayer',
              'birthright', 'crimson', 'nyrulna', 'phalar', 'adamant', 'haste helm',
              'arcane acuity', 'bhaalspawn', 'agility', 'conduit'],
  romances: ['роман', 'romance', 'отношен', 'постель', 'полиамор', 'polyamor',
             'ревность', 'jealous', 'одобрен', 'approval', 'поцелу', 'ночь',
             'sharess', 'гарем', 'флирт', 'люблю', 'любов', 'сцен'],
  party: ['компаньон', 'companion', 'партия', 'party', 'кто взять', 'состав',
          'карлах', 'karlach', 'гейл', 'gale', 'вилл', 'wyll', 'халсин', 'halsin',
          'шэдоухарт', 'shadowheart', 'лаэзель', 'laezel', 'астарион', 'astarion',
          'минтар', 'minthara', 'dammon', 'infernal iron', 'nightsong'],
  potions: ['зелье', 'potion', 'эликсир', 'elixir', 'расходник', 'consumable',
            'алхимия', 'alchemy', 'cloud giant', 'haste', 'akabi', 'цирк', 'circus',
            'hill giant', 'invisib'],
  map: ['карта', 'map', 'локация', 'location', 'куда идти', 'как найти', 'как добраться',
        'навигация', 'акт 1', 'акт 2', 'акт 3', 'act 1', 'act 2', 'act 3',
        'роща', 'grove', 'moonrise', 'lower city', 'нижний город', 'baldur',
        'grymforge', 'underdark', 'андердарк', 'wyrmway', 'seatower', 'bhaal temple',
        'shattered sanctum', 'last light', 'rivington'],
}

const COMPLEX_KEYWORDS = [
  'сравни', 'объясни подробно', 'почему лучше', 'стратегия', 'оптимал',
  'что выбрать', 'разница между', 'прохожден', 'пошагово', 'что делать дальше',
  'я сейчас в', 'я на уровне', 'застрял', 'не могу пройти', 'помоги с боссом',
  'весь акт', 'порядок', 'последовательность',
]

/**
 * @param {string} message
 * @returns {{ model: string, queryType: string, knowledgeKeys: string[] }}
 */
export function routeQuery(message) {
  const lower = message.toLowerCase()
  const knowledgeKeys = []

  for (const [key, keywords] of Object.entries(GUIDE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      knowledgeKeys.push(key)
    }
  }

  const isGameProgress = ['я сейчас', 'я на', 'что дальше', 'застрял', 'следующ', 'я в акте'].some(kw => lower.includes(kw))
  const isComplex = COMPLEX_KEYWORDS.some(kw => lower.includes(kw)) || message.length > 300

  // Game progress — needs map + party context → Haiku (fast)
  if (isGameProgress) {
    return {
      model: 'claude-haiku-4-5-20251001',
      queryType: 'game_progress',
      knowledgeKeys: [...new Set([...knowledgeKeys, 'map', 'party'])],
    }
  }

  // Complex multi-section or long query → Sonnet
  if (isComplex || knowledgeKeys.length > 2) {
    return {
      model: 'claude-sonnet-4-5-20250929',
      queryType: 'complex_advice',
      knowledgeKeys,
    }
  }

  // Guide lookup → Haiku
  if (knowledgeKeys.length > 0) {
    return {
      model: 'claude-haiku-4-5-20251001',
      queryType: 'guide_lookup',
      knowledgeKeys,
    }
  }

  // Pure roleplay → Haiku
  return {
    model: 'claude-haiku-4-5-20251001',
    queryType: 'roleplay',
    knowledgeKeys: [],
  }
}
