// Stage 6 · Dashboard. #dName, #dashRecap, #tiles, #scenarioLine, #revChart,
// #usersChart, #ustats, #priceV owned by the engine (initDash / renderDash).
// The price range is UNCONTROLLED (defaultValue) so the engine reads/writes
// .value freely — exactly like the baseline's plain DOM input.
export default function Dashboard() {
  return (
    <section className="screen" data-s="dashboard">
      <div className="eyebrow">Step 5 · Your control</div>
      <h1 className="scr">Your dashboard — your choices</h1>
      <p className="lead">A real control surface for <b id="dName"></b>. Steer the product on your own terms — Aurexis does the work, you stay in command.</p>
      <div className="recap" id="dashRecap"></div>
      <div className="panel gborder">
        <div className="tiles" id="tiles"></div>
        <div id="scenarioLine" className="scenario"></div>
        <div className="grid g2 dashcharts">
          <div className="panel chartcard"><div className="cc-head"><h5>Projected revenue · 12 months</h5><span className="cc-end" id="revEnd"></span></div><svg id="revChart" viewBox="0 0 600 140" preserveAspectRatio="none"></svg></div>
          <div className="panel chartcard"><div className="cc-head"><h5>Active users · 12 months</h5><span className="cc-end" id="usrEnd"></span></div><svg id="usersChart" viewBox="0 0 600 140" preserveAspectRatio="none"></svg></div>
        </div>
        <div className="panel ustatsWrap"><div className="ust-h">Unit economics · live</div><div className="ustats" id="ustats"></div></div>
        <div className="ctrl">
          <div className="row"><div><div className="lbl">Price per month</div><div className="sub">Drag to model revenue</div></div>
            <input type="range" id="price" min="9" max="199" defaultValue="49" step="10" />
            <div className="serif" style={{ color: 'var(--champ)', fontWeight: 700, minWidth: '62px', textAlign: 'right' }} id="priceV">$49</div></div>
          <div className="row"><div><div className="lbl">Growth pace</div><div className="sub">Operator scales infra to match</div></div>
            <div className="seg" id="paceSeg"><button data-p="1">Calm</button><button data-p="1.5" className="on">Steady</button><button data-p="2.2">Aggressive</button></div></div>
          <div className="row"><div><div className="lbl">Evolver — auto-improve</div><div className="sub">Daily observe→improve→deploy</div></div><div className="toggle on" data-tog="evolve"></div></div>
          <div className="row"><div><div className="lbl">Operator — auto-scale</div><div className="sub">Reliability &amp; uptime</div></div><div className="toggle on" data-tog="scale"></div></div>
        </div>
        <div className="muted-note">Everything recalculates live from your settings — your business, your call.</div>
      </div>
      <div className="nav"><button className="btn ghost" data-back="grow">← Back</button><button className="btn primary" id="restart">↺ Run the loop again</button></div>
    </section>
  )
}
