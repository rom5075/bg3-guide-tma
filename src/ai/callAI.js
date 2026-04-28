// Shared xAI (Grok) API caller with Tavily web search tool use
// OpenAI-compatible API: https://api.x.ai/v1
// Used by api/chat.js (Mini App) and api/webhook.js (Telegram bot)

// ─── Tool definition (OpenAI format) ─────────────────────────────────────────

const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: `Search the internet for any information the user requests. Use when:
- User asks about recent events, news, or updates (BG3 patches, real world, anything)
- User explicitly asks to "find", "search", "look up", or "check" something
- The question requires up-to-date information you may not have
- User asks about any topic outside of BG3 that benefits from a web search
Use a clear, specific search query. For BG3 questions include "Baldur's Gate 3" in the query.`,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string. Keep it concise and specific.',
        },
      },
      required: ['query'],
    },
  },
}

// ─── Tavily search ────────────────────────────────────────────────────────────

async function tavilySearch(query) {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) return 'Поиск недоступен — TAVILY_API_KEY не настроен.'

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: 3,
        include_answer: true,
      }),
    })

    if (!res.ok) return `Ошибка поиска: ${res.status}`

    const data = await res.json()
    const parts = []
    if (data.answer) parts.push(`КРАТКИЙ ОТВЕТ: ${data.answer}`)
    if (data.results?.length) {
      parts.push(
        data.results
          .map(r => `[${r.title}]\n${(r.content || '').slice(0, 500)}\nИсточник: ${r.url}`)
          .join('\n\n')
      )
    }
    return parts.join('\n\n') || 'Результатов не найдено.'
  } catch (err) {
    return `Ошибка поиска: ${err.message}`
  }
}

// ─── Main callAI function ─────────────────────────────────────────────────────

/**
 * Call xAI (Grok) API with optional Tavily web search tool use.
 * OpenAI-compatible format: system prompt goes into messages array.
 *
 * @param {string} apiKey        - xAI API key
 * @param {string} model         - Model name (grok-3 / grok-3-fast)
 * @param {string} systemPrompt  - Full system prompt
 * @param {Array}  messages      - Conversation history [{role, content}]
 * @returns {Promise<{ text: string, usedSearch: boolean, searchQuery?: string }>}
 */
export async function callAI(apiKey, model, systemPrompt, messages) {
  const hasTavily = !!process.env.TAVILY_API_KEY

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ]

  // ── First call ──────────────────────────────────────────────────────────────
  const firstRes = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: apiMessages,
      ...(hasTavily ? { tools: [WEB_SEARCH_TOOL], tool_choice: 'auto' } : {}),
    }),
  })

  if (!firstRes.ok) {
    const err = await firstRes.json().catch(() => ({}))
    throw new Error(err.error?.message || `xAI ${firstRes.status}`)
  }

  const firstData = await firstRes.json()
  const choice = firstData.choices?.[0]

  // ── Tool use requested? ─────────────────────────────────────────────────────
  if (choice?.finish_reason === 'tool_calls') {
    const toolCall = choice.message?.tool_calls?.[0]

    if (toolCall?.function?.name === 'web_search') {
      let args = {}
      try { args = JSON.parse(toolCall.function.arguments || '{}') } catch {}
      const query = args.query || ''
      const searchResult = await tavilySearch(query)

      const continuedMessages = [
        ...apiMessages,
        {
          role: 'assistant',
          content: null,
          tool_calls: choice.message.tool_calls,
        },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: searchResult,
        },
      ]

      // ── Second call — final answer ──────────────────────────────────────────
      const finalRes = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          messages: continuedMessages,
        }),
      })

      if (!finalRes.ok) {
        const err = await finalRes.json().catch(() => ({}))
        throw new Error(err.error?.message || `xAI 2nd call ${finalRes.status}`)
      }

      const finalData = await finalRes.json()
      const text = finalData.choices?.[0]?.message?.content || ''
      return { text, usedSearch: true, searchQuery: query }
    }
  }

  // ── No tool use — direct answer ─────────────────────────────────────────────
  const text = choice?.message?.content || ''
  return { text, usedSearch: false }
}
