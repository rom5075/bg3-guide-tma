// Profile extractor — lightweight Haiku call
// Extracts user facts + evaluates mood from one conversation turn
// Fire-and-forget: called after main AI response, updates Redis profile

const EXTRACTOR_SYSTEM =
  `Analyse the dialogue and return ONLY valid JSON. No markdown, no explanation.`

function extractorPrompt(userMsg, assistantMsg) {
  return `User message: "${userMsg.slice(0, 400)}"
Minthara reply: "${assistantMsg.slice(0, 400)}"

Return JSON with these fields:
{
  "mood_delta": <1 warmer | 0 neutral | -1 colder>,
  "suggested_mood": <"neutral"|"warm"|"cold"|"irritated"|"possessive"|"in_heat"|null>,
  "intimate_occurred": <true|false>,
  "intimate_summary": <"1-2 sentence description of the scene" | null>,
  "intimate_location": <"где произошло, 1-5 слов на русском" | null>,
  "intimate_behavior": <"поведение Минтары в сцене: похотливая|доминирующая|жестокая|игривая|страстная|холодная|подчиняющаяся — 1-3 слова" | null>,
  "name": <user's name if they mentioned it | null>,
  "act": <1|2|3 if user mentioned BG3 act | null>,
  "new_facts": <array of up to 3 new facts about the user | []>,
  "key_memory_worthy": <true if this exchange contains a significant milestone: first flirt/intimacy, conflict resolved, emotional breakthrough, notable confession | false>,
  "key_memory_type": <"romance"|"intimate"|"conflict"|"milestone"|null>,
  "key_memory_summary": <"brief milestone description in Russian, Minthara's POV, max 120 chars" | null>
}

Rules:
- mood_delta: +1 if conversation got warmer/flirtier, -1 if user was cold/rude/absent
- suggested_mood: only set if the shift is obvious (e.g. user explicitly flirts → "warm", user proposes sex → "in_heat")
- intimate_occurred: true ONLY if an actual intimate/sexual scene was described in the reply
- intimate_summary: write in Russian, from Minthara's perspective, max 2 sentences
- intimate_location: кратко где произошла сцена (лагерь, таверна, тронный зал...), null если неясно
- intimate_behavior: ТОЛЬКО если intimate_occurred=true; характер Минтары, не описание действий
- key_memory_worthy: true only for genuinely significant moments, not every exchange`
}

export async function extractAndEvaluate(apiKey, userMsg, assistantMsg, existingProfile) {
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        max_tokens: 450,
        messages: [
          { role: 'system', content: EXTRACTOR_SYSTEM },
          { role: 'user',   content: extractorPrompt(userMsg, assistantMsg) },
        ],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ''

    // Extract JSON block — model may wrap it in ```json ... ```
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null

    let ext
    try { ext = JSON.parse(match[0]) } catch { return null }

    // ── Build updated profile ──────────────────────────────────────────────
    const now = new Date().toISOString().split('T')[0]
    const p = {
      firstSeen: now,
      mood: 'neutral',
      moodScore: 0,
      knownFacts: [],
      ...existingProfile,
      lastSeen: now,
      totalMessages: (existingProfile?.totalMessages || 0) + 1,
    }

    // Name / act discovery
    if (ext.name && !p.name) p.name = String(ext.name).slice(0, 50)
    if (ext.act && [1, 2, 3].includes(Number(ext.act))) p.act = Number(ext.act)

    // Mood score: clamp to [-5, +5]
    const delta = typeof ext.mood_delta === 'number' ? ext.mood_delta : 0
    p.moodScore = Math.max(-5, Math.min(5, (p.moodScore || 0) + delta))

    // Suggested mood overrides score-based mood
    if (ext.suggested_mood && VALID_MOODS.includes(ext.suggested_mood)) {
      p.mood = ext.suggested_mood
    } else {
      p.mood = moodFromScore(p.moodScore)
    }

    // Intimate scene
    if (ext.intimate_occurred) {
      p.intimateCount = (p.intimateCount || 0) + 1
      p.mood = 'possessive'   // satisfied but possessive
      p.moodScore = 3
      const intimateSummary = ext.intimate_summary
        ? String(ext.intimate_summary).slice(0, 250)
        : ''
      if (intimateSummary) {
        p.lastIntimate = { date: now, summary: intimateSummary }
        // Build intimate log (keep last 10 entries)
        const entry = {
          date:     now,
          ordinal:  p.intimateCount,
          summary:  intimateSummary,
          location: ext.intimate_location ? String(ext.intimate_location).slice(0, 80) : null,
          behavior: ext.intimate_behavior ? String(ext.intimate_behavior).slice(0, 50) : null,
        }
        p.intimateLog = [...(p.intimateLog || []), entry].slice(-10)
      }
    }

    // Key memories (keep last 15 significant moments)
    if (ext.key_memory_worthy && ext.key_memory_summary) {
      const mem = {
        date: now,
        type: ext.key_memory_type || 'milestone',
        summary: String(ext.key_memory_summary).slice(0, 150),
      }
      p.keyMemories = [...(p.keyMemories || []), mem].slice(-15)
    }

    // Accumulate facts (keep newest 10)
    if (Array.isArray(ext.new_facts) && ext.new_facts.length > 0) {
      const incoming = ext.new_facts.map(f => String(f).slice(0, 120)).filter(Boolean)
      p.knownFacts = [...(p.knownFacts || []), ...incoming].slice(-10)
    }

    return p
  } catch { return null }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_MOODS = ['neutral', 'warm', 'cold', 'irritated', 'possessive', 'in_heat']

function moodFromScore(score) {
  if (score <= -3) return 'cold'
  if (score <= -1) return 'neutral'
  if (score >= 4)  return 'in_heat'
  if (score >= 2)  return 'possessive'
  if (score >= 1)  return 'warm'
  return 'neutral'
}
