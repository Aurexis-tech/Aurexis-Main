// GET /api/ai-ping — proves frontend → function → Claude. Calls Claude with a
// trivial fixed prompt and returns the text. ANTHROPIC_API_KEY stays server-side.
const { complete, MODEL } = require('./_lib/anthropic')

module.exports = async (req, res) => {
  try {
    const reply = await complete('Reply with exactly: Aurexis AI pong', { maxTokens: 32 })
    res.status(200).json({ ok: true, model: MODEL, reply: reply.trim() })
  } catch (e) {
    // SDK errors do not contain the API key; still keep the message short.
    res.status(500).json({ ok: false, error: String(e && e.message || e).slice(0, 300) })
  }
}
