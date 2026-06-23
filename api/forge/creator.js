// POST /api/forge/creator — Forge Stage 3 (Creator: Reality Construction).
// SERVER ONLY: ANTHROPIC_API_KEY never reaches the client.
//
// Consumes Architect's Reality Blueprint and generates a SMALL, COHERENT, RUNNABLE
// starter project: real files for the single most central piece of the system,
// runnable locally with minimal setup and NO secrets (external services mocked).
//
// HONEST SCOPE: this is "a real starter project you can build from" — NOT a running
// business and NOT deployed infrastructure. The blueprint's infrastructureModel
// describes the INTENDED production infra; what Creator emits is a LOCAL-RUNNABLE
// starter (a skeleton: real wiring for the core path, clearly-marked TODO stubs for
// the rest). Never say the business now exists / runs / is operational.
//
// web_search OFF — pure construction from the blueprint.
const {
  generateStructured, caps, readJsonBody, ForgeError, sendError,
} = require('../_lib/forge')

// ── hard caps, enforced server-side (output-heavy stage — this is the point) ──
const MIN_FILES = 4
const MAX_FILES = 10
const MAX_FILE_BYTES = 8 * 1024       // ~8 KB per file
const MAX_TOTAL_BYTES = 90 * 1024     // ~90 KB total files payload
const CREATOR_MAX_TOKENS = 9000       // generous but BOUNDED (small scaffold should finish well under this)
const STACK_MAX = 8, REAL_MAX = 8, STUB_MAX = 8, NEXT_MAX = 6

const byteLen = (s) => Buffer.byteLength(String(s == null ? '' : s), 'utf8')

const DISCLAIMER =
  'AI-generated starter project — review before use. It is a local-runnable skeleton, ' +
  'NOT production-ready, NOT secure, and NOT deployed infrastructure. The business does ' +
  'not exist or run yet; this is a starting point for a human to build from.'

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x) }
function validate(d) {
  if (!isObj(d)) return 'not an object'
  if (typeof d.projectName !== 'string' || !d.projectName.trim()) return 'projectName'
  if (typeof d.summary !== 'string') return 'summary'
  if (!Array.isArray(d.stack)) return 'stack'
  if (typeof d.runInstructions !== 'string' || !d.runInstructions.trim()) return 'runInstructions'
  if (!Array.isArray(d.files) || d.files.length < 1) return 'files[]'
  for (const f of d.files) {
    if (!isObj(f) || typeof f.path !== 'string' || !f.path.trim()) return 'file.path'
    if (typeof f.contents !== 'string') return 'file.contents'
  }
  if (!isObj(d.whatsRealVsStub) || !Array.isArray(d.whatsRealVsStub.real) || !Array.isArray(d.whatsRealVsStub.stubbed)) return 'whatsRealVsStub'
  if (!Array.isArray(d.nextSteps)) return 'nextSteps'
  return null
}

// Enforce file caps server-side (byte-level). Returns { files, truncated }.
function applyFileCaps(rawFiles) {
  let truncated = false
  let files = rawFiles.map((f) => {
    let contents = String(f.contents)
    if (byteLen(contents) > MAX_FILE_BYTES) {
      contents = Buffer.from(contents, 'utf8').slice(0, MAX_FILE_BYTES).toString('utf8') +
        '\n/* …truncated by Forge size cap… */'
      truncated = true
    }
    return { path: String(f.path).replace(/^[/\\]+/, ''), language: String(f.language || ''), contents }
  })
  if (files.length > MAX_FILES) { files = files.slice(0, MAX_FILES); truncated = true }
  let total = 0
  const kept = []
  for (const f of files) {
    const sz = byteLen(f.path) + byteLen(f.contents)
    if (total + sz > MAX_TOTAL_BYTES) { truncated = true; break }
    total += sz; kept.push(f)
  }
  return { files: kept, truncated }
}

const SYSTEM = [
  'You are Aurexis Creator, the construction stage of a build pipeline. You receive a',
  'Reality Blueprint and emit a SMALL, COHERENT, RUNNABLE starter project for the ONE',
  'most central piece of the systemModel — the smallest thing that demonstrates the',
  'core value proposition.',
  '',
  'KEEP IT VERY SMALL. Build ONLY the single core value path (one endpoint + a minimal',
  'UI to exercise it). Everything else is a one-line stub or a TODO note — do NOT scaffold',
  'the whole systemModel. 4-5 files MAX. Each file is a CONCISE skeleton (~40-90 lines,',
  'well under 4 KB) — short stubs with TODO comments, NOT full implementations. The whole',
  'project should total only a few hundred lines. Short beats complete. (Output is hard-',
  'capped; an over-long project will be truncated and fail to run.)',
  '',
  'HARD REQUIREMENTS for the starter (these matter — it WILL be run):',
  '1. It MUST run locally with minimal setup and NO secrets/API keys to boot.',
  '2. STRONGLY PREFER zero runtime dependencies: a Node.js HTTP server using only the',
  '   built-in "http" module (CommonJS), started with `node server.js`. A package.json',
  '   with "start":"node server.js" and NO dependencies is ideal (npm install is instant).',
  '   A single static index.html with vanilla JS that opens directly is also acceptable.',
  '   AVOID anything needing a build step or heavy framework (Next.js, Vite, webpack,',
  '   React build) — they make the starter fragile to run.',
  '3. MOCK every external service (LLM, payment, carrier, DB) behind a small, clearly-',
  '   named interface that returns canned/templated data, with a "// TODO: wire real X"',
  '   comment. The core path must work end-to-end on mock data with no network/keys.',
  '4. The server must listen on `process.env.PORT || 3000` and serve a tiny HTML page',
  '   plus the core endpoint, so running it shows something real in a browser/curl.',
  '5. Include a README.md with the EXACT run commands and a package.json.',
  '',
  'This is a SKELETON: real wiring for the core path, clearly-marked TODO stubs for the',
  'rest. It is a starter to build from — NOT a running business, NOT deployed, NOT',
  'production-ready or secure. Do not imply otherwise anywhere in the files or copy.',
  '',
  'Return your result by calling the emit_starter tool. Keep it SMALL: aim for ' + MIN_FILES +
  '-6 short, focused files (max ' + MAX_FILES + '), each well under 8 KB. runInstructions must',
  'reference ONLY files you include. whatsRealVsStub must honestly list what genuinely',
  'works vs. what is mocked/stubbed.',
].join('\n')

// Forced tool-use output — the SDK returns a parsed object, so embedded code in
// file contents can never break JSON parsing (strict-JSON text fails on that).
const TOOL = {
  name: 'emit_starter',
  description: 'Emit the generated runnable starter project (files + metadata).',
  input_schema: {
    type: 'object',
    properties: {
      projectName: { type: 'string' },
      summary: { type: 'string', description: 'what this starter IS and is NOT' },
      stack: { type: 'array', items: { type: 'string' } },
      runInstructions: { type: 'string', description: 'exact local run commands; reference only included files' },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: { path: { type: 'string' }, language: { type: 'string' }, contents: { type: 'string' } },
          required: ['path', 'contents'],
        },
      },
      whatsRealVsStub: {
        type: 'object',
        properties: {
          real: { type: 'array', items: { type: 'string' } },
          stubbed: { type: 'array', items: { type: 'string' } },
        },
        required: ['real', 'stubbed'],
      },
      nextSteps: { type: 'array', items: { type: 'string' } },
    },
    required: ['projectName', 'summary', 'stack', 'runInstructions', 'files', 'whatsRealVsStub', 'nextSteps'],
  },
}

function userPrompt(input) {
  const b = input.blueprint
  const pm = b.productModel || {}, sm = b.systemModel || {}, bm = b.businessModel || {}, im = b.infrastructureModel || {}
  const feat = Array.isArray(pm.coreFeatures) ? pm.coreFeatures.map((f) => '    - ' + f.name + (f.description ? ': ' + f.description : '')).join('\n') : ''
  const comps = Array.isArray(sm.components) ? sm.components.map((c) => '    - ' + c.name + (c.role ? ': ' + c.role : '')).join('\n') : ''
  const lines = [
    'Reality Blueprint to construct from:',
    'projectName: ' + b.projectName,
    input.domain ? 'domain: ' + input.domain : '',
    bm.valueProposition ? 'valueProposition: ' + bm.valueProposition : '',
    '',
    'productModel.summary: ' + (pm.summary || ''),
    pm.mvpScope ? 'productModel.mvpScope: ' + pm.mvpScope : '',
    feat ? 'coreFeatures:\n' + feat : '',
    '',
    'systemModel.summary: ' + (sm.summary || ''),
    comps ? 'components:\n' + comps : '',
    sm.dataFlow ? 'dataFlow: ' + sm.dataFlow : '',
    Array.isArray(im.stack) && im.stack.length ? 'intended production stack (for reference only — the starter is local): ' + im.stack.join(', ') : '',
    '',
    'Pick the SINGLE most central piece (the core value path) and call emit_starter with a',
    'small runnable starter for it. It MUST run with `node server.js` (or open index.html)',
    'and NO secrets. Mock all external services. Aim for 4-6 short files.',
  ]
  return lines.filter(Boolean).join('\n')
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return sendError(res, new ForgeError('method not allowed; use POST', 405))
  try {
    const input = await readJsonBody(req)
    if (!input || typeof input !== 'object') return sendError(res, new ForgeError('invalid or missing JSON body', 400))
    const b = input.blueprint
    if (!isObj(b) || typeof b.projectName !== 'string' || !b.projectName.trim()) {
      return sendError(res, new ForgeError('blueprint.projectName is required', 400))
    }
    if (!isObj(b.systemModel)) return sendError(res, new ForgeError('blueprint.systemModel is required', 400))
    if (!isObj(b.productModel)) return sendError(res, new ForgeError('blueprint.productModel is required', 400))

    const { data, usage, truncated: genTruncated } = await generateStructured({
      system: SYSTEM,
      user: userPrompt(input),
      schema: validate,
      maxTokens: CREATOR_MAX_TOKENS,
      outputTool: TOOL,   // forced tool-use — robust for files containing real code
      // web_search intentionally OFF for construction
    })

    // ── enforce caps server-side ──
    const c = caps()
    const { files, truncated: filesTruncated } = applyFileCaps(data.files)
    const out = {
      ok: true,
      generatedAt: new Date().toISOString(),
      projectName: c.str(data.projectName, 120),
      summary: c.str(data.summary, 600),
      stack: c.arr(data.stack, STACK_MAX).map((s) => c.str(s, 80)),
      runInstructions: c.str(data.runInstructions, 800),
      files,
      whatsRealVsStub: {
        real: c.arr(data.whatsRealVsStub.real, REAL_MAX).map((s) => c.str(s, 200)),
        stubbed: c.arr(data.whatsRealVsStub.stubbed, STUB_MAX).map((s) => c.str(s, 200)),
      },
      nextSteps: c.arr(data.nextSteps, NEXT_MAX).map((s) => c.str(s, 200)),
      disclaimer: DISCLAIMER,
      truncated: c.truncated() || filesTruncated || genTruncated,
      usage,
    }
    console.log(
      `[creator] ok project="${out.projectName}" files=${files.length} ` +
      `truncated=${out.truncated} tokens in/out=${usage.input_tokens}/${usage.output_tokens}`,
    )
    res.status(200).json(out)
  } catch (e) {
    sendError(res, e)
  }
}
