// Stage 4 · Forge. #fName, #forgeFlow, #bldlist, #archSvg, #forgeLog, #forgeBar,
// #forgePct, #vsteps owned by the engine (initForge / runForge). The arch SVG
// and log fill imperatively; React only mounts the empty <svg>/containers.
export default function Forge() {
  return (
    <section className="screen" data-s="forge">
      <div className="eyebrow">Step 3 · Forge · create</div>
      <h1 className="scr">Forge builds <span id="fName" className="serif" style={{ color: 'var(--champ)' }}></span></h1>
      <p className="lead">Five products carry one run end to end — agents, software, automations, workflows, infrastructure — assembling a working system.</p>
      <div className="vline" id="fVer">◆ Forge V4 · create &amp; run</div>
      <div className="grid g2">
        <div>
          <div className="flow" id="forgeFlow"></div>
          <div className="bldlist" id="bldlist"></div>
        </div>
        <div>
          <div className="panel archcard"><h5>System being assembled</h5><svg id="archSvg" viewBox="0 0 320 210"></svg></div>
          <div className="term"><div className="bar"><i></i><i></i><i></i><span>forge · build.log — Sentinel watching</span></div><div className="log" id="forgeLog"></div></div>
          <div className="pbar"><span id="forgeBar"></span></div>
          <div className="pmeta"><span>discover → rank → design → build → operate</span><span id="forgePct">0%</span></div>
        </div>
      </div>
      <div className="panel ladder"><h5>Forge capability ladder</h5><div className="vsteps" id="vsteps"></div></div>
      <div className="nav"><button className="btn ghost" data-back="blueprint">← Back</button>
        <span style={{ display: 'flex', gap: '10px' }}><button className="btn run" id="runForge">▸ Run Forge</button><button className="btn primary adv" id="toSentinel" disabled>Verify with Sentinel →</button></span></div>
    </section>
  )
}
