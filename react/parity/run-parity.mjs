// Responsive visual-parity gate: drives the SAME guided flow through the static
// baseline (served from the repo root) and the React port (served from
// react/dist) at MULTIPLE viewport widths that straddle every CSS breakpoint,
// and pixel-diffs all 8 stages at each width.
//
// styles.css breakpoints (min-width, mobile-first):
//   560 .ustats 2→4 | 700 .tiles 2→4 | 720 .bp-grid 2→3 | 760 .dashcharts 1→2
//   820 .gp2/.g2/.g3 1→multi  (the big reflow: profile/discover/forge/sentinel/grow)
// One width per band tests each breakpoint just-below AND just-above.
//
// Determinism (unchanged): prefers-reduced-motion emulated, Math.random stubbed
// to a constant before any app code runs, fixed answer path, deviceScaleFactor 1,
// and a fixed TALL per-viewport viewport (NOT fullPage — fullPage resizes mid-
// capture and re-rasterizes the backdrop-filter panels + canvas = noise).
//
// Run:  npm run build  &&  npx playwright install chromium  &&  npm run parity
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import pixelmatchPkg from 'pixelmatch'
import pngjs from 'pngjs'

const pixelmatch = pixelmatchPkg.default || pixelmatchPkg
const { PNG } = pngjs
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPO_ROOT = path.resolve(__dirname, '../..')      // aurexis/  (baseline)
const REACT_DIST = path.resolve(__dirname, '../dist')   // react/dist (port)
const OUT = __dirname                                   // react/parity/

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.map': 'application/json' }

// Determinism: constant Math.random → identical across both apps regardless of
// call order/count (background canvas + opportunity scoring become reproducible).
const SEED = `Math.random = function(){ return 0.5; };`

// Width per band straddling 560/700/720/760/820; height tall enough to capture
// the full stage (narrower → single-column → taller). No fullPage resize.
const VIEWPORTS = [
  { name: '375',  w: 375,  h: 5000 },   // mobile        (< 560)
  { name: '600',  w: 600,  h: 4200 },   // (560–699)     ustats flips to 4-col
  { name: '710',  w: 710,  h: 3600 },   // (700–719)     tiles flips to 4-col
  { name: '740',  w: 740,  h: 3600 },   // (720–759)     bp-grid flips to 3-col
  { name: '768',  w: 768,  h: 3200 },   // tablet (760–819) dashcharts flips to 2-col
  { name: '1024', w: 1024, h: 2800 },   // small-laptop  (≥ 820) gp2/g2/g3 multi-col
  { name: '1440', w: 1440, h: 2400 },   // desktop       (≥ 820)
]

const STAGES = ['1-intro', '2-profile', '3-discover', '4-blueprint', '5-forge', '6-sentinel', '7-grow', '8-dashboard']

function serve(root, port) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0])
    if (p === '/' || p === '') p = '/index.html'
    const file = path.join(root, p)
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise(r => server.listen(port, () => r(server)))
}

// Number of resolved grid tracks for an element ('none' / single track → 1).
const TRACKS = `(sel)=>{const el=document.querySelector(sel);if(!el)return null;const v=getComputedStyle(el).gridTemplateColumns;return (v==='none'||!v)?1:v.trim().split(/\\s+/).length;}`

async function shot(page, app, vp, stage) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(180)
  const over = await page.evaluate((vh) => document.documentElement.scrollHeight > vh, vp.h)
  if (over) console.log(`  ! ${app} ${vp.name} ${stage}: content taller than capture height ${vp.h}px (possible cutoff)`)
  await page.screenshot({ path: path.join(OUT, `${app}-${vp.name}-${stage}.png`) })
}

// Drives the full flow with the exact same deterministic inputs for both apps,
// screenshots each stage, and records grid-reflow track counts as breakpoint proof.
async function drive(page, app, vp) {
  const reflow = {}
  const tracks = (sel) => page.evaluate(`(${TRACKS})(${JSON.stringify(sel)})`)

  await page.waitForSelector('#bgcanvas')
  await page.waitForFunction(() => document.querySelector('#questions')?.children.length > 0)
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await shot(page, app, vp, '1-intro')

  await page.click('#begin')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#intro')).visibility === 'hidden')

  await page.click('#questions .opts[data-k="energy"] .opt[data-v="Building things"]')
  await page.click('#questions .opts[data-k="risk"] .opt[data-v="Bold"]')
  await page.click('#questions .opts[data-k="domain"] .opt[data-v="SaaS tools"]')
  await page.click('#questions .opts[data-k="style"] .opt[data-v="Fast & iterative"]')
  await page.click('#questions .opts[data-k="time"] .opt[data-v="Full-time"]')
  await page.waitForSelector('#followups .opts[data-fid="a"] .opt')
  await page.locator('#followups .opts[data-fid="a"] .opt').first().click()
  await page.locator('#followups .opts[data-fid="b"] .opt').first().click()
  await page.locator('#followups .opts[data-fid="c"] .opt').first().click()
  await page.waitForSelector('#toDiscover:not([disabled])')
  reflow.profile_gp2 = await tracks('section[data-s="profile"] .grid.gp2')
  await shot(page, app, vp, '2-profile')

  await page.click('#toDiscover')
  await page.waitForSelector('section[data-s="discover"].on')
  await page.waitForSelector('#opps .opp')
  reflow.discover_opps = await tracks('#opps')
  await shot(page, app, vp, '3-discover')

  await page.click('#opps .opp[data-i="0"]')
  await page.waitForSelector('#toBlueprint:not([disabled])')
  await page.click('#toBlueprint')
  await page.waitForSelector('section[data-s="blueprint"].on')
  reflow.blueprint_grid = await tracks('#bpGrid')
  await shot(page, app, vp, '4-blueprint')

  await page.click('#toForge')
  await page.waitForSelector('section[data-s="forge"].on')
  reflow.forge_g2 = await tracks('section[data-s="forge"] .grid.g2')
  await page.click('#runForge')
  await page.waitForSelector('#toSentinel:not([disabled])', { timeout: 30000 })
  await shot(page, app, vp, '5-forge')

  await page.click('#toSentinel')
  await page.waitForSelector('section[data-s="sentinel"].on')
  await page.click('#runSentinel')
  await page.waitForSelector('#toStudio:not([disabled])', { timeout: 30000 })
  await shot(page, app, vp, '6-sentinel')

  await page.click('#toStudio')
  await page.waitForSelector('section[data-s="grow"].on')
  await page.click('#runGeo')
  await page.waitForSelector('#toDashboard:not([disabled])', { timeout: 30000 })
  await shot(page, app, vp, '7-grow')

  await page.click('#toDashboard')
  await page.waitForSelector('section[data-s="dashboard"].on')
  await page.waitForSelector('#tiles .tile')
  reflow.dash_tiles = await tracks('#tiles')
  reflow.dash_ustats = await tracks('#ustats')
  reflow.dash_charts = await tracks('section[data-s="dashboard"] .dashcharts')
  await shot(page, app, vp, '8-dashboard')

  return reflow
}

async function captureApp(browser, url, app, vp) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  await context.addInitScript(SEED)
  const page = await context.newPage()
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(url, { waitUntil: 'load' })
  const reflow = await drive(page, app, vp)
  await context.close()
  if (errs.length) console.log(`  [${app} ${vp.name}] page errors:`, errs)
  return reflow
}

function diffStage(vp, stage) {
  const a = PNG.sync.read(fs.readFileSync(path.join(OUT, `baseline-${vp.name}-${stage}.png`)))
  const b = PNG.sync.read(fs.readFileSync(path.join(OUT, `react-${vp.name}-${stage}.png`)))
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height)
  const dimsMatch = a.width === b.width && a.height === b.height
  const diff = new PNG({ width: w, height: h })
  const crop = (src) => {
    if (src.width === w && src.height === h) return src.data
    const out = new PNG({ width: w, height: h }); PNG.bitblt(src, out, 0, 0, w, h, 0, 0); return out.data
  }
  const nDiff = pixelmatch(crop(a), crop(b), diff.data, w, h, { threshold: 0.1 })
  fs.writeFileSync(path.join(OUT, `diff-${vp.name}-${stage}.png`), PNG.sync.write(diff))
  return { stage, nDiff, pct: (nDiff / (w * h)) * 100, dimsMatch, dims: `${a.width}x${a.height}` }
}

async function main() {
  const [bSrv, rSrv] = await Promise.all([serve(REPO_ROOT, 5180), serve(REACT_DIST, 5181)])
  console.log('serving baseline :5180  react :5181')
  const browser = await chromium.launch()
  const reflow = {}
  try {
    for (const vp of VIEWPORTS) {
      console.log(`capturing @ ${vp.name} (${vp.w}x${vp.h})…`)
      reflow[vp.name] = {
        baseline: await captureApp(browser, 'http://localhost:5180/', 'baseline', vp),
        react: await captureApp(browser, 'http://localhost:5181/', 'react', vp),
      }
    }
  } finally {
    await browser.close(); bSrv.close(); rSrv.close()
  }

  const PASS = 0.20
  const results = {}
  let allPass = true
  console.log('\n=== RESPONSIVE VISUAL PARITY (threshold 0.20%) ===')
  for (const vp of VIEWPORTS) {
    const stages = STAGES.map(s => diffStage(vp, s))
    const rf = reflow[vp.name]
    const reflowMatch = JSON.stringify(rf.baseline) === JSON.stringify(rf.react)
    const worst = Math.max(...stages.map(s => s.pct))
    const vpPass = reflowMatch && stages.every(s => s.dimsMatch && s.pct <= PASS)
    if (!vpPass) allPass = false
    results[vp.name] = { w: vp.w, h: vp.h, reflow: { ...rf, match: reflowMatch }, stages, worst, pass: vpPass }
    console.log(`\n  ${vp.name.padStart(4)}px  ${vpPass ? 'PASS' : 'FAIL'}  worst=${worst.toFixed(4)}%  reflow=${reflowMatch ? 'match' : 'MISMATCH'}`)
    for (const s of stages) {
      const ok = s.dimsMatch && s.pct <= PASS
      console.log(`        ${ok ? 'ok  ' : 'FAIL'} ${s.stage.padEnd(12)} ${s.pct.toFixed(4)}%  (${s.nDiff}px)${s.dimsMatch ? '' : '  DIMS ' + s.dims}`)
    }
  }

  // Sanity: prove the breakpoints actually reflow (mobile single-col vs desktop multi-col).
  const m = reflow['375'].baseline, d = reflow['1440'].baseline
  console.log('\n=== REFLOW SANITY (baseline 375 vs 1440) ===')
  console.log(`  discover #opps cols : ${m.discover_opps} → ${d.discover_opps}`)
  console.log(`  profile .gp2 cols   : ${m.profile_gp2} → ${d.profile_gp2}`)
  console.log(`  dashboard #tiles    : ${m.dash_tiles} → ${d.dash_tiles}`)
  console.log(`  dashboard #ustats   : ${m.dash_ustats} → ${d.dash_ustats}`)
  console.log(`  blueprint #bpGrid   : ${m.blueprint_grid} → ${d.blueprint_grid}`)
  const reflowed = d.discover_opps > m.discover_opps && d.profile_gp2 > m.profile_gp2 && d.dash_tiles > m.dash_tiles
  console.log(`  layout genuinely reflows mobile→desktop: ${reflowed}`)

  fs.writeFileSync(path.join(OUT, 'parity-summary.json'),
    JSON.stringify({ pass: allPass, threshold: PASS, reflowsMobileToDesktop: reflowed, viewports: VIEWPORTS, results }, null, 2))
  console.log(`\nOVERALL: ${allPass && reflowed ? 'PASS' : 'FAIL'}  — summary → react/parity/parity-summary.json`)
  process.exit(allPass && reflowed ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(2) })
