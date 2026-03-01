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
  "name": <user's name if they mentioned it | null>,
  "act": <1|2|3 if user mentioned BG3 act | null>,
  "new_facts": <array of up to 3 new facts about the user | []>
}

Rules:
- mood_delta: +1 if conversation got warmer/flirtier, -1 if user was cold/rude/absent
- suggested_mood: only set if the shift is obvious (e.g. user explicitly flirts → "warm", user proposes sex → "in_heat")
- intimate_occurred: true ONLY if an actual intimate/sexual scene was described in the reply
- intimate_summary: write in Russian, from Minthara's perspective, max 2 sentences`
}

export async function extractAndEvaluate(apiKey, userMsg, assistantMsg, existingProfile) {
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: EXTRACTOR_SYSTEM,
        messages: [{ role: 'user', content: extractorPrompt(userMsg, assistantMsg) }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    const raw = data.content?.find(b => b.type === 'text')?.text || ''

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
      if (ext.intimate_summary) {
        p.lastIntimate = {
          date: now,
          summary: String(ext.intimate_summary).slice(0, 250),
        }
      }
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
