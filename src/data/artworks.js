// Minthara concept art gallery — original SVG illustrations

// Each "artwork" is a SVG scene rendered inline
// Style: dark fantasy concept art aesthetic

export const MINTHARA_ART = [
  {
    id: 'throne',
    title: 'Владычица тени',
    subtitle: 'Облачение паладина Шар',
    medium: 'Концепт — Персонаж',
    description: 'Минтара в полном доспехе на фоне Moonrise Towers. Фиолетовое свечение луны отражается в чёрной стали. В руке — боевой цеп Шар.',
    mood: 'Власть · Холод · Величие',
    palette: ['#0d0118', '#2a0638', '#7b1fa2', '#e03060', '#c9a84c'],
    svgScene: 'throne',
  },
  {
    id: 'goblin_camp',
    title: 'Первая встреча',
    subtitle: 'Лагерь гоблинов · Акт I',
    medium: 'Концепт — Сцена',
    description: 'Силуэт Минтары в арке ворот лагеря. Позади — огни костров. Она смотрит на тебя с оценивающим прищуром.',
    mood: 'Опасность · Интерес · Сила',
    palette: ['#150008', '#3a0012', '#c42040', '#ff6b35', '#8a6a00'],
    svgScene: 'goblin_camp',
  },
  {
    id: 'underdark',
    title: 'Дитя Подземья',
    subtitle: 'Мензоберранзан · Предыстория',
    medium: 'Концепт — Предыстория',
    description: 'Молодая Минтара среди шпилей дроу-города. Синие грибы светятся в темноте. Выражение лица — смесь гордости и предчувствия изгнания.',
    mood: 'Тоска · Гордость · Потеря',
    palette: ['#020118', '#0a0540', '#1a0856', '#4a90d9', '#9b59b6'],
    svgScene: 'underdark',
  },
  {
    id: 'moonrise',
    title: 'Пленница',
    subtitle: 'Тюрьма Moonrise Towers · Акт II',
    medium: 'Концепт — Ключевой момент',
    description: 'Минтара в цепях в полутьме камеры. Лунный свет через решётку. Взгляд не сломлен — она ждёт.',
    mood: 'Стойкость · Ярость · Ожидание',
    palette: ['#050814', '#0e1830', '#1a3060', '#4a6fa5', '#c0c8d8'],
    svgScene: 'moonrise',
  },
  {
    id: 'romance',
    title: 'Союз тёмных',
    subtitle: 'Лагерь · Ночь после рейда',
    medium: 'Концепт — Роман',
    description: 'Минтара и протагонист у костра. Она не смотрит на него — смотрит в огонь. Но её рука касается его.',
    mood: 'Близость · Напряжение · Тепло',
    palette: ['#0e0508', '#2a1008', '#7a2400', '#c44010', '#e8a050'],
    svgScene: 'romance',
  },
  {
    id: 'warrior',
    title: 'Гнев Баэнре',
    subtitle: 'Боевая стойка',
    medium: 'Концепт — Боевой арт',
    description: 'Минтара в прыжке с поднятым оружием. Вихрь теневой энергии вокруг. Враги видят это последним.',
    mood: 'Ярость · Мощь · Смерть',
    palette: ['#0a0008', '#300010', '#800020', '#e03060', '#ffffff'],
    svgScene: 'warrior',
  },
]

// SVG scene generators
export function renderMintharaScene(sceneId, colors) {
  const scenes = {
    throne: `
      <defs>
        <radialGradient id="bg_t" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stop-color="${colors[2]}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="glow_t" cx="50%" cy="30%" r="40%">
          <stop offset="0%" stop-color="${colors[3]}" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="${colors[3]}" stop-opacity="0"/>
        </radialGradient>
        <filter id="blur_t"><feGaussianBlur stdDeviation="3"/></filter>
        <filter id="glow_f"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <!-- Background -->
      <rect width="320" height="420" fill="url(#bg_t)"/>
      <!-- Moon glow -->
      <ellipse cx="160" cy="80" rx="80" ry="70" fill="url(#glow_t)" filter="url(#blur_t)"/>
      <!-- Moon -->
      <circle cx="160" cy="60" r="38" fill="none" stroke="${colors[2]}" stroke-width="1" opacity="0.5"/>
      <circle cx="160" cy="60" r="34" fill="${colors[2]}" opacity="0.15"/>
      <!-- Tower silhouettes -->
      <rect x="0" y="160" width="60" height="260" fill="${colors[0]}" opacity="0.9"/>
      <rect x="10" y="120" width="40" height="60" fill="${colors[0]}" opacity="0.9"/>
      <rect x="260" y="140" width="60" height="280" fill="${colors[0]}" opacity="0.9"/>
      <rect x="270" y="100" width="40" height="60" fill="${colors[0]}" opacity="0.9"/>
      <!-- Throne base -->
      <rect x="100" y="320" width="120" height="100" rx="4" fill="${colors[1]}" opacity="0.8"/>
      <!-- Figure - body -->
      <rect x="130" y="200" width="60" height="130" rx="8" fill="${colors[0]}"/>
      <!-- Armour details -->
      <rect x="128" y="200" width="64" height="20" rx="4" fill="${colors[2]}" opacity="0.6"/>
      <line x1="160" y1="200" x2="160" y2="330" stroke="${colors[3]}" stroke-width="1" opacity="0.4"/>
      <!-- Cape -->
      <path d="M130,210 Q80,280 90,380 L130,380 L130,210Z" fill="${colors[1]}" opacity="0.7"/>
      <path d="M190,210 Q240,280 230,380 L190,380 L190,210Z" fill="${colors[1]}" opacity="0.7"/>
      <!-- Head -->
      <ellipse cx="160" cy="185" rx="22" ry="26" fill="#3a1a2a"/>
      <!-- Face -->
      <ellipse cx="152" cy="182" rx="3" ry="4" fill="${colors[3]}" opacity="0.9" filter="url(#glow_f)"/>
      <ellipse cx="168" cy="182" rx="3" ry="4" fill="${colors[3]}" opacity="0.9" filter="url(#glow_f)"/>
      <!-- White hair -->
      <path d="M138,172 Q160,155 182,172" stroke="white" stroke-width="2" fill="none" opacity="0.8"/>
      <line x1="148" y1="163" x2="145" y2="150" stroke="white" stroke-width="1.5" opacity="0.7"/>
      <line x1="160" y1="160" x2="160" y2="146" stroke="white" stroke-width="1.5" opacity="0.7"/>
      <line x1="172" y1="163" x2="175" y2="150" stroke="white" stroke-width="1.5" opacity="0.7"/>
      <!-- Weapon -->
      <line x1="195" y1="210" x2="240" y2="310" stroke="${colors[4]}" stroke-width="3" opacity="0.9"/>
      <circle cx="240" cy="314" r="8" fill="${colors[3]}" opacity="0.8" filter="url(#glow_f)"/>
      <!-- Shar symbol on chest -->
      <circle cx="160" cy="240" r="10" fill="none" stroke="${colors[2]}" stroke-width="1.5" opacity="0.7"/>
      <line x1="160" y1="230" x2="160" y2="250" stroke="${colors[2]}" stroke-width="1" opacity="0.7"/>
      <line x1="150" y1="240" x2="170" y2="240" stroke="${colors[2]}" stroke-width="1" opacity="0.7"/>
      <!-- Floor reflection -->
      <rect x="0" y="380" width="320" height="40" fill="${colors[0]}" opacity="0.95"/>
      <ellipse cx="160" cy="382" rx="50" ry="6" fill="${colors[2]}" opacity="0.15"/>
    `,

    goblin_camp: `
      <defs>
        <radialGradient id="fire1" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stop-color="#ff6b35" stop-opacity="0.5"/>
          <stop offset="60%" stop-color="#c42040" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </radialGradient>
        <filter id="glow_g"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="blur_g"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <rect width="320" height="420" fill="${colors[0]}"/>
      <rect width="320" height="420" fill="url(#fire1)"/>
      <!-- Background fires -->
      <ellipse cx="60" cy="380" rx="30" ry="20" fill="#ff6b35" opacity="0.3" filter="url(#blur_g)"/>
      <ellipse cx="260" cy="360" rx="25" ry="18" fill="#c44010" opacity="0.3" filter="url(#blur_g)"/>
      <ellipse cx="280" cy="400" rx="20" ry="15" fill="#ff8c00" opacity="0.25" filter="url(#blur_g)"/>
      <!-- Gate arch -->
      <path d="M40,420 L40,180 Q160,100 280,180 L280,420Z" fill="none" stroke="${colors[1]}" stroke-width="3" opacity="0.7"/>
      <rect x="40" y="180" width="240" height="8" fill="${colors[1]}" opacity="0.5"/>
      <!-- Gate wood planks -->
      <rect x="38" y="180" width="12" height="240" fill="#2a1008" opacity="0.9"/>
      <rect x="270" y="180" width="12" height="240" fill="#2a1008" opacity="0.9"/>
      <!-- Skulls on gate -->
      <circle cx="50" cy="200" r="7" fill="#d4c0a0" opacity="0.6"/>
      <circle cx="270" cy="200" r="7" fill="#d4c0a0" opacity="0.6"/>
      <!-- Minthara silhouette in arch -->
      <!-- Body -->
      <rect x="138" y="240" width="44" height="120" rx="6" fill="#1a0810"/>
      <!-- Cape effect -->
      <path d="M138,250 Q110,320 120,380 L138,380Z" fill="#0e0408" opacity="0.9"/>
      <path d="M182,250 Q210,320 200,380 L182,380Z" fill="#0e0408" opacity="0.9"/>
      <!-- Head -->
      <ellipse cx="160" cy="228" rx="20" ry="24" fill="#1e0a14"/>
      <!-- Glowing eyes - looking at viewer -->
      <ellipse cx="153" cy="225" rx="4" ry="3" fill="${colors[2]}" filter="url(#glow_g)" opacity="0.95"/>
      <ellipse cx="167" cy="225" rx="4" ry="3" fill="${colors[2]}" filter="url(#glow_g)" opacity="0.95"/>
      <!-- White hair cascade -->
      <path d="M142,210 Q135,230 130,260" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M148,206 Q143,228 138,255" stroke="white" stroke-width="1.5" fill="none" opacity="0.6"/>
      <path d="M178,210 Q185,230 190,260" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>
      <!-- Armour highlight -->
      <path d="M148,245 L148,260 M172,245 L172,260" stroke="${colors[2]}" stroke-width="1" opacity="0.5"/>
      <!-- Foreground fire flicker -->
      <path d="M0,420 Q30,340 20,280 Q50,360 80,420Z" fill="#c42040" opacity="0.25"/>
      <path d="M320,420 Q290,350 300,290 Q270,370 240,420Z" fill="#c44010" opacity="0.2"/>
      <!-- Ground -->
      <rect x="0" y="390" width="320" height="30" fill="#0a0404" opacity="0.8"/>
    `,

    underdark: `
      <defs>
        <radialGradient id="ud_bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="${colors[3]}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </radialGradient>
        <filter id="mushr"><feGaussianBlur stdDeviation="6"/></filter>
        <filter id="star"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="320" height="420" fill="${colors[0]}"/>
      <rect width="320" height="420" fill="url(#ud_bg)"/>
      <!-- Stalactites -->
      <polygon points="30,0 50,80 10,80" fill="${colors[1]}" opacity="0.7"/>
      <polygon points="90,0 115,100 65,100" fill="${colors[1]}" opacity="0.6"/>
      <polygon points="200,0 225,90 175,90" fill="${colors[1]}" opacity="0.65"/>
      <polygon points="280,0 305,75 255,75" fill="${colors[1]}" opacity="0.7"/>
      <!-- Glowing mushrooms - background -->
      <ellipse cx="30" cy="380" rx="20" ry="8" fill="${colors[3]}" opacity="0.3" filter="url(#mushr)"/>
      <ellipse cx="290" cy="370" rx="18" ry="7" fill="${colors[4]}" opacity="0.3" filter="url(#mushr)"/>
      <ellipse cx="160" cy="400" rx="40" ry="12" fill="${colors[3]}" opacity="0.2" filter="url(#mushr)"/>
      <!-- City spires background -->
      <rect x="20" y="200" width="30" height="220" fill="${colors[1]}" opacity="0.5"/>
      <rect x="35" y="160" width="16" height="60" fill="${colors[1]}" opacity="0.5"/>
      <rect x="240" y="190" width="35" height="230" fill="${colors[1]}" opacity="0.5"/>
      <rect x="248" y="155" width="18" height="55" fill="${colors[1]}" opacity="0.5"/>
      <rect x="70" y="220" width="20" height="200" fill="${colors[1]}" opacity="0.4"/>
      <rect x="210" y="210" width="22" height="210" fill="${colors[1]}" opacity="0.4"/>
      <!-- Figure - young Minthara -->
      <!-- Body -->
      <rect x="140" y="250" width="40" height="110" rx="5" fill="${colors[1]}"/>
      <!-- Dress/robes -->
      <path d="M140,270 Q120,320 125,370 L140,370Z" fill="${colors[1]}" opacity="0.8"/>
      <path d="M180,270 Q200,320 195,370 L180,370Z" fill="${colors[1]}" opacity="0.8"/>
      <!-- Armour/jewelry -->
      <path d="M145,252 L175,252 L178,268 L142,268Z" fill="${colors[2]}" opacity="0.5"/>
      <!-- Head -->
      <ellipse cx="160" cy="238" rx="19" ry="22" fill="#3a1a2a"/>
      <!-- Eyes - younger, wider -->
      <ellipse cx="153" cy="234" rx="3.5" ry="3" fill="${colors[3]}" opacity="0.9"/>
      <ellipse cx="167" cy="234" rx="3.5" ry="3" fill="${colors[3]}" opacity="0.9"/>
      <!-- Long white hair straight down -->
      <rect x="144" y="215" width="3" height="80" rx="1" fill="white" opacity="0.8"/>
      <rect x="149" y="212" width="2" height="90" rx="1" fill="white" opacity="0.7"/>
      <rect x="155" y="210" width="2.5" height="95" rx="1" fill="white" opacity="0.75"/>
      <rect x="162" y="210" width="2.5" height="90" rx="1" fill="white" opacity="0.7"/>
      <rect x="168" y="212" width="2" height="85" rx="1" fill="white" opacity="0.65"/>
      <rect x="173" y="215" width="3" height="80" rx="1" fill="white" opacity="0.8"/>
      <!-- Crown/headpiece of house Baenre -->
      <path d="M144,216 L148,206 L155,214 L160,203 L165,214 L172,206 L176,216" stroke="${colors[4]}" stroke-width="1.5" fill="none" opacity="0.9"/>
      <!-- Bioluminescent mushroom she's touching -->
      <ellipse cx="100" cy="350" rx="15" ry="6" fill="${colors[3]}" opacity="0.6" filter="url(#mushr)"/>
      <rect x="107" y="310" width="6" height="44" rx="3" fill="${colors[3]}" opacity="0.4"/>
      <ellipse cx="110" cy="308" rx="12" ry="5" fill="${colors[3]}" opacity="0.7"/>
      <!-- Hand reaching to mushroom -->
      <line x1="140" y1="295" x2="122" y2="310" stroke="#3a1a2a" stroke-width="4" stroke-linecap="round"/>
      <!-- Floating spores -->
      <circle cx="80" cy="280" r="2" fill="${colors[3]}" opacity="0.7"/>
      <circle cx="95" cy="260" r="1.5" fill="${colors[3]}" opacity="0.5"/>
      <circle cx="115" cy="270" r="1" fill="${colors[3]}" opacity="0.6"/>
      <circle cx="200" cy="300" r="2" fill="${colors[4]}" opacity="0.5"/>
    `,

    moonrise: `
      <defs>
        <linearGradient id="mr_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${colors[2]}" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </linearGradient>
        <filter id="ray"><feGaussianBlur stdDeviation="8"/></filter>
        <filter id="glow_m"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="320" height="420" fill="${colors[0]}"/>
      <rect width="320" height="420" fill="url(#mr_bg)"/>
      <!-- Light ray through bars -->
      <rect x="145" y="0" width="30" height="420" fill="${colors[3]}" opacity="0.06" filter="url(#ray)"/>
      <!-- Prison bars -->
      <rect x="100" y="0" width="8" height="200" fill="${colors[1]}" opacity="0.9" rx="2"/>
      <rect x="140" y="0" width="8" height="200" fill="${colors[1]}" opacity="0.9" rx="2"/>
      <rect x="180" y="0" width="8" height="200" fill="${colors[1]}" opacity="0.9" rx="2"/>
      <rect x="220" y="0" width="8" height="200" fill="${colors[1]}" opacity="0.9" rx="2"/>
      <!-- Horizontal bar -->
      <rect x="80" y="140" width="170" height="10" fill="${colors[1]}" opacity="0.8" rx="2"/>
      <!-- Chains -->
      <line x1="130" y1="180" x2="140" y2="240" stroke="${colors[1]}" stroke-width="3" stroke-dasharray="6,4" opacity="0.6"/>
      <line x1="190" y1="180" x2="180" y2="240" stroke="${colors[1]}" stroke-width="3" stroke-dasharray="6,4" opacity="0.6"/>
      <!-- Minthara sitting against wall -->
      <!-- Legs -->
      <rect x="130" y="330" width="60" height="90" rx="5" fill="#1e0a14"/>
      <!-- Body leaning slightly -->
      <rect x="132" y="230" width="56" height="110" rx="8" fill="#1e0a14"/>
      <!-- Arms restrained above -->
      <rect x="115" y="220" width="25" height="8" rx="4" fill="#1e0a14" transform="rotate(-20, 127, 224)"/>
      <rect x="180" y="220" width="25" height="8" rx="4" fill="#1e0a14" transform="rotate(20, 192, 224)"/>
      <!-- Chain manacles -->
      <circle cx="120" cy="216" r="7" fill="none" stroke="${colors[1]}" stroke-width="2" opacity="0.7"/>
      <circle cx="200" cy="216" r="7" fill="none" stroke="${colors[1]}" stroke-width="2" opacity="0.7"/>
      <!-- Head - raised, defiant -->
      <ellipse cx="160" cy="215" rx="20" ry="23" fill="#3a1a2a"/>
      <!-- Eyes glowing - defiant, looking up at bars -->
      <ellipse cx="153" cy="210" rx="3.5" ry="3" fill="${colors[3]}" opacity="0.9" filter="url(#glow_m)" transform="rotate(-5, 153, 210)"/>
      <ellipse cx="167" cy="210" rx="3.5" ry="3" fill="${colors[3]}" opacity="0.9" filter="url(#glow_m)" transform="rotate(-5, 167, 210)"/>
      <!-- Hair dishevelled -->
      <path d="M141,200 Q130,215 125,240" stroke="white" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M146,196 Q137,212 133,235" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M179,200 Q188,215 192,240" stroke="white" stroke-width="2.5" fill="none" opacity="0.7"/>
      <path d="M174,196 Q182,210 186,232" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>
      <!-- Moon light patch on floor -->
      <ellipse cx="160" cy="400" rx="60" ry="15" fill="${colors[3]}" opacity="0.1" filter="url(#ray)"/>
      <!-- Shadow/darkness -->
      <rect x="0" y="350" width="80" height="70" fill="${colors[0]}" opacity="0.7"/>
      <rect x="240" y="350" width="80" height="70" fill="${colors[0]}" opacity="0.7"/>
    `,

    romance: `
      <defs>
        <radialGradient id="fire_r" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stop-color="#c44010" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </radialGradient>
        <filter id="glow_r"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <rect width="320" height="420" fill="${colors[0]}"/>
      <rect width="320" height="420" fill="url(#fire_r)"/>
      <!-- Stars -->
      <circle cx="40" cy="30" r="1" fill="white" opacity="0.6"/>
      <circle cx="80" cy="60" r="1.5" fill="white" opacity="0.5"/>
      <circle cx="250" cy="40" r="1" fill="white" opacity="0.7"/>
      <circle cx="290" cy="80" r="1" fill="white" opacity="0.4"/>
      <circle cx="150" cy="20" r="1" fill="white" opacity="0.5"/>
      <circle cx="200" cy="50" r="1.5" fill="white" opacity="0.6"/>
      <!-- Tree silhouettes -->
      <rect x="10" y="200" width="8" height="220" fill="${colors[1]}" opacity="0.8"/>
      <ellipse cx="14" cy="195" rx="20" ry="30" fill="${colors[1]}" opacity="0.7"/>
      <rect x="295" y="210" width="8" height="210" fill="${colors[1]}" opacity="0.8"/>
      <ellipse cx="299" cy="205" rx="18" ry="28" fill="${colors[1]}" opacity="0.7"/>
      <!-- Campfire glow -->
      <ellipse cx="160" cy="380" rx="45" ry="20" fill="#c44010" opacity="0.3" filter="url(#soft)"/>
      <ellipse cx="160" cy="370" rx="30" ry="15" fill="#ff8c00" opacity="0.25" filter="url(#soft)"/>
      <!-- Fire flames -->
      <path d="M145,370 Q155,340 160,360 Q165,340 175,370Z" fill="#ff6b35" opacity="0.8"/>
      <path d="M148,370 Q158,350 160,365 Q162,350 172,370Z" fill="#ffa040" opacity="0.7"/>
      <path d="M150,370 Q160,358 170,370Z" fill="#ffcc60" opacity="0.9"/>
      <!-- Minthara - sitting, looking into fire -->
      <!-- Right figure (Minthara) -->
      <rect x="175" y="280" width="42" height="110" rx="8" fill="#1a0810"/>
      <path d="M175,295 Q155,330 160,390 L175,390Z" fill="#110508" opacity="0.9"/>
      <!-- Her head - turned slightly to fire, but hand reaching left -->
      <ellipse cx="196" cy="267" rx="18" ry="21" fill="#3a1a2a"/>
      <ellipse cx="189" cy="264" rx="3" ry="2.5" fill="${colors[3]}" opacity="0.85" filter="url(#glow_r)"/>
      <ellipse cx="200" cy="263" rx="2.5" ry="2" fill="${colors[3]}" opacity="0.7"/>
      <!-- Hair flowing -->
      <path d="M180,252 Q173,268 168,290" stroke="white" stroke-width="2.5" fill="none" opacity="0.75"/>
      <path d="M185,250 Q179,265 175,285" stroke="white" stroke-width="2" fill="none" opacity="0.65"/>
      <path d="M210,254 Q217,270 220,295" stroke="white" stroke-width="2" fill="none" opacity="0.65"/>
      <!-- Her arm reaching to hold hand -->
      <line x1="175" y1="310" x2="148" y2="320" stroke="#1a0810" stroke-width="8" stroke-linecap="round"/>
      <!-- Left figure (protagonist) darker -->
      <rect x="103" y="285" width="40" height="105" rx="8" fill="#0e0508" opacity="0.9"/>
      <ellipse cx="123" cy="272" rx="17" ry="20" fill="#1e0a14"/>
      <!-- Hands touching in middle -->
      <ellipse cx="152" cy="322" rx="10" ry="6" fill="#2a1018" opacity="0.8"/>
      <!-- Fire light on Minthara's face -->
      <ellipse cx="193" cy="268" rx="12" ry="10" fill="#ff6b35" opacity="0.07" filter="url(#soft)"/>
      <!-- Ground -->
      <rect x="0" y="395" width="320" height="25" fill="${colors[0]}" opacity="0.8"/>
    `,

    warrior: `
      <defs>
        <radialGradient id="w_bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="${colors[3]}" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
        </radialGradient>
        <filter id="glow_w"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="shadow_e"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="320" height="420" fill="${colors[0]}"/>
      <rect width="320" height="420" fill="url(#w_bg)"/>
      <!-- Energy vortex background -->
      <ellipse cx="160" cy="200" rx="100" ry="120" fill="none" stroke="${colors[3]}" stroke-width="1" opacity="0.2" transform="rotate(20, 160, 200)"/>
      <ellipse cx="160" cy="200" rx="80" ry="100" fill="none" stroke="${colors[3]}" stroke-width="1" opacity="0.25" transform="rotate(45, 160, 200)"/>
      <ellipse cx="160" cy="200" rx="60" ry="80" fill="none" stroke="${colors[3]}" stroke-width="1" opacity="0.3" transform="rotate(70, 160, 200)"/>
      <!-- Shadow energy swirls -->
      <path d="M60,100 Q120,180 80,280 Q140,200 200,300 Q160,180 220,120" stroke="${colors[3]}" stroke-width="2" fill="none" opacity="0.3" filter="url(#shadow_e)"/>
      <path d="M260,80 Q200,160 240,260 Q180,200 120,300" stroke="${colors[3]}" stroke-width="2" fill="none" opacity="0.25" filter="url(#shadow_e)"/>
      <!-- Figure in mid-jump/leap -->
      <!-- Cape spread wide -->
      <path d="M120,240 Q60,180 30,120 Q80,200 120,260Z" fill="${colors[1]}" opacity="0.85"/>
      <path d="M200,240 Q260,180 290,120 Q240,200 200,260Z" fill="${colors[1]}" opacity="0.85"/>
      <!-- Body angled - leaping forward -->
      <rect x="138" y="200" width="44" height="100" rx="8" fill="${colors[0]}" transform="rotate(-8, 160, 250)"/>
      <!-- Armour plates -->
      <rect x="140" y="202" width="40" height="18" rx="3" fill="${colors[2]}" opacity="0.5" transform="rotate(-8, 160, 211)"/>
      <!-- Arms -->
      <rect x="100" y="210" width="40" height="10" rx="5" fill="${colors[0]}" transform="rotate(-30, 120, 215)"/>
      <rect x="180" y="195" width="50" height="10" rx="5" fill="${colors[0]}" transform="rotate(40, 205, 200)"/>
      <!-- Weapon - flail raised high -->
      <line x1="215" y1="185" x2="260" y2="100" stroke="${colors[4]}" stroke-width="3"/>
      <circle cx="263" cy="97" r="12" fill="${colors[3]}" opacity="0.9" filter="url(#glow_w)"/>
      <circle cx="263" cy="97" r="7" fill="${colors[2]}" opacity="0.8"/>
      <!-- Weapon chain -->
      <path d="M215,185 Q240,140 260,100" stroke="#888" stroke-width="2" fill="none" stroke-dasharray="5,3" opacity="0.7"/>
      <!-- Energy emanating from weapon -->
      <circle cx="263" cy="97" r="25" fill="${colors[3]}" opacity="0.15" filter="url(#glow_w)"/>
      <!-- Head forward, aggressive -->
      <ellipse cx="152" cy="190" rx="20" ry="22" fill="#3a1a2a" transform="rotate(-8, 152, 190)"/>
      <!-- Eyes - fierce glow -->
      <ellipse cx="145" cy="186" rx="4" ry="3" fill="${colors[3]}" opacity="1" filter="url(#glow_w)" transform="rotate(-8, 145, 186)"/>
      <ellipse cx="158" cy="185" rx="4" ry="3" fill="${colors[3]}" opacity="1" filter="url(#glow_w)" transform="rotate(-8, 158, 185)"/>
      <!-- Hair wild - motion -->
      <path d="M134,176 Q115,155 100,130" stroke="white" stroke-width="3" fill="none" opacity="0.8"/>
      <path d="M140,173 Q125,150 115,125" stroke="white" stroke-width="2" fill="none" opacity="0.7"/>
      <path d="M160,170 Q158,148 155,122" stroke="white" stroke-width="2.5" fill="none" opacity="0.75"/>
      <path d="M170,173 Q178,150 188,128" stroke="white" stroke-width="2" fill="none" opacity="0.6"/>
      <!-- Ground impact (she's landing) -->
      <ellipse cx="155" cy="395" rx="60" ry="12" fill="${colors[3]}" opacity="0.2" filter="url(#shadow_e)"/>
      <!-- Legs - leap pose -->
      <rect x="140" y="295" width="18" height="70" rx="6" fill="${colors[0]}" transform="rotate(15, 149, 330)"/>
      <rect x="162" y="295" width="18" height="60" rx="6" fill="${colors[0]}" transform="rotate(-20, 171, 325)"/>
      <!-- Impact particles -->
      <circle cx="100" cy="370" r="3" fill="${colors[3]}" opacity="0.5"/>
      <circle cx="80" cy="350" r="2" fill="${colors[3]}" opacity="0.4"/>
      <circle cx="220" cy="365" r="3" fill="${colors[3]}" opacity="0.5"/>
      <circle cx="240" cy="345" r="2" fill="${colors[3]}" opacity="0.4"/>
    `,
  }

  return scenes[sceneId] || scenes['throne']
}
