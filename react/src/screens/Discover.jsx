// Stage 2 · Discover. #opps is filled by the engine (computeOpps).
export default function Discover() {
  return (
    <section className="screen" data-s="discover">
      <div className="eyebrow">Step 2 · Matched to your profile</div>
      <h1 className="scr">Opportunities found for you</h1>
      <p className="lead">Aurexis ranks and simulates options against your profile and live market signal. Pick the one to bring to reality — Forge takes it from here.</p>
      <div className="grid g3" id="opps"></div>
      <div className="nav"><button className="btn ghost" data-back="profile">← Back</button><button className="btn primary adv" id="toBlueprint" disabled>Review the blueprint →</button></div>
    </section>
  )
}
