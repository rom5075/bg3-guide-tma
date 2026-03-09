// Voyage AI embeddings — semantic memory search (RAG)
// Model: voyage-3-lite (512 dims, 200M free tokens per account)

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings'
const MODEL      = 'voyage-3-lite'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get embedding vector for a text string.
 * Retries up to `retries` times on 429 rate-limit responses (2s backoff).
 * @param {string} text
 * @param {string} apiKey — VOYAGE_API_KEY
 * @param {number} retries — max retry attempts on 429 (default 3)
 * @returns {Float32Array|null}
 */
export async function getEmbedding(text, apiKey, retries = 3) {
  if (!apiKey || !text?.trim()) return null
  try {
    const res = await fetch(VOYAGE_API, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, input: [text.slice(0, 2000)] }),
    })
    if (res.status === 429) {
      if (retries > 0) {
        await sleep(2000)
        return getEmbedding(text, apiKey, retries - 1)
      }
      console.error('[embeddings] 429 rate limit — retries exhausted')
      return null
    }
    if (!res.ok) {
      console.error(`[embeddings] HTTP ${res.status}`)
      return null
    }
    const data = await res.json()
    const vec = data?.data?.[0]?.embedding
    if (!Array.isArray(vec)) return null
    return new Float32Array(vec)
  } catch (e) {
    console.error('[embeddings] fetch error:', e?.message)
    return null
  }
}

/**
 * Serialize Float32Array → Buffer for SQLite BLOB storage.
 * @param {Float32Array} vec
 * @returns {Buffer}
 */
export function serializeVector(vec) {
  return Buffer.from(vec.buffer)
}

/**
 * Deserialize Buffer from SQLite BLOB → Float32Array.
 * @param {Buffer} buf
 * @returns {Float32Array}
 */
export function deserializeVector(buf) {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
}

/**
 * Cosine similarity between two Float32Array vectors.
 * @param {Float32Array} a
 * @param {Float32Array} b
 * @returns {number} — [-1, 1]
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}

/**
 * Find topK most relevant rows by cosine similarity to queryVec.
 *
 * @param {Float32Array|null} queryVec — embedded query (current user message)
 * @param {Array<object>}     rows     — DB rows with optional .embedding Buffer
 * @param {string}            textKey  — field name used as text ('summary' | 'fact')
 * @param {number}            topK     — how many to return
 * @returns {Array<object>} — topK rows sorted by relevance (most relevant first)
 */
export function findMostRelevant(queryVec, rows, textKey, topK) {
  if (!rows?.length) return []

  // No query vector — fallback to last N (chronological)
  if (!queryVec) return rows.slice(-topK)

  // Separate rows with and without embeddings
  const withEmb    = []
  const withoutEmb = []
  for (const row of rows) {
    if (row.embedding) withEmb.push(row)
    else withoutEmb.push(row)
  }

  // Score rows that have embeddings
  const scored = withEmb.map(row => ({
    row,
    score: cosineSimilarity(queryVec, deserializeVector(row.embedding)),
  }))
  scored.sort((a, b) => b.score - a.score)

  // Take top scored, fill remaining slots with unembedded rows (oldest first)
  const result = scored.slice(0, topK).map(s => s.row)
  if (result.length < topK) {
    const need = topK - result.length
    result.push(...withoutEmb.slice(-need))
  }

  return result
}
