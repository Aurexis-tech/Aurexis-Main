// POST /api/forge/scout — Forge Stage 1 (Scout: Opportunity Discovery).
// SERVER ONLY: ANTHROPIC_API_KEY never reaches the client.
//
// Uses Claude with the server-side web_search tool to gather CURRENT market /
// trend / competition signals, then returns a ranked Opportunity Report.
//
// HONEST SCOPE: this is an AI-GENERATED opportunity report to INVESTIGATE — a
// starting point for the user's own research. It is NOT a guarantee that a real
// market gap exists, and NOT a prediction of success. The disclaimer below is set
// server-side so it is always present.
const {
  generateStructured, caps, webSearchTool, readJsonBody, ForgeError, sendError,
} = require('../_lib/forge')

// ── caps (enforced server-side, not just requested in the prompt) ──
const OPP_MIN = 3, OPP_MAX = 6
const RISKS_MAX = 4
const SOURCES_MAX = 8
const SCOUT_MAX_TOKENS = 5000 // sized for 3–6 opportunities + room for web_search reasoning

const DISCLAIMER =
  'AI-generated opportunity analysis — directional only and possibly inaccurate or ' +
  'out of date. Verify every claim independently before acting. This is a starting ' +
  'point to investigate, not a guarantee that a real market gap exists or that any ' +
  'opportunity will succeed.'

// Validator for the model's JSON (we attach sources/disclaimer/generatedAt ourselves).
function validate(d) {
  if (!d || typeof d !== 'object') return 'not an object'
  if (!Array.isArray(d.opportunities) || d.opportunities.length < 1) return 'opportunities[] missing/empty'
  for (const o of d.opportunities) {
    if (!o || typeof o !== 'object') return 'opportunity not an object'
    if (typeof o.title !== 'string' || !o.title.trim()) return 'opportunity.title'
    if (typeof o.summary !== 'string') return 'opportunity.summary'
    if (!o.marketPotential || typeof o.marketPotential.score !== 'number') return 'marketPotential.score'
    if (typeof o.marketPotential.rationale !== 'string') return 'marketPotential.rationale'
    if (!o.competition || ['low', 'medium', 'high'].indexOf(o.competition.level) < 0) return 'competition.level'
    if (typeof o.competition.notes !== 'string') return 'competition.notes'
    if (typeof o.timingScore !== 'number') return 'timingScore'
    if (typeof o.entryStrategy !== 'string') return 'entryStrategy'
    if (!Array.isArray(o.risks)) return 'risks[]'
  }
  return null
}

const SYSTEM = [
  'You are Aurexis Scout, the opportunity-discovery stage of a build pipeline.',
  'Use the web_search tool to gather CURRENT signals (market size/growth, trends,',
  'recent launches, incumbents, pricing, regulation) for the user\'s domain, then',
  'produce a ranked set of concrete business/product opportunities to INVESTIGATE.',
  '',
  'Be honest and specific. Each opportunity is a hypothesis grounded in what you',
  'found — NOT a guarantee of a real gap or of success. Prefer recent, citable',
  'signals over generic claims. Rank by a blend of market potential and timing.',
  '',
  'Output STRICT JSON ONLY — no prose, no markdown, no code fences. Shape:',
  '{',
  '  "opportunities": [           // ' + OPP_MIN + ' to ' + OPP_MAX + ' items, best first',
  '    {',
  '      "title": string,                 // short, concrete',
  '      "summary": string,               // 1-3 sentences: what it is + the wedge',
  '      "marketPotential": { "score": number (0-100), "rationale": string },',
  '      "competition": { "level": "low"|"medium"|"high", "notes": string },',
  '      "timingScore": number (0-100),   // why now',
  '      "entryStrategy": string,         // a realistic first wedge for a small team',
  '      "risks": string[]                // up to ' + RISKS_MAX + ', the real ones',
  '    }',
  '  ]',
  '}',
  'Do not include sources/citations in the JSON; they are captured separately.',
].join('\n')

function userPrompt(input) {
  const p = input.profile || {}
  const lines = [
    'Domain / interest to scout: ' + input.domain,
    input.focus ? 'Focus / constraint: ' + input.focus : '',
    p.label ? 'Founder profile: ' + p.label : '',
    [p.style ? 'style ' + p.style : '', p.time ? 'availability ' + p.time : '']
      .filter(Boolean).join(', '),
    input.answers && typeof input.answers === 'object'
      ? 'Answer signature: ' + JSON.stringify(input.answers).slice(0, 600) : '',
    '',
    'Search the web for current signals, then return ' + OPP_MIN + '–' + OPP_MAX +
      ' ranked opportunities as STRICT JSON in the required shape.',
  ]
  return lines.filter(Boolean).join('\n')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, new ForgeError('method not allowed; use POST', 405))
  try {
    const input = await readJsonBody(req)
    if (!input || typeof input !== 'object') return sendError(res, new ForgeError('invalid or missing JSON body', 400))
    const domain = typeof input.domain === 'string' ? input.domain.trim()
      : (input.answers && typeof input.answers.domain === 'string' ? input.answers.domain.trim() : '')
    if (!domain) return sendError(res, new ForgeError('domain is required', 400))

    const { data, usage, sources, truncated: genTruncated } = await generateStructured({
      system: SYSTEM,
      user: userPrompt({ ...input, domain }),
      schema: validate,
      maxTokens: SCOUT_MAX_TOKENS,
      tools: [webSearchTool(5)],
    })

    // ── enforce caps server-side ──
    const c = caps()
    const opportunities = c.arr(data.opportunities, OPP_MAX).map((o) => ({
      title: c.str(o.title, 120),
      summary: c.str(o.summary, 400),
      marketPotential: {
        score: c.num(o.marketPotential && o.marketPotential.score, 0, 100),
        rationale: c.str(o.marketPotential && o.marketPotential.rationale, 400),
      },
      competition: {
        level: c.enum(o.competition && o.competition.level, ['low', 'medium', 'high'], 'medium'),
        notes: c.str(o.competition && o.competition.notes, 300),
      },
      timingScore: c.num(o.timingScore, 0, 100),
      entryStrategy: c.str(o.entryStrategy, 400),
      risks: c.arr(o.risks, RISKS_MAX).map((r) => c.str(r, 200)),
    }))
    const outSources = c.arr(sources, SOURCES_MAX).map((s) => ({
      title: c.str(s.title, 200), url: c.str(s.url, 400),
    }))

    const searchedButEmpty = outSources.length === 0
    const out = {
      ok: true,
      generatedAt: new Date().toISOString(),
      domain: c.str(domain, 80),
      opportunities,
      sources: outSources,
      disclaimer: searchedButEmpty
        ? DISCLAIMER + ' (Note: web search returned no usable sources for this run, so this report leans on the model\'s prior knowledge and should be treated with extra caution.)'
        : DISCLAIMER,
      truncated: c.truncated() || genTruncated,
      usage,
    }
    console.log(
      `[scout] ok domain="${out.domain}" opps=${opportunities.length} sources=${outSources.length} ` +
      `truncated=${out.truncated} tokens in/out=${usage.input_tokens}/${usage.output_tokens}`,
    )
    res.status(200).json(out)
  } catch (e) {
    sendError(res, e)
  }
}
