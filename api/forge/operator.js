// POST /api/forge/operator — Forge Stage 4 (Reality Operation).
// SERVER ONLY: ANTHROPIC_API_KEY never reaches the client.
//
// Consumes Creator's starter (the system to be operated) + blueprint context and
// produces an OPERATIONS PLAN: monitoring, reliability, scaling, maintenance, and a
// runbook a human follows.
//
// HONEST SCOPE: this is a generated PLAN, not a live operations system. Nothing is
// being monitored, scaled, or maintained automatically — there is no deployed
// product in this pipeline. It describes a recommended setup a human implements on
// a real deployment. No "continuously monitors/optimizes", "keeps reality alive",
// "autonomously deploys", or "your reality is now operating" language. web_search OFF.
const {
  generateStructured, caps, readJsonBody, ForgeError, sendError,
} = require('../_lib/forge')

const OP_MAX_TOKENS = 6000   // schema is array-heavy; sized so a full plan completes in one call
const SIGNALS_MAX = 8, DASHBOARDS_MAX = 5, SLOS_MAX = 5, ALERTING_MAX = 5
const TRIGGERS_MAX = 5, COSTCTRL_MAX = 5, ROUTINES_MAX = 6, SECHYG_MAX = 5, RUNBOOK_MAX = 8

const DISCLAIMER =
  'AI-generated operations PLAN — a recommended setup for a human to implement. ' +
  'Nothing here is monitoring, scaling, or maintaining anything automatically; there ' +
  'is no deployed system in this pipeline. It requires a real deployment and human ' +
  'execution. Review and adapt before relying on any of it.'

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x) }
function arrOfObjWithName(a) { return Array.isArray(a) && a.every((o) => isObj(o) && typeof o.name === 'string') }
function validate(d) {
  if (!isObj(d)) return 'not an object'
  if (typeof d.summary !== 'string') return 'summary'
  const m = d.monitoring
  if (!isObj(m) || !arrOfObjWithName(m.signals) || !Array.isArray(m.dashboards)) return 'monitoring'
  const r = d.reliability
  if (!isObj(r) || !Array.isArray(r.slos) || !Array.isArray(r.alerting) || typeof r.incidentProcess !== 'string') return 'reliability'
  const s = d.scaling
  if (!isObj(s) || !Array.isArray(s.triggers) || typeof s.approach !== 'string' || !Array.isArray(s.costControls)) return 'scaling'
  const mt = d.maintenance
  if (!isObj(mt) || !Array.isArray(mt.routines) || !Array.isArray(mt.securityHygiene)) return 'maintenance'
  if (!Array.isArray(d.runbook)) return 'runbook'
  return null
}

const SYSTEM = [
  'You are Aurexis Operator, the operations-planning stage of a build pipeline. You',
  'receive a starter project and its blueprint and produce an OPERATIONS PLAN — a',
  'recommended setup for a human to implement ON a real deployment.',
  '',
  'CRITICAL FRAMING: nothing is deployed or running in this pipeline. You are writing',
  '"a plan for operating…", "a recommended monitoring setup…", "an incident process to',
  'follow". Do NOT claim anything is being monitored, scaled, optimized, or maintained',
  'automatically. No "continuously monitors", "keeps it alive", "autonomously deploys",',
  '"self-healing", or present-tense "your system is now operating". It is a PLAN.',
  '',
  'Be concrete and specific to THIS project and stack — name real signals, tools, SLOs,',
  'scaling triggers, and runbook steps a small team could actually adopt. No boilerplate.',
  '',
  'Output STRICT JSON ONLY — no prose, no markdown, no code fences. Shape:',
  '{',
  '  "summary": string,                 // what this operations plan covers + what it is NOT',
  '  "monitoring": {',
  '    "signals": [ { "name": string, "why": string, "tool": string } ] (<=' + SIGNALS_MAX + '),',
  '    "dashboards": string[ (<=' + DASHBOARDS_MAX + ') ]',
  '  },',
  '  "reliability": {',
  '    "slos": string[ (<=' + SLOS_MAX + ') ],',
  '    "alerting": string[ (<=' + ALERTING_MAX + ') ],',
  '    "incidentProcess": string',
  '  },',
  '  "scaling": {',
  '    "triggers": string[ (<=' + TRIGGERS_MAX + ') ],',
  '    "approach": string,',
  '    "costControls": string[ (<=' + COSTCTRL_MAX + ') ]',
  '  },',
  '  "maintenance": {',
  '    "routines": string[ (<=' + ROUTINES_MAX + ') ],',
  '    "securityHygiene": string[ (<=' + SECHYG_MAX + ') ]',
  '  },',
  '  "runbook": string[ (<=' + RUNBOOK_MAX + ') ]   // ordered ops steps a human follows',
  '}',
].join('\n')

function userPrompt(input) {
  const st = input.starter || {}
  const bp = input.blueprint || {}
  const im = bp.infrastructureModel || {}, sm = bp.systemModel || {}, gm = bp.growthModel || {}
  const lines = [
    'Project to write an operations plan for:',
    'projectName: ' + (st.projectName || bp.projectName || ''),
    st.summary ? 'starter summary: ' + st.summary : '',
    Array.isArray(st.stack) && st.stack.length ? 'stack: ' + st.stack.join(', ') : '',
    isObj(st.whatsRealVsStub) && Array.isArray(st.whatsRealVsStub.stubbed) ? 'currently stubbed (not yet real): ' + st.whatsRealVsStub.stubbed.join('; ') : '',
    '',
    sm.summary ? 'systemModel: ' + sm.summary : '',
    Array.isArray(im.stack) && im.stack.length ? 'intended production stack: ' + im.stack.join(', ') : '',
    im.hosting ? 'intended hosting: ' + im.hosting : '',
    im.estimatedMonthlyCost ? 'intended monthly cost: ' + im.estimatedMonthlyCost : '',
    gm.northStarMetric ? 'north-star metric: ' + gm.northStarMetric : '',
    input.domain ? 'domain: ' + input.domain : '',
    '',
    'Write the operations PLAN as STRICT JSON in the required shape — specific to this',
    'project/stack, framed as a plan for a human to implement on a real deployment.',
  ]
  return lines.filter(Boolean).join('\n')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, new ForgeError('method not allowed; use POST', 405))
  try {
    const input = await readJsonBody(req)
    if (!input || typeof input !== 'object') return sendError(res, new ForgeError('invalid or missing JSON body', 400))
    const st = input.starter, bp = input.blueprint
    const projectName = (isObj(st) && typeof st.projectName === 'string' && st.projectName.trim()) ? st.projectName.trim()
      : (isObj(bp) && typeof bp.projectName === 'string' ? bp.projectName.trim() : '')
    if (!projectName) return sendError(res, new ForgeError('starter.projectName is required', 400))
    const hasContext = (isObj(st) && typeof st.summary === 'string' && st.summary.trim()) ||
      (isObj(bp) && isObj(bp.systemModel))
    if (!hasContext) return sendError(res, new ForgeError('starter.summary or blueprint.systemModel is required', 400))

    const { data, usage, truncated: genTruncated } = await generateStructured({
      system: SYSTEM,
      user: userPrompt(input),
      schema: validate,
      maxTokens: OP_MAX_TOKENS,
      // web_search OFF, mode B (strict-JSON text) — output is a plan, not code
    })

    const c = caps()
    const m = data.monitoring, r = data.reliability, s = data.scaling, mt = data.maintenance
    const out = {
      ok: true,
      generatedAt: new Date().toISOString(),
      projectName: c.str(projectName, 120),
      summary: c.str(data.summary, 600),
      monitoring: {
        signals: c.arr(m.signals, SIGNALS_MAX).map((x) => ({ name: c.str(x.name, 80), why: c.str(x.why, 200), tool: c.str(x.tool, 80) })),
        dashboards: c.arr(m.dashboards, DASHBOARDS_MAX).map((x) => c.str(x, 120)),
      },
      reliability: {
        slos: c.arr(r.slos, SLOS_MAX).map((x) => c.str(x, 160)),
        alerting: c.arr(r.alerting, ALERTING_MAX).map((x) => c.str(x, 160)),
        incidentProcess: c.str(r.incidentProcess, 500),
      },
      scaling: {
        triggers: c.arr(s.triggers, TRIGGERS_MAX).map((x) => c.str(x, 160)),
        approach: c.str(s.approach, 500),
        costControls: c.arr(s.costControls, COSTCTRL_MAX).map((x) => c.str(x, 160)),
      },
      maintenance: {
        routines: c.arr(mt.routines, ROUTINES_MAX).map((x) => c.str(x, 200)),
        securityHygiene: c.arr(mt.securityHygiene, SECHYG_MAX).map((x) => c.str(x, 200)),
      },
      runbook: c.arr(data.runbook, RUNBOOK_MAX).map((x) => c.str(x, 240)),
      disclaimer: DISCLAIMER,
      truncated: c.truncated() || genTruncated,
      usage,
    }
    console.log(
      `[operator] ok project="${out.projectName}" signals=${out.monitoring.signals.length} ` +
      `runbook=${out.runbook.length} truncated=${out.truncated} tokens in/out=${usage.input_tokens}/${usage.output_tokens}`,
    )
    res.status(200).json(out)
  } catch (e) {
    sendError(res, e)
  }
}
