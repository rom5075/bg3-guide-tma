// Shared Anthropic API caller with Tavily web search tool use
// Used by api/chat.js (Mini App) and api/webhook.js (Telegram bot)

// ─── Tool definition ─────────────────────────────────────────────────────────

const WEB_SEARCH_TOOL = {
  name: 'web_search',
  description: `Search the internet for any information the user requests. Use when:
- User asks about recent events, news, or updates (BG3 patches, real world, anything)
- User explicitly asks to "find", "search", "look up", or "check" something
- The question requires up-to-date information you may not have
- User asks about any topic outside of BG3 that benefits from a web search
Use a clear, specific search query. For BG3 questions include "Baldur's Gate 3" in the query.`,
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query string. Keep it concise and specific.',
      },
    },
    required: ['query'],
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
    if (data.answer) {
      parts.push(`КРАТКИЙ ОТВЕТ: ${data.answer}`)
    }
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
 * Call Anthropic API with optional Tavily web search tool use.
 * Handles the full agentic loop: call → tool use → call again → final answer.
 *
 * @param {string} apiKey        - Anthropic API key
 * @param {string} model         - Model name (haiku / sonnet)
 * @param {string} systemPrompt  - Full system prompt
 * @param {Array}  messages      - Conversation history [{role, content}]
 * @returns {Promise<{ text: string, usedSearch: boolean, searchQuery?: string }>}
 */
export async function callAI(apiKey, model, systemPrompt, messages) {
  const hasTavily = !!process.env.TAVILY_API_KEY

  // ── First call ──────────────────────────────────────────────────────────────
  const firstRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      ...(hasTavily ? { tools: [WEB_SEARCH_TOOL], tool_choice: { type: 'auto' } } : {}),
    }),
  })

  if (!firstRes.ok) {
    const err = await firstRes.json().catch(() => ({}))
    throw new Error(err.error?.message || `Anthropic ${firstRes.status}`)
  }

  const firstData = await firstRes.json()

  // ── Tool use requested? ─────────────────────────────────────────────────────
  if (firstData.stop_reason === 'tool_use') {
    const toolBlock = firstData.content.find(b => b.type === 'tool_use')

    if (toolBlock?.name === 'web_search') {
      const query = toolBlock.input?.query || ''
      const searchResult = await tavilySearch(query)

      // Build continued conversation with tool result
      const continuedMessages = [
        ...messages,
        { role: 'assistant', content: firstData.content },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: toolBlock.id,
            content: searchResult,
          }],
        },
      ]

      // ── Second call — final answer ──────────────────────────────────────────
      const finalRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemPrompt,
          messages: continuedMessages,
          // No tools on second call — just generate the answer
        }),
      })

      if (!finalRes.ok) {
        const err = await finalRes.json().catch(() => ({}))
        throw new Error(err.error?.message || `Anthropic ${finalRes.status}`)
      }

      const finalData = await finalRes.json()
      const text = finalData.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
      return { text, usedSearch: true, searchQuery: query }
    }
  }

  // ── No tool use — direct answer ─────────────────────────────────────────────
  const text = firstData.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
  return { text, usedSearch: false }
}
