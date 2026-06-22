// Stage 3 · Blueprint — DECLARATIVE (migrated from imperative island).
// React now owns #bpName / #bpGrid / #bpFlow; the engine no longer writes them.
// Navigation stays imperative: when the engine enters Blueprint it calls
// notifyScreen('blueprint'), which triggers this component to render the current
// shared `state` via the pure blueprintModel() helper. Markup, classes, IDs,
// strings and order mirror the previous engine output exactly.
import { useEffect, useState } from 'react'
import { state } from '../lib/state.js'
import { blueprintModel } from '../lib/logic.js'
import { subscribeScreen } from '../lib/bridge.js'

export default function Blueprint() {
  const [m, setM] = useState(null)
  useEffect(() => subscribeScreen('blueprint', () => setM(blueprintModel(state))), [])

  return (
    <section className="screen" data-s="blueprint">
      <div className="eyebrow">Step 3 · The plan</div>
      <h1 className="scr">The blueprint for <span id="bpName" className="serif" style={{ color: 'var(--champ)' }}>{m ? m.name : ''}</span></h1>
      <p className="lead">Before building, Aurexis — via the Architect — maps exactly what it will <b>create, secure, and grow</b>. Approve the plan, then watch it become real.</p>
      <div className="panel gborder bpwrap">
        <div className="bp-grid" id="bpGrid">
          {m && m.items.map((it, i) => (
            <div className="bp-item" key={i}><div className="k">{it[0]}</div><div className="val">{it[1]}</div><div className="vsub">{it[2]}</div></div>
          ))}
        </div>
        <div className="bp-flow" id="bpFlow">{m && (<>Next: <b>Forge</b> builds → <b>Sentinel</b> verifies → <b>you</b> control → <b>Studio</b> grows. Approve the plan to begin.</>)}</div>
      </div>
      <div className="nav"><button className="btn ghost" data-back="discover">← Back</button><button className="btn primary adv" id="toForge">Build it with Forge →</button></div>
    </section>
  )
}
