// Behavioral parity: drives both apps to the dashboard, then exercises the
// interactive controls (price slider, growth pace, toggles), keyboard nav, the
// back buttons and the restart loop — asserting the two apps produce IDENTICAL
// resulting text/state. Complements the visual screenshot gate.
//
// Run:  npm run build && npx playwright install chromium && node parity/behavior-check.mjs
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'
import { fileURLToPath } from 'node:url'; import { chromium } from 'playwright'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }
function serve(root, port) { const s = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) }); return new Promise(x => s.listen(port, () => x(s))) }

async function run(url) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 2200 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  await ctx.addInitScript(`Math.random=function(){return 0.5}`)
  const p = await ctx.newPage()
  const log = []
  await p.goto(url, { waitUntil: 'load' })
  await p.waitForFunction(() => document.querySelector('#questions')?.children.length > 0)

  // Keyboard: Enter on intro starts the engine
  await p.keyboard.press('Enter')
  await p.waitForFunction(() => getComputedStyle(document.querySelector('#intro')).visibility === 'hidden')
  log.push(['intro→Enter starts', true])

  await p.click('#questions .opts[data-k="energy"] .opt[data-v="Building things"]')
  await p.click('#questions .opts[data-k="risk"] .opt[data-v="Bold"]')
  await p.click('#questions .opts[data-k="domain"] .opt[data-v="SaaS tools"]')
  await p.click('#questions .opts[data-k="style"] .opt[data-v="Fast & iterative"]')
  await p.click('#questions .opts[data-k="time"] .opt[data-v="Full-time"]')
  const profileLabel = await p.textContent('#profileLabel')
  log.push(['profile label', profileLabel])

  await p.locator('#followups .opts[data-fid="a"] .opt').first().click()
  await p.locator('#followups .opts[data-fid="b"] .opt').first().click()
  await p.locator('#followups .opts[data-fid="c"] .opt').first().click()

  // Keyboard: ArrowRight advances when the primary .adv button is enabled
  await p.waitForSelector('#toDiscover:not([disabled])')
  await p.keyboard.press('ArrowRight')
  await p.waitForSelector('section[data-s="discover"].on')
  const oppTitles = await p.$$eval('#opps .opp h3', els => els.map(e => e.textContent))
  const fits = await p.$$eval('#opps .opp .fit', els => els.map(e => e.textContent))
  log.push(['opp titles', oppTitles.join('|')])
  log.push(['opp fits', fits.join('|')])

  await p.click('#opps .opp[data-i="0"]')
  await p.click('#toBlueprint')
  await p.click('#toForge')
  await p.click('#runForge'); await p.waitForSelector('#toSentinel:not([disabled])', { timeout: 30000 })
  await p.click('#toSentinel')
  await p.click('#runSentinel'); await p.waitForSelector('#toStudio:not([disabled])', { timeout: 30000 })
  const secScore = await p.textContent('#secNum')
  log.push(['security score', secScore])
  await p.click('#toStudio')
  await p.click('#runGeo'); await p.waitForSelector('#toDashboard:not([disabled])', { timeout: 30000 })
  const recNum = await p.textContent('#recNum')
  log.push(['AI rec rate', recNum])
  await p.click('#toDashboard')
  await p.waitForSelector('#tiles .tile')

  // Dashboard interactivity: price slider
  const baseTiles = await p.textContent('#tiles')
  await p.$eval('#price', el => { el.value = 199; el.dispatchEvent(new Event('input')) })
  const priceV = await p.textContent('#priceV')
  const tiles199 = await p.textContent('#tiles')
  log.push(['price→199 label', priceV])
  log.push(['tiles change on price', baseTiles !== tiles199])

  // Growth pace → Aggressive
  await p.click('#paceSeg button[data-p="2.2"]')
  const scenarioAgg = await p.textContent('#scenarioLine')
  log.push(['scenario @ aggressive', scenarioAgg.replace(/\s+/g, ' ').trim()])

  // Toggle Evolver off → recompute
  await p.click('[data-tog="evolve"]')
  const ustatsAfter = await p.textContent('#ustats')
  log.push(['evolver-off quality', /Flat/.test(ustatsAfter)])

  // Keyboard back: ArrowLeft → previous screen (grow)
  await p.keyboard.press('ArrowLeft')
  await p.waitForSelector('section[data-s="grow"].on')
  log.push(['ArrowLeft → grow', true])

  // Restart loop: back to dashboard then restart
  await p.click('#toDashboard')
  await p.click('#restart')
  await p.waitForSelector('section[data-s="profile"].on')
  const afterRestartLabel = await p.textContent('#profileLabel')
  const toDiscoverDisabled = await p.$eval('#toDiscover', el => el.disabled)
  log.push(['restart → profile reset', afterRestartLabel])
  log.push(['restart disables advance', toDiscoverDisabled])

  await browser.close()
  return log
}

const [bs, rs] = await Promise.all([serve(path.resolve(__dirname, '../..'), 5192), serve(path.resolve(__dirname, '../dist'), 5193)])
const base = await run('http://localhost:5192/')
const react = await run('http://localhost:5193/')
bs.close(); rs.close()

console.log('=== BEHAVIORAL PARITY (baseline vs react) ===')
let pass = true
for (let i = 0; i < base.length; i++) {
  const [k, bv] = base[i]; const rv = react[i][1]
  const same = JSON.stringify(bv) === JSON.stringify(rv)
  if (!same) pass = false
  console.log(`${same ? 'OK  ' : 'DIFF'}  ${k.padEnd(26)}  base=${JSON.stringify(bv)}  react=${JSON.stringify(rv)}`)
}
console.log(`\nBEHAVIOR: ${pass ? 'PASS — identical' : 'FAIL — divergence above'}`)
process.exit(pass ? 0 : 1)
