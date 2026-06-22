// Stage 3 · Blueprint. #bpName, #bpGrid, #bpFlow filled by the engine
// (initBlueprint). In the baseline DOM this section comes last; kept in order.
export default function Blueprint() {
  return (
    <section className="screen" data-s="blueprint">
      <div className="eyebrow">Step 3 · The plan</div>
      <h1 className="scr">The blueprint for <span id="bpName" className="serif" style={{ color: 'var(--champ)' }}></span></h1>
      <p className="lead">Before building, Aurexis — via the Architect — maps exactly what it will <b>create, secure, and grow</b>. Approve the plan, then watch it become real.</p>
      <div className="panel gborder bpwrap">
        <div className="bp-grid" id="bpGrid"></div>
        <div className="bp-flow" id="bpFlow"></div>
      </div>
      <div className="nav"><button className="btn ghost" data-back="discover">← Back</button><button className="btn primary adv" id="toForge">Build it with Forge →</button></div>
    </section>
  )
}
