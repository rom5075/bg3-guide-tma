// Compact knowledge base for Minthara AI — used by both Mini App and Bot
// Data extracted from BG3_Dark_Urge_Ultimate_Guide_FINAL.md

const KNOWLEDGE = {
  builds: {
    protagonist: {
      name: 'Dark Urge — Oathbreaker Paladin 12',
      race: 'Lolth-Sworn Drow',
      stats: { str: 8, dex: 16, con: 14, int: 8, wis: 10, cha: 17 },
      note: 'STR 8 dump → Cloud Giant Elixir (STR 27). Все очки в CHA.',
      key_features: ['Aura of Hate (Lv7): +CHA к melee всем', 'Aura of Protection (Lv6): +CHA к saves', 'Improved Divine Smite (Lv11): +1d8 бесплатно', 'Animate Dead → нежить с бонусом ауры'],
      feats: ['Lv4: Great Weapon Master', 'Lv8: +2 CHA (→19)', 'Lv12: Savage Attacker'],
      oathbreaker: 'Oath of Vengeance → уничтожь Рощу → Oathbreaker автоматически',
      style: 'Стой рядом с Минтарой (двойная аура). Bless → GWM → Smite на критах.',
    },
    minthara: {
      name: 'Oathbreaker Paladin 7 / Necromancy Wizard 5',
      respec_when: 'Сразу после освобождения из тюрьмы Moonrise (Акт 2). 100 золота.',
      stats: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 16 },
      key_features: ['Вторая Aura of Hate', 'Animate Dead (Wiz 5)', 'Fireball', 'Haste'],
      style: 'Двойная аура стакается = +6-10 к каждой melee-атаке обоих',
    },
    astarion: {
      name: 'Gloom Stalker 5 / Assassin 4 / Champion 3',
      respec_when: 'Начало Акта 2 или 3 (нужен Lv10+)',
      key_features: ['Assassinate (автокрит)', 'Dread Ambusher (3 атаки)', 'Champion: крит 19-20', '6 атак в 1 ход'],
      style: 'Nova первого хода: невидимость → 6 автокрит-атак.',
    },
    shadowheart: {
      name: 'Tempest Cleric 8 / Storm Sorcerer 4',
      respec_when: 'После Gauntlet of Shar (Акт 2)',
      key_features: ['Twinned Haste (2 союзника)', 'Destructive Wrath (макс. молния)', 'Healing Word'],
      style: 'Twinned Haste на протагониста + Минтару. Поддержка молниями.',
    },
    laezel: {
      name: 'Battle Master Fighter 12',
      respec_when: 'Не нужен — просто Battle Master на Lv3',
      key_features: ['Trip Attack → advantage всем', 'Action Surge', '3 Extra Attacks', 'Sentinel'],
      style: 'Trip → все бьют с advantage → GWM.',
    },
    gale: {
      name: 'Evocation Wizard 12',
      respec_when: 'Не нужен — Evocation на Lv2',
      key_features: ['Sculpt Spells (Fireball мимо своих)', 'Counterspell', 'Animate Dead'],
      note: 'Бенч-персонаж. Для AoE-боёв.',
    },
  },

  equipment: {
    act1: [
      { name: 'Phalar Aluve', type: 'Longsword', priority: 'S', location: 'Подземье — меч в камне (Insight или STR DC14)', effect: 'Shriek: -1d4 атаки врагов. Melody: +1d4 урон союзников' },
      { name: 'Adamantine Shield', type: 'Щит', priority: 'S', location: 'Grymforge — Adamantine Forge (Mithral Ore + Shield Mould)', effect: 'Атакующие: Reeling. Крит → обычный' },
      { name: 'Haste Helm', type: 'Шлем', priority: 'A', location: 'Лут с гоблинов в Shattered Sanctum или сундуки в Blighted Village', effect: 'Momentum при убийстве' },
      { name: 'Boots of Striding', type: 'Сапоги', priority: 'A', location: 'Торговцы в лагере гоблинов или Blighted Village', effect: 'Иммунитет к скользким поверхностям' },
    ],
    act2: [
      { name: 'Helmet of Arcane Acuity', type: 'Шлем', priority: 'S', location: 'Last Light Inn — убить Tsolak (зомби-офицер у входа)', effect: '+1 Spell Save DC при убийстве заклинанием (макс +4)' },
      { name: 'Strange Conduit Ring', type: 'Кольцо', priority: 'S', location: 'Moonrise Towers — сундуки/трупы', effect: 'При концентрации: +1d4 психического к атакам' },
      { name: 'Ketheric\'s Shield', type: 'Щит', priority: 'S', location: 'Ketheric Thorm — финальный босс Акта 2', effect: '+3 Saves, иммунитет Frightened' },
      { name: 'Disintegrating Night Walkers', type: 'Сапоги', priority: 'A', location: 'True Soul Nere — Grymforge', effect: 'Misty Step 1/день, иммунитет обездвиживание' },
    ],
    act3: [
      { name: 'Balduran\'s Giantslayer', type: 'Greatsword', priority: 'S', location: 'Дракон Ansur — Wyrmway (туннели под Lower City, 4 испытания)', effect: '+3. Двойной STR mod. С Cloud Giant = +16 урона' },
      { name: 'Crimson Mischief', type: 'Shortsword', priority: 'S', location: 'Bhaal Temple — Sarevok Anchev', effect: '+7. С advantage +7 некротич. Для Астариона' },
      { name: 'Nyrulna', type: 'Trident', priority: 'S', location: 'Circus of Last Days — лотерея Akabi (бесплатная попытка)', effect: '+3. 3d6 молниевого. Возвращается' },
      { name: 'Birthright', type: 'Шлем', priority: 'S', location: 'Sorcerous Sundries — торговец в Baldur\'s Gate', effect: '+2 CHA → CHA 17→19→21 с Birthright. Усиливает ауры.' },
      { name: 'Bhaalspawn Armour', type: 'Тяжёлая броня', priority: 'S', location: 'Bhaal Temple — Dark Urge эксклюзив', effect: 'AC 17. +2 атака. Lifesteal 1d6' },
      { name: 'Armour of Agility', type: 'Средняя броня', priority: 'A', location: 'Wyrm\'s Rock Fortress — тюрьма B2', effect: 'AC 18 без штрафа стелс' },
      { name: 'Shelter of Athkatla', type: 'Щит', priority: 'A', location: 'Stormshore Armoury, Нижний Город', effect: '+2 AC. Blur при уроне' },
      { name: 'Ring of Regeneration', type: 'Кольцо', priority: 'A', location: 'Stormshore Tabernacle, Нижний Город', effect: '1d6 HP/ход' },
    ],
  },

  romances: {
    polyamory: {
      concept: 'Минтара (королева) + Астарион + Лаэзель. Все три до эпилога.',
      warning: 'Сохраняйся перед каждым поли-диалогом.',
    },
    act1: {
      minthara: 'Рейд на Рощу → Long Rest → Минтара приходит ночью → прими',
      astarion: 'Позволь укусить в лагере (1-2 Long Rest)',
      laezel: 'Поединок в лагере → ночная сцена',
      conflicts: 'Нет конфликтов в Акте 1',
    },
    act2_jealousy: {
      order: 'Лаэзель → Минтара → Астарион',
      laezel_trigger: '«Ты делишь постель с дроу и вампиром?»',
      laezel_answer: '«Я — командир. Я беру то, что хочу. А ты — моя воительница.»',
      minthara_trigger: '«Ты развлекаешься с вампиром и гитьянкой?»',
      minthara_answer: '«Ты — моя королева. Они просто развлечение. Но ты главная.»',
      astarion_trigger: '«О, darling, коллекционируешь дроу и гитьянок?»',
      astarion_answer: 'Любой игривый ответ',
      critical: 'Сохраняйся перед КАЖДЫМ Long Rest!',
    },
    act3: {
      group_scene: 'Sharess\' Caress (бордель Lower City). Drow Twins. Одобрение >60 у всех.',
      epilogue: 'Все три остаются. Спец. сцена на вечеринке.',
    },
    minthara_details: {
      approves: 'Жёсткие решения, сила, убийства, амбиции, Dark Urge поступки',
      hates: 'Милосердие, помощь слабым, покорность',
      act1: 'Shattered Sanctum — западный коридор, у стола с картой',
      act2_prison: 'Moonrise Towers подвал — 3я камера слева. Тихо освободить!',
      romance_trigger: '«Я пришёл за тобой. Ты — моя.»',
    },
  },

  party: {
    summary: '7 из 8 компаньонов. Вилл — неизбежная потеря.',
    companions: {
      minthara: { steps: 'Shattered Sanctum → рейд Рощу → Long Rest → Акт 2: тюрьма Moonrise (3я камера, тихо!) → respec', note: 'Карлах НЕ умирает при рейде (она у реки).' },
      astarion: { steps: 'Берег к северу → укус → поли-диалог → Акт 3: Казадор — НЕ позволяй Ритуал', note: 'Аскенда необратимо меняет. Останови ритуал.' },
      shadowheart: { steps: 'Ворота Рощи → не критикуй Шар → Gauntlet of Shar → НЕ убивай Nightsong → respec', note: 'Nightsong должна жить.' },
      laezel: { steps: 'Клетка на холме → поединок → поли-диалог → Creche Y\'llek', note: 'Battle Master 12 — respec не нужен.' },
      gale: { steps: 'Разрыв в скале → 3 магических предмета → НЕ позволяй Орб', note: 'Evocation Wizard 12.' },
      karlach: { steps: 'Река NW от Waukeen\'s Rest → Infernal Iron (Blighted Village + Grymforge) → Dammon (Last Light Inn)', note: 'НЕ брать в партию при рейде Рощи — теряет одобрение.' },
      wyll: { note: 'ПОТЕРЯН. Уходит при рейде Рощи. Невозможно сохранить.' },
    },
  },

  potions: {
    priority_S: [
      { name: 'Elixir of Cloud Giant Strength', effect: 'STR 27 на Long Rest', where: 'Akabi (джинн в Circus of Last Days, Rivington, Акт 3). Алхимия: Cloud Giant Finger.', note: 'ОСНОВА БИЛДА. Покупай у ВСЕХ аптекарей. Скупать весь запас каждый Long Rest.' },
      { name: 'Potion of Speed', effect: 'Haste 3 хода. Доп. действие, +2 AC', where: 'Алхимия или торговцы', note: 'Бэкап если Шэдоухарт не Twinned Haste. 5-10 штук.' },
    ],
    priority_A: [
      { name: 'Elixir of Hill Giant Strength', effect: 'STR 21 на Long Rest', where: 'Алхимия/торговцы', note: 'Для Лаэзель или замена Cloud Giant в ранних актах' },
      { name: 'Potion of Invisibility', effect: 'Невидимость 10 ходов', where: 'Алхимия', note: 'Астарион: невидимость → Assassinate' },
      { name: 'Superior Healing Potion', effect: '~28 HP', where: 'Алхимия/торговцы', note: '5-10 на каждого. Бонусное действие.' },
    ],
    akabi_location: 'Circus of the Last Days, Rivington — первая зона Акта 3 ДО города. Большой шатёр. Akabi — джинн в синей одежде, правая часть цирка.',
  },

  map: {
    act1: [
      { name: 'Изумрудная Роща', priority: 'S', desc: 'УНИЧТОЖИТЬ с Минтарой. 🚨 Точка невозврата — Вилл уходит навсегда.' },
      { name: 'Shattered Sanctum', priority: 'S', desc: 'Лагерь гоблинов. Минтара у карты (западный коридор). Haste Helm здесь.' },
      { name: 'Андердарк / Grymforge', priority: 'A', desc: 'Phalar Aluve (меч в камне), Adamantine Forge, Infernal Iron для Карлах.' },
      { name: 'Blighted Village', priority: 'B', desc: 'Торговцы, ранняя экипировка, Infernal Iron.' },
    ],
    act2: [
      { name: 'Moonrise Towers', priority: 'S', desc: 'Минтара в тюрьме (подвал, 3я камера слева). Освободить тихо! Кетерик — финальный босс.' },
      { name: 'Gauntlet of Shar', priority: 'S', desc: 'Квест Шэдоухарт. НЕ убивай Nightsong. От Last Light Inn на ЮВ.' },
      { name: 'Last Light Inn', priority: 'A', desc: 'Dammon (ремонт Карлах). Tsolak у входа (Helmet of Arcane Acuity).' },
      { name: 'Creche Y\'llek', priority: 'B', desc: 'Квест Лаэзель. Rosymorn Monastery Trail.' },
    ],
    act3: [
      { name: 'Bhaal Temple', priority: 'S', desc: 'Орин → Bhaalspawn Armour + Crimson Mischief (Sarevok). Dark Urge эксклюзив.' },
      { name: 'Wyrmway / Seatower', priority: 'S', desc: 'Дракон Ansur → Balduran\'s Giantslayer. 4 испытания в туннелях под Lower City.' },
      { name: 'Circus of Last Days', priority: 'S', desc: 'Rivington. Akabi (Cloud Giant Elixir + Nyrulna лотерея).' },
      { name: 'Wyrm\'s Rock Fortress', priority: 'A', desc: 'Горташ. Birthright (+2 CHA) в Sorcerous Sundries рядом. Тюрьма B2: Armour of Agility.' },
      { name: 'Sharess\' Caress', priority: 'A', desc: 'Групповая поли-сцена. Нижний Город. Одобрение >60 у всех.' },
    ],
  },
}

/**
 * @param {string[]} keys
 * @returns {string}
 */
export function getKnowledgeContext(keys) {
  if (!keys || keys.length === 0) return ''

  let context = ''
  for (const key of keys) {
    if (KNOWLEDGE[key]) {
      const json = JSON.stringify(KNOWLEDGE[key], null, 0)
      const trimmed = json.length > 4000 ? json.slice(0, 4000) + '...(truncated)' : json
      context += `\n### ${key.toUpperCase()}:\n${trimmed}\n`
    }
  }
  return context
}
