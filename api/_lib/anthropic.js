// Server-side Anthropic (Claude) client. SERVER ONLY — never import into browser
// code. ANTHROPIC_API_KEY is read from the environment; it is never hardcoded
// and never sent to the client.
const Anthropic = require('@anthropic-ai/sdk')

const MODEL = 'claude-sonnet-4-6'

let _client = null
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  if (!_client) _client = new Anthropic({ apiKey })
  return _client
}

// Minimal single-turn text helper used by /api/ai-ping (and, later, the engines).
async function complete(prompt, { system, maxTokens = 256 } = {}) {
  const client = getClient()
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
}

module.exports = { getClient, complete, MODEL }
