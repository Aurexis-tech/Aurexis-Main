// Shared Forge generation foundation. SERVER ONLY — never import into browser code.
//
// Forge is a 5-stage pipeline. Every stage is a real AI-generated ARTIFACT for a
// human to review — never an autonomous actor, never a guarantee. Each stage is
// "schema + prompt" on top of the helpers here:
//   - generateStructured(): strict-JSON generation from Claude, validated, with one
//     repair retry and a hard 2-call cap. Optional server-side web_search passthrough.
//   - caps(): array/string/number length enforcement with a shared truncated flag.
//   - readJsonBody(): body parse that works under Vercel AND the raw-node harness.
//   - ForgeError + sendError(): a clean error shape that never leaks the API key/stack.
//
// ───────────────────────────────────────────────────────────────────────────────
// PIPELINE TYPE CONTRACTS (chained — each stage consumes the prior stage's output).
// Shapes for stages 2–5 are sketched here so later prompts are mostly schema+prompt;
// they will be finalized as each stage is built. Stage 1 (Scout) is final below.
//
// @typedef {Object} Profile         // founder signature carried through the pipeline
// @property {string}  [label]       // e.g. "The Pragmatic Builder"
// @property {string}  [domain]      // user's domain/interest, e.g. "SaaS tools"
// @property {string}  [style]       // working style, e.g. "Fast & iterative"
// @property {string}  [time]        // availability, e.g. "Full-time"
//
// ── Stage 1 · Scout ──  POST /api/forge/scout
// @typedef {Object} ScoutInput
// @property {string}  domain                 // REQUIRED — what space to scout
// @property {Profile} [profile]
// @property {Object}  [answers]              // raw answer signature from the prototype
// @property {string}  [focus]               // optional narrowing of the search
//
// @typedef {Object} MarketPotential  @property {number} score(0-100) @property {string} rationale
// @typedef {Object} Competition      @property {'low'|'medium'|'high'} level @property {string} notes
// @typedef {Object} Opportunity
// @property {string}          title
// @property {string}          summary
// @property {MarketPotential} marketPotential
// @property {Competition}     competition
// @property {number}          timingScore       // 0-100
// @property {string}          entryStrategy
// @property {string[]}        risks             // <=4
//
// @typedef {Object} Source  @property {string} title @property {string} url
// @typedef {Object} OpportunityReport            // ← Scout OUTPUT (input to Architect)
// @property {string}        generatedAt          // ISO timestamp (set server-side)
// @property {string}        domain
// @property {Opportunity[]} opportunities        // 3–6
// @property {Source[]}      sources              // real web_search citations, <=8
// @property {string}        disclaimer           // honest, set server-side
// @property {boolean}       [truncated]
// @property {{input_tokens:number,output_tokens:number}} usage
//
// ── Stage 2 · Architect ──  consumes ONE chosen Opportunity → Blueprint
// @typedef {Object} ArchitectInput  @property {Opportunity} opportunity @property {Profile} [profile]
// @typedef {Object} Blueprint        // {summary, modules[], milestones[], stack[], ...} (TBD)
//
// ── Stage 3 · Creator ──  consumes Blueprint → Scaffold (cf. existing /api/forge)
// @typedef {Object} CreatorInput    @property {Blueprint} blueprint @property {Opportunity} opportunity
// @typedef {Object} Scaffold         // {projectName, architecture{summary,stack,components}, files[]}
//
// ── Stage 4 · Operator ──  consumes Scaffold → OpsPlan
// @typedef {Object} OperatorInput   @property {Scaffold} scaffold @property {Blueprint} blueprint
// @typedef {Object} OpsPlan          // {checklist[], envVars[], deploySteps[], ...} (TBD)
//
// ── Stage 5 · Evolver ──  consumes the chain → ImprovementPlan
// @typedef {Object} EvolverInput    @property {OpportunityReport} report @property {Blueprint} blueprint
//                                    @property {Scaffold} scaffold @property {OpsPlan} opsPlan
// @typedef {Object} ImprovementPlan  // {experiments[], metrics[], risks[], ...} (TBD)
// ───────────────────────────────────────────────────────────────────────────────

const { getClient, MODEL } = require('./anthropic')

// Ordered reference list of the pipeline stages (consumed by docs/UI later).
const PIPELINE = [
  { id: 'scout', title: 'Scout', purpose: 'Opportunity discovery', input: 'ScoutInput', output: 'OpportunityReport' },
  { id: 'architect', title: 'Architect', purpose: 'Blueprint design', input: 'ArchitectInput', output: 'Blueprint' },
  { id: 'creator', title: 'Creator', purpose: 'Starter scaffold', input: 'CreatorInput', output: 'Scaffold' },
  { id: 'operator', title: 'Operator', purpose: 'Ops / launch plan', input: 'OperatorInput', output: 'OpsPlan' },
  { id: 'evolver', title: 'Evolver', purpose: 'Improvement plan', input: 'EvolverInput', output: 'ImprovementPlan' },
]

const MAX_MODEL_CALLS = 2 // hard cap per generateStructured() invocation

// A clean error that carries an HTTP status and an optional client-safe message.
class ForgeError extends Error {
  constructor(message, status = 500, publicMessage) {
    super(message)
    this.name = 'ForgeError'
    this.status = status
    this.publicMessage = publicMessage
  }
}

// Send a JSON error WITHOUT leaking the API key or a raw stack. 4xx messages are
// caller-controlled and safe to surface; 5xx are replaced with a generic message.
function sendError(res, err) {
  const status = (err && err.status) || 500
  console.error('[forge] error:', String((err && err.message) || err))
  const clientMsg = status < 500
    ? ((err && err.message) || 'bad request')
    : ((err && err.publicMessage) || 'request failed; please try again')
  res.status(status).json({ ok: false, error: clientMsg })
}

// Body parse that works under Vercel (req.body pre-parsed) AND the raw-node harness.
function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')) } catch { resolve(null) } })
    req.on('error', () => resolve(null))
  })
}

// The Anthropic server-side web search tool descriptor (executed by the API itself).
function webSearchTool(maxUses = 5) {
  return { type: 'web_search_20250305', name: 'web_search', max_uses: maxUses }
}

// Shared cap helpers. One instance tracks whether ANY value was truncated/clamped.
function caps() {
  let t = false
  return {
    arr(a, max) { if (!Array.isArray(a)) return []; if (a.length > max) { t = true; return a.slice(0, max) } return a },
    str(s, max) {
      s = String(s == null ? '' : s)
      if (s.length > max) { t = true; return s.slice(0, max).replace(/\s+\S*$/, '').trimEnd() + '…' }
      return s
    },
    num(n, lo, hi) { n = Number(n); if (!Number.isFinite(n)) { t = true; return lo } return Math.max(lo, Math.min(hi, Math.round(n))) },
    enum(v, allowed, fallback) { if (allowed.indexOf(v) >= 0) return v; t = true; return fallback },
    truncated() { return t },
  }
}

// ── internals ──────────────────────────────────────────────────────────────────
function extractText(msg) {
  return (msg.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
}

// Pull the parsed input of a forced tool_use block (robust structured output —
// the SDK assembles/escapes it, so embedded code never breaks JSON parsing).
function toolInput(msg, name) {
  const tu = (msg.content || []).find((b) => b.type === 'tool_use' && b.name === name)
  return tu ? tu.input : null
}

// Pull the REAL urls/titles the model searched, from web_search_tool_result blocks
// (and text-block citations as a fallback). These are what the UI will cite.
function collectSources(msg, into) {
  for (const b of msg.content || []) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const r of b.content) {
        if (r && r.type === 'web_search_result' && r.url) {
          into.push({ title: String(r.title || r.url).slice(0, 200), url: String(r.url) })
        }
      }
    }
    if (b.type === 'text' && Array.isArray(b.citations)) {
      for (const c of b.citations) {
        if (c && c.url) into.push({ title: String(c.title || c.url).slice(0, 200), url: String(c.url) })
      }
    }
  }
}

function stripToJson(text) {
  let s = String(text || '')
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fence) s = fence[1]
  s = s.trim()
  if (!s.startsWith('{') && !s.startsWith('[')) {
    const a = s.indexOf('{'); const b = s.lastIndexOf('}')
    if (a >= 0 && b > a) s = s.slice(a, b + 1)
  }
  return s
}

/**
 * generateStructured — generate structured data from Claude, validate, repair once.
 *
 * Two output modes:
 *  - outputTool (RECOMMENDED for code/complex payloads): forced tool-use. The SDK
 *    returns the tool's parsed `input` object, so embedded code/quotes/newlines can
 *    never break JSON parsing (the classic "LLM JSON with embedded code" failure).
 *  - strict-JSON text (default): the model returns JSON text we parse. Fine for
 *    plain data; supports optional server `tools` (e.g. web_search) passthrough.
 *
 * @param {Object} o
 * @param {string} o.system                         system prompt
 * @param {string} o.user                           user prompt
 * @param {(data:any)=>(string|null)} o.schema      validator: return null if valid, else why
 * @param {number} [o.maxTokens=4000]
 * @param {Array}  [o.tools]                         e.g. [webSearchTool()] — server tools (text mode only)
 * @param {Object} [o.outputTool]                   { name, description, input_schema } — forces tool-use mode
 * @returns {Promise<{data:any, usage:{input_tokens:number,output_tokens:number}, sources:Array<{title:string,url:string}>, truncated:boolean}>}
 * @throws {ForgeError} 502 if no valid output after the single repair / call cap
 */
async function generateStructured({ system, user, schema, maxTokens = 4000, tools, outputTool }) {
  if (typeof schema !== 'function') throw new ForgeError('generateStructured: schema must be a validator function', 500)
  const client = getClient()
  const usage = { input_tokens: 0, output_tokens: 0 }
  const sources = []
  let calls = 0
  let lastStop = null

  // One model call → returns the raw message. `mode` picks tooling.
  async function call(userContent, mode) {
    if (calls >= MAX_MODEL_CALLS) throw new ForgeError('model-call cap reached', 502, 'AI did not return a valid result. Please try again.')
    calls++
    const params = { model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: userContent }] }
    if (mode === 'force-tool') { params.tools = [outputTool]; params.tool_choice = { type: 'tool', name: outputTool.name } }
    else if (mode === 'web-search' && tools && tools.length) { params.tools = tools }
    const msg = await client.messages.create(params)
    usage.input_tokens += (msg.usage && msg.usage.input_tokens) || 0
    usage.output_tokens += (msg.usage && msg.usage.output_tokens) || 0
    lastStop = msg.stop_reason
    collectSources(msg, sources)
    console.error(`[forge] call ${calls} stop_reason=${msg.stop_reason} out_tokens=${(msg.usage && msg.usage.output_tokens) || 0}`)
    return msg
  }

  const dedupeSources = () => {
    const seen = new Set(); const out = []
    for (const s of sources) { if (s.url && !seen.has(s.url)) { seen.add(s.url); out.push(s) } }
    return out
  }

  // ── Mode A: forced tool-use (robust structured output) ──
  if (outputTool) {
    let msg = await call(user, 'force-tool')
    let data = toolInput(msg, outputTool.name)
    let why = data ? schema(data) : 'no tool output'
    if (why) {
      msg = await call(
        user + '\n\nYour previous ' + outputTool.name + ' call was invalid (' + why + '). ' +
        'Call ' + outputTool.name + ' again with every required field present and correct.',
        'force-tool',
      )
      data = toolInput(msg, outputTool.name)
      why = data ? schema(data) : 'no tool output'
    }
    if (why) throw new ForgeError('invalid tool output after repair: ' + why, 502, 'AI did not return a valid result. Please try again.')
    return { data, usage, sources: dedupeSources(), truncated: lastStop === 'max_tokens' }
  }

  // ── Mode B: strict-JSON text (optionally with web_search) ──
  const wantTools = !!(tools && tools.length)
  let msg
  try {
    msg = await call(user, wantTools ? 'web-search' : 'plain')
  } catch (e) {
    // If the tools call failed (e.g. web_search unavailable), fall back ONCE to a
    // plain generation so the endpoint still returns a valid result.
    if (wantTools && !(e instanceof ForgeError && e.status === 502 && /cap reached/.test(e.message))) {
      console.error('[forge] tooled call failed, falling back without tools:', String(e && e.message))
      msg = await call(user, 'plain')
    } else { throw e }
  }
  let text = extractText(msg)

  let data = null
  try { data = JSON.parse(stripToJson(text)) } catch { /* invalid */ }
  let why = data ? schema(data) : 'non-JSON output'

  if (why) {
    msg = await call(
      'The text below was supposed to be valid JSON ONLY (no prose, no code fences) but it was invalid (' + why + ').\n' +
      'Return ONLY the corrected, valid JSON — same data, fixed format:\n\n' + String(text).slice(0, 6000),
      'plain',
    )
    text = extractText(msg)
    data = null
    try { data = JSON.parse(stripToJson(text)) } catch { /* invalid */ }
    why = data ? schema(data) : 'non-JSON output'
  }

  if (why) throw new ForgeError('invalid structured output after repair: ' + why, 502, 'AI did not return a valid result. Please try again.')

  return { data, usage, sources: dedupeSources(), truncated: lastStop === 'max_tokens' }
}

module.exports = {
  generateStructured,
  caps,
  webSearchTool,
  readJsonBody,
  ForgeError,
  sendError,
  PIPELINE,
  MAX_MODEL_CALLS,
}
