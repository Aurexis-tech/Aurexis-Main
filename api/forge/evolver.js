// POST /api/forge/evolver — Forge Stage 5 (Reality Evolution).
// SERVER ONLY: ANTHROPIC_API_KEY never reaches the client.
//
// Consumes the whole chain (opportunity + blueprint + starter + operations) and
// produces an IMPROVEMENT ROADMAP a human runs: an Observe→Analyze→Simulate→Improve
// →Deploy loop described AS A PROCESS, concrete experiments, a time-phased roadmap,
// and guardrails.
//
// HONEST SCOPE: this is a generated ROADMAP for a human to run, NOT an autonomous or
// self-improving system. Nothing is being observed, optimized, or deployed
// automatically — there is no live product in this pipeline. No "self-improving
// system", "your reality is now evolving", "continuously optimizes", or
// "autonomously deploys" language. web_search OFF.
const {
  generateStructured, caps, readJsonBody, ForgeError, sendError,
} = require('../_lib/forge')

const EV_MAX_TOKENS = 6000   // schema is array-heavy; sized so a full roadmap completes in one call
const STEP_MAX = 5            // each cycle phase
const EXPERIMENTS_MAX = 6
const THIRTY_MAX = 5, NINETY_MAX = 5, YEAR_MAX = 4, GUARDRAILS_MAX = 5

const DISCLAIMER =
  'AI-generated improvement ROADMAP for a human to run — not an autonomous or ' +
  'self-improving system. Nothing is being observed, optimized, or deployed ' +
  'automatically; there is no live product in this pipeline. Every step requires a ' +
  'real deployed product, real data, and human judgment. Treat it as a starting plan.'

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x) }
function validate(d) {
  if (!isObj(d)) return 'not an object'
  if (typeof d.summary !== 'string') return 'summary'
  const c = d.cycle
  if (!isObj(c)) return 'cycle'
  for (const k of ['observe', 'analyze', 'simulate', 'improve', 'deploy']) {
    if (!Array.isArray(c[k])) return 'cycle.' + k
  }
  if (!Array.isArray(d.experiments)) return 'experiments'
  for (const e of d.experiments) {
    if (!isObj(e) || typeof e.hypothesis !== 'string' || typeof e.metric !== 'string' || typeof e.effort !== 'string') return 'experiment shape'
  }
  const r = d.roadmap
  if (!isObj(r) || !Array.isArray(r.thirtyDay) || !Array.isArray(r.ninetyDay) || !Array.isArray(r.oneYear)) return 'roadmap'
  if (!Array.isArray(d.guardrails)) return 'guardrails'
  return null
}

const SYSTEM = [
  'You are Aurexis Evolver, the improvement-planning stage of a build pipeline. You',
  'receive the whole chain (opportunity, blueprint, starter, operations plan) and',
  'produce an IMPROVEMENT ROADMAP a human runs.',
  '',
  'CRITICAL FRAMING: nothing is live, and nothing improves itself. Describe the',
  'Observe→Analyze→Simulate→Improve→Deploy loop AS A PROCESS the founder runs — "steps',
  'to observe…", "ways to analyze…", "what to deploy once validated". Do NOT imply an',
  'autonomous or self-improving system. No "continuously optimizes", "your reality is',
  'now evolving", "self-improving", or present-tense autonomy. It is a ROADMAP to run.',
  '',
  'Be concrete and specific to THIS product and opportunity — real metrics, real',
  'experiments with hypotheses, a realistic 30/90/365-day sequence, and guardrails that',
  'name what NOT to break. No generic growth-hacking boilerplate.',
  '',
  'Output STRICT JSON ONLY — no prose, no markdown, no code fences. Shape:',
  '{',
  '  "summary": string,                 // what this improvement framework is + is NOT',
  '  "cycle": {                          // the loop described as a process the human runs',
  '    "observe": string[ (<=' + STEP_MAX + ') ],',
  '    "analyze": string[ (<=' + STEP_MAX + ') ],',
  '    "simulate": string[ (<=' + STEP_MAX + ') ],',
  '    "improve": string[ (<=' + STEP_MAX + ') ],',
  '    "deploy": string[ (<=' + STEP_MAX + ') ]',
  '  },',
  '  "experiments": [ { "hypothesis": string, "metric": string, "effort": string } ] (<=' + EXPERIMENTS_MAX + '),',
  '  "roadmap": {',
  '    "thirtyDay": string[ (<=' + THIRTY_MAX + ') ],',
  '    "ninetyDay": string[ (<=' + NINETY_MAX + ') ],',
  '    "oneYear": string[ (<=' + YEAR_MAX + ') ]',
  '  },',
  '  "guardrails": string[ (<=' + GUARDRAILS_MAX + ') ]   // what NOT to break while iterating',
  '}',
].join('\n')

function userPrompt(input) {
  const st = input.starter || {}, bp = input.blueprint || {}, op = input.opportunity || {}, ops = input.operations || {}
  const pm = bp.productModel || {}, gm = bp.growthModel || {}, bm = bp.businessModel || {}
  const lines = [
    'Improve this designed product (it is NOT live yet — this is a roadmap to run):',
    'projectName: ' + (st.projectName || bp.projectName || op.title || ''),
    op.title ? 'chosen opportunity: ' + op.title : '',
    op.summary ? 'opportunity summary: ' + op.summary : '',
    st.summary ? 'starter summary: ' + st.summary : '',
    pm.summary ? 'productModel: ' + pm.summary : '',
    bm.valueProposition ? 'valueProposition: ' + bm.valueProposition : '',
    gm.northStarMetric ? 'north-star metric: ' + gm.northStarMetric : '',
    Array.isArray(gm.channels) && gm.channels.length ? 'growth channels: ' + gm.channels.join(', ') : '',
    isObj(st.whatsRealVsStub) && Array.isArray(st.whatsRealVsStub.stubbed) ? 'currently stubbed: ' + st.whatsRealVsStub.stubbed.join('; ') : '',
    ops.summary ? 'operations plan summary: ' + ops.summary : '',
    input.domain ? 'domain: ' + input.domain : '',
    '',
    'Write the improvement ROADMAP as STRICT JSON in the required shape — concrete and',
    'specific to this product/opportunity, framed as a loop and roadmap a human runs.',
  ]
  return lines.filter(Boolean).join('\n')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, new ForgeError('method not allowed; use POST', 405))
  try {
    const input = await readJsonBody(req)
    if (!input || typeof input !== 'object') return sendError(res, new ForgeError('invalid or missing JSON body', 400))
    const st = input.starter, bp = input.blueprint, op = input.opportunity
    const projectName = (isObj(st) && typeof st.projectName === 'string' && st.projectName.trim()) ? st.projectName.trim()
      : (isObj(op) && typeof op.title === 'string' && op.title.trim()) ? op.title.trim()
      : (isObj(bp) && typeof bp.projectName === 'string' ? bp.projectName.trim() : '')
    const hasContext = projectName || (isObj(bp) && isObj(bp.productModel)) || (isObj(op) && typeof op.title === 'string')
    if (!hasContext) {
      return sendError(res, new ForgeError('one of starter.projectName, blueprint.productModel, or opportunity.title is required', 400))
    }

    const { data, usage, truncated: genTruncated } = await generateStructured({
      system: SYSTEM,
      user: userPrompt(input),
      schema: validate,
      maxTokens: EV_MAX_TOKENS,
      // web_search OFF, mode B (strict-JSON text)
    })

    const c = caps()
    const cy = data.cycle, rm = data.roadmap
    const out = {
      ok: true,
      generatedAt: new Date().toISOString(),
      projectName: c.str(projectName || 'your project', 120),
      summary: c.str(data.summary, 600),
      cycle: {
        observe: c.arr(cy.observe, STEP_MAX).map((x) => c.str(x, 160)),
        analyze: c.arr(cy.analyze, STEP_MAX).map((x) => c.str(x, 160)),
        simulate: c.arr(cy.simulate, STEP_MAX).map((x) => c.str(x, 160)),
        improve: c.arr(cy.improve, STEP_MAX).map((x) => c.str(x, 160)),
        deploy: c.arr(cy.deploy, STEP_MAX).map((x) => c.str(x, 160)),
      },
      experiments: c.arr(data.experiments, EXPERIMENTS_MAX).map((e) => ({
        hypothesis: c.str(e.hypothesis, 240), metric: c.str(e.metric, 160), effort: c.str(e.effort, 80),
      })),
      roadmap: {
        thirtyDay: c.arr(rm.thirtyDay, THIRTY_MAX).map((x) => c.str(x, 160)),
        ninetyDay: c.arr(rm.ninetyDay, NINETY_MAX).map((x) => c.str(x, 160)),
        oneYear: c.arr(rm.oneYear, YEAR_MAX).map((x) => c.str(x, 160)),
      },
      guardrails: c.arr(data.guardrails, GUARDRAILS_MAX).map((x) => c.str(x, 200)),
      disclaimer: DISCLAIMER,
      truncated: c.truncated() || genTruncated,
      usage,
    }
    console.log(
      `[evolver] ok project="${out.projectName}" experiments=${out.experiments.length} ` +
      `guardrails=${out.guardrails.length} truncated=${out.truncated} tokens in/out=${usage.input_tokens}/${usage.output_tokens}`,
    )
    res.status(200).json(out)
  } catch (e) {
    sendError(res, e)
  }
}
