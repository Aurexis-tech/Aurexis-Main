// Visual-parity gate: drives the SAME guided flow through the static baseline
// (served from the repo root) and the React port (served from react/dist), then
// pixel-diffs each of the 8 stages. Determinism: prefers-reduced-motion is
// emulated (disables animations/timing) and Math.random is stubbed to a constant
// before any app code runs, so both apps render identical, settled states.
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

const STAGES = ['1-intro', '2-profile', '3-discover', '4-blueprint', '5-forge', '6-sentinel', '7-grow', '8-dashboard']

async function shot(page, app, name) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
  // Viewport screenshot at a fixed TALL viewport (set in captureApp). fullPage is
  // avoided on purpose: it resizes the viewport mid-capture, which re-rasterizes
  // the backdrop-filter panels + fixed canvas and injects nondeterministic noise.
  await page.screenshot({ path: path.join(OUT, `${app}-${name}.png`) })
}

// Drives the full flow with the exact same deterministic inputs for both apps.
async function drive(page, app) {
  await page.waitForSelector('#bgcanvas')
  await page.waitForFunction(() => {
    const q = document.querySelector('#questions')
    return q && q.children.length > 0
  })
  await page.evaluate(() => document.fonts && document.fonts.ready)
  await shot(page, app, '1-intro')

  // Intro → Profile
  await page.click('#begin')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('#intro')).visibility === 'hidden')

  // Answer the 5 profile questions (fixed choices)
  await page.click('#questions .opts[data-k="energy"] .opt[data-v="Building things"]')
  await page.click('#questions .opts[data-k="risk"] .opt[data-v="Bold"]')
  await page.click('#questions .opts[data-k="domain"] .opt[data-v="SaaS tools"]')
  await page.click('#questions .opts[data-k="style"] .opt[data-v="Fast & iterative"]')
  await page.click('#questions .opts[data-k="time"] .opt[data-v="Full-time"]')

  // Three self-generated follow-ups (RM → rendered immediately); pick first each
  await page.waitForSelector('#followups .opts[data-fid="a"] .opt')
  await page.locator('#followups .opts[data-fid="a"] .opt').first().click()
  await page.locator('#followups .opts[data-fid="b"] .opt').first().click()
  await page.locator('#followups .opts[data-fid="c"] .opt').first().click()
  await page.waitForSelector('#toDiscover:not([disabled])')
  await shot(page, app, '2-profile')

  // Discover
  await page.click('#toDiscover')
  await page.waitForSelector('section[data-s="discover"].on')
  await page.waitForSelector('#opps .opp')
  await shot(page, app, '3-discover')

  // Select first opportunity → Blueprint
  await page.click('#opps .opp[data-i="0"]')
  await page.waitForSelector('#toBlueprint:not([disabled])')
  await page.click('#toBlueprint')
  await page.waitForSelector('section[data-s="blueprint"].on')
  await shot(page, app, '4-blueprint')

  // Forge → run to completion (toSentinel enables when done)
  await page.click('#toForge')
  await page.waitForSelector('section[data-s="forge"].on')
  await page.click('#runForge')
  await page.waitForSelector('#toSentinel:not([disabled])', { timeout: 30000 })
  await shot(page, app, '5-forge')

  // Sentinel → run to completion
  await page.click('#toSentinel')
  await page.waitForSelector('section[data-s="sentinel"].on')
  await page.click('#runSentinel')
  await page.waitForSelector('#toStudio:not([disabled])', { timeout: 30000 })
  await shot(page, app, '6-sentinel')

  // Studio / Grow → run to completion
  await page.click('#toStudio')
  await page.waitForSelector('section[data-s="grow"].on')
  await page.click('#runGeo')
  await page.waitForSelector('#toDashboard:not([disabled])', { timeout: 30000 })
  await shot(page, app, '7-grow')

  // Dashboard
  await page.click('#toDashboard')
  await page.waitForSelector('section[data-s="dashboard"].on')
  await page.waitForSelector('#tiles .tile')
  await shot(page, app, '8-dashboard')
}

async function captureApp(browser, url, app) {
  const context = await browser.newContext({
    // 1440 wide (desktop breakpoints) × tall enough to capture every stage in one
    // fixed viewport shot — no fullPage resize, so the canvas/backdrop-filter
    // render deterministically and identically for both apps.
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  await context.addInitScript(SEED)
  const page = await context.newPage()
  const errs = []
  page.on('pageerror', e => errs.push(String(e)))
  await page.goto(url, { waitUntil: 'load' })
  await drive(page, app)
  await context.close()
  if (errs.length) console.log(`  [${app}] page errors:`, errs)
  return errs
}

function diffStage(name) {
  const a = PNG.sync.read(fs.readFileSync(path.join(OUT, `baseline-${name}.png`)))
  const b = PNG.sync.read(fs.readFileSync(path.join(OUT, `react-${name}.png`)))
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height)
  const dimsMatch = a.width === b.width && a.height === b.height
  const diff = new PNG({ width: w, height: h })
  // pixelmatch needs equal-sized buffers; crop both to the common region.
  const crop = (src) => {
    if (src.width === w && src.height === h) return src.data
    const out = new PNG({ width: w, height: h })
    PNG.bitblt(src, out, 0, 0, w, h, 0, 0)
    return out.data
  }
  const nDiff = pixelmatch(crop(a), crop(b), diff.data, w, h, { threshold: 0.1 })
  fs.writeFileSync(path.join(OUT, `diff-${name}.png`), PNG.sync.write(diff))
  return { name, w, h, dimsMatch, baselineDims: `${a.width}x${a.height}`, reactDims: `${b.width}x${b.height}`,
    nDiff, pct: (nDiff / (w * h)) * 100 }
}

async function main() {
  const [bSrv, rSrv] = await Promise.all([serve(REPO_ROOT, 5180), serve(REACT_DIST, 5181)])
  console.log('serving baseline :5180  react :5181')
  const browser = await chromium.launch()
  try {
    console.log('driving baseline…'); await captureApp(browser, 'http://localhost:5180/', 'baseline')
    console.log('driving react…');    await captureApp(browser, 'http://localhost:5181/', 'react')
  } finally {
    await browser.close()
    bSrv.close(); rSrv.close()
  }

  console.log('\n=== VISUAL PARITY (threshold 0.20%) ===')
  const PASS = 0.20
  const rows = STAGES.map(diffStage)
  let allPass = true
  for (const r of rows) {
    const ok = r.dimsMatch && r.pct <= PASS
    if (!ok) allPass = false
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(12)}  diff=${r.pct.toFixed(4)}%  (${r.nDiff}px)  dims ${r.dimsMatch ? r.baselineDims : r.baselineDims + ' vs ' + r.reactDims}`)
  }
  fs.writeFileSync(path.join(OUT, 'parity-summary.json'), JSON.stringify({ pass: allPass, threshold: PASS, stages: rows }, null, 2))
  console.log(`\nOVERALL: ${allPass ? 'PASS' : 'FAIL'}  — summary → react/parity/parity-summary.json`)
  process.exit(allPass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(2) })
