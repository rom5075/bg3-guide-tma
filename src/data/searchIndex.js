import { ROMANCES, POLYAMORY } from './romances'
import { BUILDS, TEAM_COMPOSITIONS, STRATEGY_SUMMARY } from './builds'
import { EQUIPMENT, POTIONS, ARTIFACTS, AURA_SYNERGY_ITEMS, DARK_URGE_ITEMS } from './equipment'
import { WORLD_LORE, CHARACTER_LORE } from './lore'
import { LOCATIONS } from './locations'
import { COMPANION_CHECKLIST, RESPEC_GUIDE, EVIL_QUESTS } from './party'

function buildIndex() {
  const items = []

  // ── Romances ──────────────────────────────────────────────────
  ROMANCES.forEach(r => {
    items.push({
      id: `romance_${r.id}`,
      tab: 'romance', tabLabel: 'Романы', tabIcon: '💋',
      title: r.name, subtitle: r.class,
      body: [r.path_note, r.dark_urge_bonus, ...(r.approval_loves?.map(a => a.text) || [])].filter(Boolean).join(' '),
      emoji: r.emoji,
      keywords: [r.name, r.id, 'роман', 'одобрение'],
    })
    r.acts?.forEach(act => {
      act.steps?.forEach(step => {
        items.push({
          id: `romance_${r.id}_${step.title}`,
          tab: 'romance', tabLabel: 'Романы', tabIcon: '💋',
          title: step.title, subtitle: `${r.name} · ${act.title}`,
          body: step.desc + ' ' + (step.dialogues?.map(d => d.line).join(' ') || ''),
          emoji: r.emoji, keywords: [r.name, step.title],
        })
      })
    })
  })

  // ── Polyamory ─────────────────────────────────────────────────
  if (POLYAMORY) {
    items.push({
      id: 'polyamory_main',
      tab: 'romance', tabLabel: 'Романы', tabIcon: '💋',
      title: POLYAMORY.title, subtitle: POLYAMORY.subtitle,
      body: [POLYAMORY.concept, ...(POLYAMORY.whyThisTrio || [])].join(' '),
      emoji: '🔥',
      keywords: ['полиамория', 'polyamory', 'минтара', 'астарион', 'лаэзель', 'ревность', 'poly', 'тройка'],
    })
    POLYAMORY.acts?.forEach(act => {
      act.companions?.forEach(comp => {
        items.push({
          id: `poly_act${act.act}_${comp.name}`,
          tab: 'romance', tabLabel: 'Романы', tabIcon: '💋',
          title: `Полиамория — ${comp.name}`, subtitle: `Акт ${act.act} · ${act.title}`,
          body: [comp.trigger, comp.jealousyLine, comp.resolution, ...(comp.dialogues?.map(d => d.line) || [])].filter(Boolean).join(' '),
          emoji: comp.emoji, keywords: [comp.name, 'полиамория', 'ревность', 'диалог'],
        })
      })
    })
  }

  // ── Builds ────────────────────────────────────────────────────
  BUILDS.forEach(b => {
    items.push({
      id: `build_${b.id}`,
      tab: 'builds', tabLabel: 'Билды', tabIcon: '⚔️',
      title: b.name, subtitle: `${b.class} · ${b.subclass}`,
      body: [b.summary, b.synergyNote, b.respecNote, ...(b.feats || []), ...(b.keySpells || []), ...(b.playstyle || [])].filter(Boolean).join(' '),
      emoji: b.emoji,
      keywords: [b.name, b.class, b.subclass, b.role, b.race, 'билд', 'класс', 'respec'],
    })
  })

  TEAM_COMPOSITIONS?.forEach(tc => {
    items.push({
      id: `team_${tc.id}`,
      tab: 'builds', tabLabel: 'Билды', tabIcon: '⚔️',
      title: tc.title, subtitle: 'Состав отряда',
      body: `${tc.strategy} ${tc.synergy} ${tc.members.join(' ')}`,
      emoji: '🛡️',
      keywords: ['команда', 'состав', 'синергия', 'аура', ...(tc.members || [])],
    })
  })

  if (STRATEGY_SUMMARY) {
    items.push({
      id: 'strategy_aura',
      tab: 'builds', tabLabel: 'Билды', tabIcon: '⚔️',
      title: STRATEGY_SUMMARY.title, subtitle: 'Двойная Aura of Hate',
      body: `${STRATEGY_SUMMARY.description} ${STRATEGY_SUMMARY.formula} ${STRATEGY_SUMMARY.cloudGiantNote}`,
      emoji: '⚡',
      keywords: ['aura of hate', 'аура ненависти', 'двойная аура', 'oathbreaker', 'cloud giant elixir', 'стратегия'],
    })
  }

  // ── Equipment ─────────────────────────────────────────────────
  Object.entries(EQUIPMENT).forEach(([actKey, actData]) => {
    actData.items?.forEach(item => {
      items.push({
        id: `equip_${actKey}_${item.name}`,
        tab: 'equip', tabLabel: 'Шмот', tabIcon: '🛡️',
        title: item.name, subtitle: `${item.rarity} · ${actKey.replace('act', 'Акт ')}`,
        body: `${item.effect} ${item.where}`,
        emoji: item.slot,
        keywords: [item.name, item.rarity, item.where, 'экипировка'],
      })
    })
  })

  ARTIFACTS.forEach(art => {
    items.push({
      id: `artifact_${art.name}`,
      tab: 'equip', tabLabel: 'Шмот', tabIcon: '🛡️',
      title: art.name, subtitle: `${art.rarity} · Акт ${art.act}`,
      body: `${art.effect} ${art.where} ${art.synergy || ''}`,
      emoji: art.emoji,
      keywords: [art.name, 'артефакт', art.darkUrge ? 'dark urge' : ''],
    })
  })

  AURA_SYNERGY_ITEMS?.forEach(item => {
    items.push({
      id: `aura_${item.name}`,
      tab: 'equip', tabLabel: 'Шмот', tabIcon: '🛡️',
      title: item.name, subtitle: `Аура-синергия · ${item.who} · Акт ${item.act}`,
      body: `${item.effect} ${item.location}`,
      emoji: '⚡',
      keywords: [item.name, 'аура', 'синергия', 'aura of hate', item.who, 'oathbreaker', 'палладин'],
    })
  })

  DARK_URGE_ITEMS?.forEach(item => {
    items.push({
      id: `du_item_${item.name}`,
      tab: 'equip', tabLabel: 'Шмот', tabIcon: '🛡️',
      title: item.name, subtitle: `Dark Urge эксклюзив · Акт ${item.act}`,
      body: `${item.effect} ${item.howToGet}`,
      emoji: '🩸',
      keywords: [item.name, 'dark urge', 'тёмный порыв', 'эксклюзив', 'бхаал'],
    })
  })

  // ── Potions ───────────────────────────────────────────────────
  POTIONS.forEach(p => {
    items.push({
      id: `potion_${p.name}`,
      tab: 'potions', tabLabel: 'Зелья', tabIcon: '🧪',
      title: p.name, subtitle: `${p.type} · Приоритет ${p.priority}`,
      body: `${p.effect} ${p.craft} ${p.tip}`,
      emoji: p.emoji,
      keywords: [p.name, p.type, 'зелье', 'алхимия', 'крафт'],
    })
  })

  // ── Lore ──────────────────────────────────────────────────────
  WORLD_LORE.forEach(w => {
    items.push({
      id: `lore_world_${w.id}`,
      tab: 'lore', tabLabel: 'Лор', tabIcon: '📜',
      title: w.title, subtitle: `Мир · ${w.tags.join(', ')}`,
      body: w.body, emoji: w.emoji,
      keywords: [w.title, ...w.tags, 'лор', 'история'],
    })
  })

  CHARACTER_LORE.forEach(c => {
    items.push({
      id: `lore_char_${c.id}`,
      tab: 'lore', tabLabel: 'Лор', tabIcon: '📜',
      title: c.name, subtitle: `${c.subtitle} · ${c.born}`,
      body: c.sections.map(s => s.text).join(' '),
      emoji: c.emoji || '👤',
      keywords: [c.name, c.id, 'персонаж', 'предыстория', 'лор'],
    })
  })

  // ── Locations ─────────────────────────────────────────────────
  LOCATIONS.forEach(loc => {
    items.push({
      id: `map_${loc.id}`,
      tab: 'map', tabLabel: 'Карта', tabIcon: '🗺️',
      title: loc.name, subtitle: `${loc.short} · ${loc.act.replace('act', 'Акт ')}`,
      body: `${loc.desc} ${loc.loot || ''} ${loc.criticalNote || ''}`,
      emoji: loc.emoji,
      keywords: [loc.name, loc.short, loc.act, 'локация', loc.darkUrge ? 'dark urge' : ''],
    })
  })

  // ── Party ─────────────────────────────────────────────────────
  COMPANION_CHECKLIST.forEach(comp => {
    items.push({
      id: `party_${comp.id}`,
      tab: 'party', tabLabel: 'Отряд', tabIcon: '👥',
      title: `${comp.name} — как удержать`, subtitle: `Акт ${comp.act}+ · ${comp.steps.length} шагов`,
      body: comp.steps.map(s => `${s.when} ${s.action} ${s.criticalNote || ''}`).join(' '),
      emoji: comp.emoji,
      keywords: [comp.name, 'отряд', 'удержать', 'одобрение'],
    })
  })

  RESPEC_GUIDE?.forEach(r => {
    items.push({
      id: `respec_${r.id}`,
      tab: 'party', tabLabel: 'Отряд', tabIcon: '👥',
      title: `Respec — ${r.name}`, subtitle: `→ ${r.targetClass} · ${r.priority}`,
      body: `${r.reason} ${r.when} ${r.startStats}`,
      emoji: r.emoji,
      keywords: [r.name, 'respec', 'перераспределение', r.targetClass, 'withers', 'витерс'],
    })
  })

  EVIL_QUESTS?.forEach(actData => {
    actData.quests?.forEach(q => {
      items.push({
        id: `evil_${actData.act}_${q.name}`,
        tab: 'party', tabLabel: 'Отряд', tabIcon: '👥',
        title: `Злой квест — ${q.name}`, subtitle: actData.title,
        body: `${q.note || ''} В лагерь: ${(q.leave || []).join(', ')}. Брать: ${(q.take || []).join(', ')}.`,
        emoji: '🩸',
        keywords: [q.name, 'злой квест', 'evil', 'рейд', 'лагерь', ...(q.leave || []), ...(q.take || [])],
      })
    })
  })

  return items
}

const INDEX = buildIndex()

export function search(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  const words = q.split(/\s+/)

  const scored = INDEX.map(item => {
    const searchText = [item.title, item.subtitle, item.body, ...(item.keywords || [])].join(' ').toLowerCase()
    let score = 0
    if (item.title.toLowerCase().includes(q)) score += 100
    words.forEach(w => { if (item.title.toLowerCase().includes(w)) score += 20 })
    words.forEach(w => { item.keywords?.forEach(k => { if (k?.toLowerCase().includes(w)) score += 15 }) })
    words.forEach(w => { if (searchText.includes(w)) score += 5 })
    return { ...item, score }
  })

  return scored.filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 25)
}
