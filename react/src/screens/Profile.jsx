// Stage 1 · Profile. #questions, #followups, #radarGrid, #radarLabels, #traitlist
// are left empty — the engine fills them imperatively (renderQuestions /
// buildRadarGrid / afterProfile). React only mounts the containers.
export default function Profile() {
  return (
    <section className="screen on" data-s="profile">
      <div className="eyebrow">Step 1 · It starts with you</div>
      <h1 className="scr">Aurexis reads who you are first</h1>
      <p className="lead">Before a single line is built, Aurexis profiles your <b>personality and decision-making style</b>, then finds opportunities matched to <b>you</b> — beginning in business, later expanding to finance, education, and beyond.</p>
      <div className="grid gp2">
        <div className="panel gborder"><div id="questions"></div><div id="followups"></div></div>
        <div className="panel">
          <div className="sig">
            <h4>Your profile signature</h4>
            <div className="pl" id="profileLabel">Answer to begin…</div>
            <div className="pd" id="profileDesc">Aurexis synthesises a live signature as you choose.</div>
            <div className="radarwrap">
              <svg viewBox="0 0 180 180" width="200" height="200" id="radar">
                <g id="radarGrid"></g>
                <polygon id="radarPoly" points="90,90 90,90 90,90 90,90 90,90" fill="rgba(231,185,77,.18)" stroke="#e7b94d" strokeWidth="1.6" />
                <g id="radarLabels"></g>
              </svg>
            </div>
            <div className="traitlist" id="traitlist"></div>
          </div>
        </div>
      </div>
      <div className="nav"><span></span><button className="btn primary adv" id="toDiscover" disabled>Find my opportunities →</button></div>
    </section>
  )
}
