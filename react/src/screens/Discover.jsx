// Stage 2 · Discover — DECLARATIVE (migrated from imperative island).
// React renders the .opp cards from state.opps (computed by the pure
// logic.computeOpps the engine ran on entry). The card BEHAVIOURS — selection
// wiring, fit% count-up, entry stagger, hover tilt — stay byte-identical by
// reusing the exact engine helpers in an entry effect. React renders the cards
// once per Discover entry; selection is imperative (no setState) so no re-render
// fights those DOM mutations. Markup/classes/IDs/attributes mirror the engine.
import { useEffect, useState } from 'react'
import { state } from '../lib/state.js'
import { $, $$ } from '../lib/dom.js'
import { countUp, enterCards, attachTilt } from '../lib/anim.js'
import { subscribeScreen } from '../lib/bridge.js'

export default function Discover() {
  const [opps, setOpps] = useState(null)
  useEffect(() => subscribeScreen('discover', () => setOpps(state.opps)), [])

  // Mirrors the tail of the engine's old computeOpps(), run after the cards mount.
  useEffect(() => {
    if (!opps) return
    $$('#opps .opp').forEach(el => el.onclick = () => {
      $$('#opps .opp').forEach(x => { x.classList.remove('sel'); x.classList.remove('gborder') })
      el.classList.add('sel'); el.classList.add('gborder')
      state.chosen = state.opps[+el.dataset.i]; $('#toBlueprint').disabled = false
    })
    $$('#opps .fit').forEach(el => countUp(el, +el.dataset.fit))
    enterCards(); attachTilt()
    $('#toBlueprint').disabled = !state.chosen
  }, [opps])

  return (
    <section className="screen" data-s="discover">
      <div className="eyebrow">Step 2 · Matched to your profile</div>
      <h1 className="scr">Opportunities found for you</h1>
      <p className="lead">Aurexis ranks and simulates options against your profile and live market signal. Pick the one to bring to reality — Forge takes it from here.</p>
      <div className="grid g3" id="opps">
        {opps && opps.map((o, i) => (
          <div className="opp" data-i={i} key={i}>
            <div className="fit" data-fit={o.fit}>0%</div>
            <h3>{o.t}</h3><div className="tag">{o.g}</div>
            <div className="meta"><div><b>{o.market}</b>market (est.)</div><div><b>{o.diff}</b>difficulty</div><div><b>~{o.ttr} mo</b>to revenue</div></div>
            <div className="breakdown">
              <div className="br"><span className="t">Profile fit</span><span className="bar"><i style={{ width: o.prof + '%' }}></i></span></div>
              <div className="br"><span className="t">Market signal</span><span className="bar"><i style={{ width: o.mkt + '%' }}></i></span></div>
              <div className="br"><span className="t">Build ease</span><span className="bar"><i style={{ width: o.feas + '%' }}></i></span></div>
            </div>
            <div className="blds"><b style={{ color: 'var(--muted)' }}>Forge will build:</b> {o.b.join(" · ")}</div>
            <div className="pick">Select to build →</div>
          </div>
        ))}
      </div>
      <div className="nav"><button className="btn ghost" data-back="profile">← Back</button><button className="btn primary adv" id="toBlueprint" disabled>Review the blueprint →</button></div>
    </section>
  )
}
