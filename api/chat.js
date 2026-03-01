// Mini App → Anthropic proxy
// Runs on Vercel Edge Runtime — ANTHROPIC_API_KEY stays server-side

import { MINTHARA_SYSTEM_PROMPT, ROMANCE_MODE_ADDENDUM, GUIDE_CONTEXT_PREFIX } from '../src/ai/systemPrompt.js'
import { routeQuery } from '../src/ai/modelRouter.js'
import { getKnowledgeContext } from '../src/ai/knowledgeBase.js'
import { callAI } from '../src/ai/callAI.js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { messages, romanceMode } = body

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  // Last user message for routing
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const route = lastUserMsg ? routeQuery(lastUserMsg.content) : { model: 'claude-haiku-4-5-20251001', queryType: 'roleplay', knowledgeKeys: [] }

  // Build system prompt
  let systemPrompt = MINTHARA_SYSTEM_PROMPT
  if (romanceMode) systemPrompt += ROMANCE_MODE_ADDENDUM
  if (route.knowledgeKeys.length > 0) {
    systemPrompt += GUIDE_CONTEXT_PREFIX
    systemPrompt += getKnowledgeContext(route.knowledgeKeys)
  }

  // Strip extra fields — Anthropic only needs role + content
  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

  try {
    const { text, usedSearch, searchQuery } = await callAI(apiKey, route.model, systemPrompt, apiMessages)

    return new Response(JSON.stringify({ text, model: route.model, queryType: route.queryType, usedSearch, searchQuery }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Fetch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}
