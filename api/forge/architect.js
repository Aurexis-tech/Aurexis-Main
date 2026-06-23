// POST /api/forge/architect — Forge Stage 2 (Architect: Reality Design).
// SERVER ONLY: ANTHROPIC_API_KEY never reaches the client.
//
// Consumes exactly ONE opportunity from Scout's OpportunityReport (the one the
// user chose) plus their profile/domain context, and designs a full Reality
// Blueprint: business / product / system / growth / infrastructure models.
//
// HONEST SCOPE: this is an AI-GENERATED design to EVALUATE — a coherent starting
// blueprint, not "the future reality" as literal fact and not a guarantee it will
// work. The disclaimer below is set server-side so it is always present.
//
// WEB SEARCH: OFF by default. Architect is a design step over already-scouted
// data, so it skips the heavy search cost Scout already paid. The code path to
// enable it later exists (USE_WEB_SEARCH) but is intentionally off.
const {
  generateStructured, caps, webSearchTool, readJsonBody, ForgeError, sendError,
} = require('../_lib/forge')

const USE_WEB_SEARCH = false      // design step — pure generation; flip on later if needed
const ARCH_MAX_TOKENS = 5000      // sized to the schema; no web_search inflation

// ── caps (enforced server-side, not just requested in the prompt) ──
const SEGMENTS_MAX = 5, REVENUE_MAX = 5
const FEATURES_MAX = 6, DIFFERENTIATORS_MAX = 4
const COMPONENTS_MAX = 8, INTEGRATIONS_MAX = 6
const CHANNELS_MAX = 5, LOOPS_MAX = 3
const STACK_MAX = 10, KEYRISKS_MAX = 5

const DISCLAIMER =
  'AI-generated design to evaluate — a coherent starting blueprint, not a finished ' +
  'plan and not a guarantee it will work. Validate every assumption (demand, costs, ' +
  'integrations, unit economics) before building anything.'

// Validator for the model's JSON (we attach generatedAt/opportunityTitle/disclaimer).
function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x) }
function arrOfObjWithName(a) { return Array.isArray(a) && a.every((o) => isObj(o) && typeof o.name === 'string') }
function validate(d) {
  if (!isObj(d)) return 'not an object'
  if (typeof d.projectName !== 'string' || !d.projectName.trim()) return 'projectName'

  const bm = d.businessModel
  if (!isObj(bm)) return 'businessModel'
  if (typeof bm.valueProposition !== 'string') return 'businessModel.valueProposition'
  if (!Array.isArray(bm.customerSegments)) return 'businessModel.customerSegments'
  if (!Array.isArray(bm.revenueStreams)) return 'businessModel.revenueStreams'
  if (typeof bm.pricingApproach !== 'string') return 'businessModel.pricingApproach'
  if (typeof bm.unitEconomics !== 'string') return 'businessModel.unitEconomics'

  const pm = d.productModel
  if (!isObj(pm)) return 'productModel'
  if (typeof pm.summary !== 'string') return 'productModel.summary'
  if (!arrOfObjWithName(pm.coreFeatures)) return 'productModel.coreFeatures'
  if (typeof pm.mvpScope !== 'string') return 'productModel.mvpScope'
  if (!Array.isArray(pm.differentiators)) return 'productModel.differentiators'

  const sm = d.systemModel
  if (!isObj(sm)) return 'systemModel'
  if (typeof sm.summary !== 'string') return 'systemModel.summary'
  if (!arrOfObjWithName(sm.components)) return 'systemModel.components'
  if (typeof sm.dataFlow !== 'string') return 'systemModel.dataFlow'
  if (!Array.isArray(sm.integrations)) return 'systemModel.integrations'

  const gm = d.growthModel
  if (!isObj(gm)) return 'growthModel'
  if (typeof gm.summary !== 'string') return 'growthModel.summary'
  if (!Array.isArray(gm.channels)) return 'growthModel.channels'
  if (!Array.isArray(gm.loops)) return 'growthModel.loops'
  if (typeof gm.northStarMetric !== 'string') return 'growthModel.northStarMetric'

  const im = d.infrastructureModel
  if (!isObj(im)) return 'infrastructureModel'
  if (typeof im.summary !== 'string') return 'infrastructureModel.summary'
  if (!Array.isArray(im.stack)) return 'infrastructureModel.stack'
  if (typeof im.hosting !== 'string') return 'infrastructureModel.hosting'
  if (typeof im.estimatedMonthlyCost !== 'string') return 'infrastructureModel.estimatedMonthlyCost'

  if (!Array.isArray(d.keyRisks)) return 'keyRisks'
  return null
}

const SYSTEM = [
  'You are Aurexis Architect, the reality-design stage of a build pipeline.',
  'You receive ONE chosen opportunity (already discovered by the Scout stage) plus',
  'the founder\'s context. Design a coherent, concrete Reality Blueprint for it: how',
  'the business, product, system, growth, and infrastructure actually fit together.',
  '',
  'Be specific and INTERNALLY CONSISTENT with THIS opportunity — name real-ish',
  'features, components, channels, and a realistic stack a small team could run. No',
  'generic boilerplate. This is a design to EVALUATE, not a guarantee it will work.',
  '',
  'Output STRICT JSON ONLY — no prose, no markdown, no code fences. Shape:',
  '{',
  '  "projectName": string,',
  '  "businessModel": {',
  '    "valueProposition": string,',
  '    "customerSegments": string[ (<=' + SEGMENTS_MAX + ') ],',
  '    "revenueStreams": string[ (<=' + REVENUE_MAX + ') ],',
  '    "pricingApproach": string,',
  '    "unitEconomics": string',
  '  },',
  '  "productModel": {',
  '    "summary": string,',
  '    "coreFeatures": [ { "name": string, "description": string } ] (<=' + FEATURES_MAX + '),',
  '    "mvpScope": string,',
  '    "differentiators": string[ (<=' + DIFFERENTIATORS_MAX + ') ]',
  '  },',
  '  "systemModel": {',
  '    "summary": string,',
  '    "components": [ { "name": string, "role": string } ] (<=' + COMPONENTS_MAX + '),',
  '    "dataFlow": string,',
  '    "integrations": string[ (<=' + INTEGRATIONS_MAX + ') ]',
  '  },',
  '  "growthModel": {',
  '    "summary": string,',
  '    "channels": string[ (<=' + CHANNELS_MAX + ') ],',
  '    "loops": string[ (<=' + LOOPS_MAX + ') ],',
  '    "northStarMetric": string',
  '  },',
  '  "infrastructureModel": {',
  '    "summary": string,',
  '    "stack": string[ (<=' + STACK_MAX + ') ],',
  '    "hosting": string,',
  '    "estimatedMonthlyCost": string',
  '  },',
  '  "keyRisks": string[ (<=' + KEYRISKS_MAX + ') ]',
  '}',
].join('\n')

function userPrompt(input) {
  const o = input.opportunity
  const p = input.profile || {}
  const lines = [
    'Domain: ' + input.domain,
    '',
    'Chosen opportunity to design for:',
    '  title: ' + o.title,
    '  summary: ' + o.summary,
    o.marketPotential ? '  marketPotential: ' + (o.marketPotential.score != null ? o.marketPotential.score + '/100 — ' : '') + (o.marketPotential.rationale || '') : '',
    o.competition ? '  competition: ' + (o.competition.level || '') + (o.competition.notes ? ' — ' + o.competition.notes : '') : '',
    o.timingScore != null ? '  timingScore: ' + o.timingScore + '/100' : '',
    o.entryStrategy ? '  entryStrategy: ' + o.entryStrategy : '',
    Array.isArray(o.risks) && o.risks.length ? '  risks: ' + o.risks.join('; ') : '',
    '',
    p.label ? 'Founder profile: ' + p.label : '',
    [p.style ? 'style ' + p.style : '', p.time ? 'availability ' + p.time : '']
      .filter(Boolean).join(', '),
    input.answers && typeof input.answers === 'object'
      ? 'Answer signature: ' + JSON.stringify(input.answers).slice(0, 500) : '',
    '',
    'Design the Reality Blueprint as STRICT JSON in the required shape. Keep all five',
    'models concrete and consistent with this specific opportunity and a small team.',
  ]
  return lines.filter(Boolean).join('\n')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, new ForgeError('method not allowed; use POST', 405))
  try {
    const input = await readJsonBody(req)
    if (!input || typeof input !== 'object') return sendError(res, new ForgeError('invalid or missing JSON body', 400))
    const o = input.opportunity
    if (!o || typeof o !== 'object' || typeof o.title !== 'string' || !o.title.trim()) {
      return sendError(res, new ForgeError('opportunity.title is required', 400))
    }
    if (typeof o.summary !== 'string' || !o.summary.trim()) {
      return sendError(res, new ForgeError('opportunity.summary is required', 400))
    }
    const domain = typeof input.domain === 'string' ? input.domain.trim() : ''
    if (!domain) return sendError(res, new ForgeError('domain is required', 400))

    const { data, usage, truncated: genTruncated } = await generateStructured({
      system: SYSTEM,
      user: userPrompt({ ...input, domain }),
      schema: validate,
      maxTokens: ARCH_MAX_TOKENS,
      tools: USE_WEB_SEARCH ? [webSearchTool(4)] : undefined,
    })

    // ── enforce caps server-side ──
    const c = caps()
    const bm = data.businessModel, pm = data.productModel, sm = data.systemModel,
      gm = data.growthModel, im = data.infrastructureModel
    const out = {
      ok: true,
      generatedAt: new Date().toISOString(),
      opportunityTitle: c.str(o.title, 120),
      projectName: c.str(data.projectName, 120),
      businessModel: {
        valueProposition: c.str(bm.valueProposition, 400),
        customerSegments: c.arr(bm.customerSegments, SEGMENTS_MAX).map((s) => c.str(s, 120)),
        revenueStreams: c.arr(bm.revenueStreams, REVENUE_MAX).map((s) => c.str(s, 120)),
        pricingApproach: c.str(bm.pricingApproach, 300),
        unitEconomics: c.str(bm.unitEconomics, 400),
      },
      productModel: {
        summary: c.str(pm.summary, 400),
        coreFeatures: c.arr(pm.coreFeatures, FEATURES_MAX).map((f) => ({
          name: c.str(f.name, 80), description: c.str(f.description, 240),
        })),
        mvpScope: c.str(pm.mvpScope, 400),
        differentiators: c.arr(pm.differentiators, DIFFERENTIATORS_MAX).map((s) => c.str(s, 160)),
      },
      systemModel: {
        summary: c.str(sm.summary, 400),
        components: c.arr(sm.components, COMPONENTS_MAX).map((co) => ({
          name: c.str(co.name, 80), role: c.str(co.role, 200),
        })),
        dataFlow: c.str(sm.dataFlow, 400),
        integrations: c.arr(sm.integrations, INTEGRATIONS_MAX).map((s) => c.str(s, 120)),
      },
      growthModel: {
        summary: c.str(gm.summary, 400),
        channels: c.arr(gm.channels, CHANNELS_MAX).map((s) => c.str(s, 120)),
        loops: c.arr(gm.loops, LOOPS_MAX).map((s) => c.str(s, 200)),
        northStarMetric: c.str(gm.northStarMetric, 200),
      },
      infrastructureModel: {
        summary: c.str(im.summary, 400),
        stack: c.arr(im.stack, STACK_MAX).map((s) => c.str(s, 80)),
        hosting: c.str(im.hosting, 200),
        estimatedMonthlyCost: c.str(im.estimatedMonthlyCost, 120),
      },
      keyRisks: c.arr(data.keyRisks, KEYRISKS_MAX).map((s) => c.str(s, 200)),
      disclaimer: DISCLAIMER,
      truncated: c.truncated() || genTruncated,
      usage,
    }
    console.log(
      `[architect] ok project="${out.projectName}" opp="${out.opportunityTitle}" ` +
      `features=${out.productModel.coreFeatures.length} components=${out.systemModel.components.length} ` +
      `truncated=${out.truncated} tokens in/out=${usage.input_tokens}/${usage.output_tokens}`,
    )
    res.status(200).json(out)
  } catch (e) {
    sendError(res, e)
  }
}
