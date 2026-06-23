// Stage 3 · Forge — REAL client-orchestrated 5-stage pipeline runner (replaces the
// simulated animation). The browser drives the chain Scout → Architect → Creator →
// Operator → Evolver as SEPARATE sequential requests, threading each stage's real
// output into the next stage's input (exact endpoint shapes). One call per stage
// keeps each request short enough to survive serverless timeouts later.
//
// Honest scope: each stage is a real AI artifact for a human to review — a report
// to investigate, a design to evaluate, a runnable starter, an ops PLAN, a roadmap
// to run yourself. No autonomy claims. Nothing is deployed or self-operating.
import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import { state } from '../lib/state.js'
import { subscribeScreen } from '../lib/bridge.js'
import { postForge, BACKEND_CONFIGURED } from '../lib/api.js'

// On a deploy with no pipeline backend wired in (VITE_API_BASE unset), Forge is an
// honest interface PREVIEW: the stages are explorable but running is disabled — we
// never fire calls that would time out or spin forever, and never fake results.
const PREVIEW = !BACKEND_CONFIGURED

const STAGES = [
  { key: 'scout', n: 'Scout', d: 'Searches the live web for current market signals and ranks real opportunities to investigate.' },
  { key: 'architect', n: 'Architect', d: 'Designs a Reality Blueprint — business, product, system, growth and infrastructure models.' },
  { key: 'creator', n: 'Creator', d: 'Generates a small, runnable starter project for the core of the system.' },
  { key: 'operator', n: 'Operator', d: 'Drafts an operations PLAN to implement — monitoring, reliability, scaling and a runbook.' },
  { key: 'evolver', n: 'Evolver', d: 'Lays out an improvement ROADMAP you run yourself — an Observe→Deploy loop, experiments, guardrails.' },
]
const ORDER = { scout: 0, architect: 1, creator: 2, operator: 3, evolver: 4 }

// ── flow-state → Scout input ──
function ctx() {
  const a = state.answers || {}
  const domain = a.domain || (state.chosen && state.chosen.t) || 'a software product'
  const profile = { label: state.profileLabel || '', style: a.style || '', time: a.time || '' }
  return { a, domain, profile }
}

// ── file tree (Creator) ──
function buildTree(files) {
  const root = { children: {} }
  files.forEach((f, idx) => {
    const parts = String(f.path).split('/').filter(Boolean)
    let node = root
    parts.forEach((part, i) => {
      node.children = node.children || {}
      if (!node.children[part]) node.children[part] = (i === parts.length - 1) ? { fileIndex: idx } : { children: {} }
      node = node.children[part]
    })
  })
  return root
}
function Tree({ name, node, depth, selected, onSelect }) {
  if (node.fileIndex != null) {
    return (
      <div className={'ft-file' + (selected === node.fileIndex ? ' sel' : '')}
        style={{ paddingLeft: 10 + depth * 14 }} onClick={() => onSelect(node.fileIndex)}>{name}</div>
    )
  }
  const entries = Object.entries(node.children || {}).sort(([a, x], [b, y]) => {
    const ad = x.fileIndex == null, bd = y.fileIndex == null
    if (ad !== bd) return ad ? -1 : 1
    return a.localeCompare(b)
  })
  return (
    <>
      {name != null && <div className="ft-dir" style={{ paddingLeft: 10 + depth * 14 }}>{name}/</div>}
      {entries.map(([n, child]) => (
        <Tree key={n} name={n} node={child} depth={name != null ? depth + 1 : depth} selected={selected} onSelect={onSelect} />
      ))}
    </>
  )
}

const Disc = ({ text }) => <div className="fdisc">⚠ {text}</div>
const List = ({ items }) => <ul className="flist">{(items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>

// ── artifact renderers ──
function ScoutArtifact({ data, picked, onPick, onContinue, busy }) {
  return (
    <div className="fart">
      <div className="fopps">
        {data.opportunities.map((o, i) => (
          <div key={i} className={'fopp' + (picked === i ? ' sel' : '')} onClick={() => onPick(i)}>
            <div className="fopp-h">
              <span className="fopp-pick" aria-hidden="true">{picked === i ? '●' : '○'}</span>
              <b>{o.title}</b>
            </div>
            <div className="fopp-sum">{o.summary}</div>
            <div className="fopp-meta">
              <span>Market <b>{o.marketPotential.score}</b></span>
              <span>Timing <b>{o.timingScore}</b></span>
              <span className={'fcomp ' + o.competition.level}>Competition: {o.competition.level}</span>
            </div>
            <div className="fopp-entry"><b>Entry:</b> {o.entryStrategy}</div>
            {o.risks && o.risks.length > 0 && <div className="fopp-risks"><b>Risks:</b> {o.risks.join(' · ')}</div>}
          </div>
        ))}
      </div>
      {data.sources && data.sources.length > 0 && (
        <div className="fsources">
          <h6>Sources (live web search)</h6>
          {data.sources.map((s, i) => (
            <a key={i} className="fsrc" href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a>
          ))}
        </div>
      )}
      <Disc text={data.disclaimer} />
      <button className="btn primary" onClick={onContinue} disabled={picked == null || busy}>
        Design this opportunity →
      </button>
    </div>
  )
}

function ArchitectArtifact({ data }) {
  const M = ({ title, children }) => <div className="fmodel"><h6>{title}</h6>{children}</div>
  return (
    <div className="fart fmodels">
      <M title="Business"><div className="fkv">{data.businessModel.valueProposition}</div>
        <div className="fchips">{data.businessModel.customerSegments.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div>
        <div className="fsub"><b>Revenue:</b> {data.businessModel.revenueStreams.join(' · ')}</div>
        <div className="fsub"><b>Pricing:</b> {data.businessModel.pricingApproach}</div>
        <div className="fsub"><b>Unit economics:</b> {data.businessModel.unitEconomics}</div>
      </M>
      <M title="Product"><div className="fkv">{data.productModel.summary}</div>
        {data.productModel.coreFeatures.map((f, i) => <div className="fsub" key={i}><b>{f.name}:</b> {f.description}</div>)}
        <div className="fsub"><b>MVP:</b> {data.productModel.mvpScope}</div>
        <div className="fsub"><b>Differentiators:</b> {data.productModel.differentiators.join(' · ')}</div>
      </M>
      <M title="System"><div className="fkv">{data.systemModel.summary}</div>
        {data.systemModel.components.map((c, i) => <div className="fsub" key={i}><b>{c.name}:</b> {c.role}</div>)}
        <div className="fsub"><b>Data flow:</b> {data.systemModel.dataFlow}</div>
        <div className="fchips">{data.systemModel.integrations.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div>
      </M>
      <M title="Growth"><div className="fkv">{data.growthModel.summary}</div>
        <div className="fchips">{data.growthModel.channels.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div>
        <div className="fsub"><b>Loops:</b> {data.growthModel.loops.join(' · ')}</div>
        <div className="fsub"><b>North star:</b> {data.growthModel.northStarMetric}</div>
      </M>
      <M title="Infrastructure"><div className="fkv">{data.infrastructureModel.summary}</div>
        <div className="fchips">{data.infrastructureModel.stack.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div>
        <div className="fsub"><b>Hosting:</b> {data.infrastructureModel.hosting}</div>
        <div className="fsub"><b>Est. monthly cost:</b> {data.infrastructureModel.estimatedMonthlyCost}</div>
      </M>
      <M title="Key risks"><List items={data.keyRisks} /></M>
      <div className="fspan"><Disc text={data.disclaimer} /></div>
    </div>
  )
}

function CreatorArtifact({ data, sel, setSel, onDownload }) {
  const tree = buildTree(data.files)
  const selFile = data.files[sel] || data.files[0]
  return (
    <div className="fart">
      <div className="fcreate-top">
        <div><div className="fproj">{data.projectName}</div><div className="fsub">{data.summary}</div></div>
        <button className="btn primary" onClick={onDownload}>⤓ Download project (.zip)</button>
      </div>
      <div className="fchips">{data.stack.map((s, i) => <span className="chip" key={i}>{s}</span>)}</div>
      <div className="fruncmd"><b>Run it locally:</b><pre>{data.runInstructions}</pre></div>
      <div className="ffiles-grid">
        <div className="file-tree">
          <div className="ft-head">{data.files.length} files</div>
          <Tree name={null} node={tree} depth={0} selected={sel} onSelect={setSel} />
        </div>
        <div className="code-wrap">
          <div className="code-head"><span>{selFile ? selFile.path : ''}</span><span className="code-lang">{selFile ? selFile.language : ''}</span></div>
          <pre className="code-view"><code>{selFile ? selFile.contents : ''}</code></pre>
        </div>
      </div>
      <div className="freal-grid">
        <div className="freal"><h6>✓ Real in this starter</h6><List items={data.whatsRealVsStub.real} /></div>
        <div className="fstub"><h6>◌ Stubbed / mocked</h6><List items={data.whatsRealVsStub.stubbed} /></div>
      </div>
      {data.nextSteps && data.nextSteps.length > 0 && <div className="fnext"><h6>Next steps</h6><List items={data.nextSteps} /></div>}
      <Disc text={data.disclaimer} />
    </div>
  )
}

function OperatorArtifact({ data }) {
  return (
    <div className="fart">
      <div className="fsub fplan-sum">{data.summary}</div>
      <div className="fcols">
        <div className="fcol"><h6>Monitoring</h6>
          {data.monitoring.signals.map((s, i) => <div className="fsub" key={i}><b>{s.name}</b> <span className="ftool">[{s.tool}]</span> — {s.why}</div>)}
          <div className="fsub"><b>Dashboards:</b> {data.monitoring.dashboards.join(' · ')}</div>
        </div>
        <div className="fcol"><h6>Reliability</h6>
          <div className="fsub"><b>SLOs:</b></div><List items={data.reliability.slos} />
          <div className="fsub"><b>Alerting:</b></div><List items={data.reliability.alerting} />
          <div className="fsub"><b>Incident process:</b> {data.reliability.incidentProcess}</div>
        </div>
        <div className="fcol"><h6>Scaling</h6>
          <div className="fsub"><b>Triggers:</b></div><List items={data.scaling.triggers} />
          <div className="fsub"><b>Approach:</b> {data.scaling.approach}</div>
          <div className="fsub"><b>Cost controls:</b> {data.scaling.costControls.join(' · ')}</div>
        </div>
        <div className="fcol"><h6>Maintenance</h6>
          <div className="fsub"><b>Routines:</b></div><List items={data.maintenance.routines} />
          <div className="fsub"><b>Security hygiene:</b></div><List items={data.maintenance.securityHygiene} />
        </div>
      </div>
      <div className="frunbook"><h6>Runbook (a human follows)</h6><ol>{data.runbook.map((r, i) => <li key={i}>{r}</li>)}</ol></div>
      <Disc text={data.disclaimer} />
    </div>
  )
}

function EvolverArtifact({ data }) {
  const phases = ['observe', 'analyze', 'simulate', 'improve', 'deploy']
  return (
    <div className="fart">
      <div className="fsub fplan-sum">{data.summary}</div>
      <div className="fcycle">
        {phases.map((p) => (
          <div className="fcol" key={p}><h6>{p[0].toUpperCase() + p.slice(1)}</h6><List items={data.cycle[p]} /></div>
        ))}
      </div>
      <div className="fexps"><h6>Experiments to try</h6>
        {data.experiments.map((e, i) => (
          <div className="fexp" key={i}><div className="fexp-h"><b>{e.hypothesis}</b></div>
            <div className="fsub"><b>Metric:</b> {e.metric} <span className="feffort">· effort: {e.effort}</span></div></div>
        ))}
      </div>
      <div className="froadmap">
        <div className="fcol"><h6>30 days</h6><List items={data.roadmap.thirtyDay} /></div>
        <div className="fcol"><h6>90 days</h6><List items={data.roadmap.ninetyDay} /></div>
        <div className="fcol"><h6>1 year</h6><List items={data.roadmap.oneYear} /></div>
      </div>
      <div className="fguard"><h6>Guardrails — what NOT to break</h6><List items={data.guardrails} /></div>
      <Disc text={data.disclaimer} />
    </div>
  )
}

const ARTIFACT = { architect: ArchitectArtifact, operator: OperatorArtifact, evolver: EvolverArtifact }

export default function Forge() {
  const [results, setResults] = useState({})
  const [status, setStatus] = useState({})       // per-stage: running | done | failed
  const [errors, setErrors] = useState({})
  const [elapsed, setElapsed] = useState({})
  const [picked, setPicked] = useState(null)     // chosen Scout opportunity index
  const [sel, setSel] = useState(0)              // Creator file viewer index
  const [running, setRunning] = useState(null)   // currently-running stage key
  const [netFail, setNetFail] = useState(false)  // a call hit the backend & it was unreachable
  const [, force] = useState(0)
  const pickedRef = useRef(null)

  useEffect(() => subscribeScreen('forge', () => force((n) => n + 1)), [])

  // live elapsed ticker for the running stage
  useEffect(() => {
    if (!running) return
    const t0 = performance.now()
    const id = setInterval(() => setElapsed((e) => ({ ...e, [running]: (performance.now() - t0) / 1000 })), 250)
    return () => clearInterval(id)
  }, [running])

  async function callStage(stage, body) {
    setStatus((s) => ({ ...s, [stage]: 'running' }))
    setErrors((e) => ({ ...e, [stage]: '' }))
    setRunning(stage)
    const t0 = performance.now()
    try {
      const data = await postForge(stage, body)
      setResults((r) => ({ ...r, [stage]: data }))
      setStatus((s) => ({ ...s, [stage]: 'done' }))
      setElapsed((e) => ({ ...e, [stage]: (performance.now() - t0) / 1000 }))
      setRunning(null)
      return data
    } catch (err) {
      setStatus((s) => ({ ...s, [stage]: 'failed' }))
      setErrors((e) => ({ ...e, [stage]: err.message }))
      setElapsed((e) => ({ ...e, [stage]: (performance.now() - t0) / 1000 }))
      if (err && err.status === 0) setNetFail(true) // backend unreachable / timed out
      setRunning(null)
      throw err
    }
  }

  async function runScout() {
    const { domain, profile, a } = ctx()
    const body = { domain, profile, answers: a }
    if (state.chosen && state.chosen.g) body.focus = state.chosen.g
    try { await callStage('scout', body) } catch { /* shown per-stage */ }
  }

  // Run from `startStage` through Evolver, threading fresh outputs (falling back to
  // stored results for upstream). Used for the initial downstream run AND retries.
  async function runFrom(startStage) {
    const from = ORDER[startStage]
    const { domain, profile } = ctx()
    const scoutData = results.scout
    const idx = pickedRef.current
    const opp = scoutData && scoutData.opportunities[idx]
    if (!opp) return
    let arch = results.architect, crea = results.creator, oper = results.operator
    try {
      if (from <= ORDER.architect) arch = await callStage('architect', { opportunity: opp, domain, profile })
      if (from <= ORDER.creator) crea = await callStage('creator', { blueprint: arch, domain, profile })
      if (from <= ORDER.operator) {
        oper = await callStage('operator', {
          starter: { projectName: crea.projectName, summary: crea.summary, stack: crea.stack, whatsRealVsStub: crea.whatsRealVsStub },
          blueprint: { infrastructureModel: arch.infrastructureModel, systemModel: arch.systemModel, growthModel: arch.growthModel },
          domain,
        })
      }
      if (from <= ORDER.evolver) {
        await callStage('evolver', {
          starter: { projectName: crea.projectName, summary: crea.summary, whatsRealVsStub: crea.whatsRealVsStub },
          blueprint: { productModel: arch.productModel, growthModel: arch.growthModel, businessModel: arch.businessModel },
          opportunity: { title: opp.title, summary: opp.summary },
          operations: { summary: oper.summary },
          domain,
        })
      }
    } catch { /* failed stage shown with Retry; chain stops here */ }
  }

  function pick(i) { setPicked(i); pickedRef.current = i }
  function continueFromScout() { runFrom('architect') }

  function retry(stage) { if (stage === 'scout') runScout(); else runFrom(stage) }

  async function downloadZip() {
    const creator = results.creator
    if (!creator) return
    const zip = new JSZip()
    creator.files.forEach((f) => zip.file(f.path, f.contents))
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (creator.projectName || 'aurexis-starter').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() + '.zip'
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const { domain } = ctx()
  const started = !!status.scout
  const canAdvance = status.creator === 'done'
  const anyBusy = !!running

  function stageBody(stage) {
    const st = status[stage] || 'idle'
    const el = elapsed[stage]
    if (st === 'running') {
      return (
        <div className="fpending">
          <span className="fspin" aria-hidden="true" />
          <div>
            <div>{stage === 'scout' ? 'Searching the live web and ranking opportunities…' : 'Generating…'}</div>
            <div className="fmeta">{stage === 'scout' ? 'Scout can take ~90s. ' : ''}Elapsed {el ? el.toFixed(0) : '0'}s</div>
          </div>
        </div>
      )
    }
    if (st === 'failed') {
      return (
        <div className="fstage-err">
          <div className="ferr-msg">{errors[stage] || 'This stage failed.'}</div>
          <button className="btn run" onClick={() => retry(stage)} disabled={anyBusy}>↻ Retry {STAGES[ORDER[stage]].n}</button>
        </div>
      )
    }
    if (st === 'done') {
      const data = results[stage]
      if (stage === 'scout') return <ScoutArtifact data={data} picked={picked} onPick={pick} onContinue={continueFromScout} busy={anyBusy} />
      if (stage === 'creator') return <CreatorArtifact data={data} sel={sel} setSel={setSel} onDownload={downloadZip} />
      const A = ARTIFACT[stage]
      return <A data={data} />
    }
    // idle
    if (stage === 'scout') {
      if (PREVIEW) {
        return (
          <div className="fpending fidle">
            <button className="btn run" disabled>▸ Run the Forge pipeline</button>
            <div className="fmeta">Preview only on this deployment — the live pipeline backend isn't connected. (Set <code>VITE_API_BASE</code> to a running backend to execute.)</div>
          </div>
        )
      }
      return (
        <div className="fpending fidle">
          <button className="btn run" onClick={runScout}>▸ Run the Forge pipeline</button>
          <div className="fmeta">Starts with Scout (live web search, ~90s), then you pick an opportunity to design.</div>
        </div>
      )
    }
    const priorDone = status[STAGES[ORDER[stage] - 1].key] === 'done'
    return <div className="fmeta fidle-wait">{priorDone ? 'Ready — runs next.' : 'Waiting for the previous stage.'}</div>
  }

  return (
    <section className="screen" data-s="forge">
      <div className="eyebrow">Step 3 · Forge · create</div>
      <h1 className="scr">Forge {domain ? <>for <span className="serif" style={{ color: 'var(--champ)' }}>{domain}</span></> : 'a starter, stage by stage'}</h1>
      <p className="lead">Forge runs a real <b>five-stage pipeline</b> — each stage is a live AI call whose output feeds the next: discover opportunities, design a blueprint, generate a runnable starter, then plan operations and an improvement roadmap. Every artifact is for you to review — not a running business.</p>
      {(PREVIEW || netFail) && (
        <div className="fpreviewnote">
          <b>Preview of the interface.</b> Forge's live 5-stage pipeline runs on a dedicated backend that isn't connected to this deployment yet. You can explore every stage's layout below; actually running it requires that backend (wired via <code>VITE_API_BASE</code>). Nothing here is faked or simulated.
        </div>
      )}
      <div className="fcostnote">Running the full pipeline makes real AI calls (~<b>$0.50–0.65</b> — Scout's live web search dominates). It is one request per stage; Scout can take ~90&nbsp;seconds.</div>

      <div className="fpipe">
        {STAGES.map((s, i) => {
          const st = status[s.key] || 'idle'
          return (
            <div key={s.key} className={'fstage st-' + st}>
              <div className="fstage-head">
                <span className="fstage-num">{i + 1}</span>
                <div className="fstage-id"><div className="fstage-name">{s.n}</div><div className="fstage-desc">{s.d}</div></div>
                <span className={'fstatus ' + st}>{st === 'idle' ? 'idle' : st === 'running' ? 'running…' : st === 'done' ? `done ✓ ${elapsed[s.key] ? '· ' + elapsed[s.key].toFixed(0) + 's' : ''}` : 'failed'}</span>
              </div>
              <div className="fstage-body">{stageBody(s.key)}</div>
            </div>
          )
        })}
      </div>

      <div className="nav"><button className="btn ghost" data-back="blueprint">← Back</button>
        <button className="btn primary adv" id="toSentinel" disabled={!canAdvance}>Verify with Sentinel →</button></div>
      {started && !canAdvance && <div className="fmeta fadv-hint">Advance unlocks once Creator has produced a starter.</div>}
    </section>
  )
}
