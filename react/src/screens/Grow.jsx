// Stage 7 · Studio / Grow. #geo, #channels, #recNum, #gaugeArc, #askA1, #askA2,
// #askAfter, #finalSeal, #finalName owned by the engine (initGeo / runGeo).
export default function Grow() {
  return (
    <section className="screen" data-s="grow">
      <div className="eyebrow">Step 6 · Studio · grow (SEO / GEO agency)</div>
      <h1 className="scr">Studio makes AI recommend it</h1>
      <p className="lead">The product is real, verified, and yours. Now Studio expands its reach — five products that get it recommended by AI, not just ranked on Google.</p>
      <div className="grid g2">
        <div className="geo" id="geo"></div>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="gaugewrap">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14" />
              <circle id="gaugeArc" cx="100" cy="100" r="84" fill="none" stroke="url(#gg)" strokeWidth="14" strokeLinecap="round" strokeDasharray="527.79" strokeDashoffset="527.79" style={{ transition: 'stroke-dashoffset .1s linear', filter: 'drop-shadow(0 0 8px rgba(231,185,77,.5))' }} />
              <defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5ecd2" /><stop offset="1" stopColor="#e7b94d" /></linearGradient></defs>
            </svg>
            <div className="gaugecen"><div className="num" id="recNum">12%</div><div className="lab">AI recommendation rate</div></div>
          </div>
          <div className="channels" id="channels"></div>
        </div>
      </div>
      <div className="askwrap grid g2">
        <div className="askcard before"><div className="who">Before · what AI says</div><div className="bubble-q" id="askQ1">"Best tool for this?"</div><div className="bubble-a" id="askA1">It lists incumbents — you're not mentioned.</div></div>
        <div className="askcard after" id="askAfter"><div className="who">After Studio · what AI says</div><div className="bubble-q" id="askQ2">"Best tool for this?"</div><div className="bubble-a" id="askA2"></div></div>
      </div>
      <div className="finalseal" id="finalSeal"><div className="big">From your personality → a living, verified venture in market.</div>
        <div className="sub"><span id="finalName"></span> — discovered for you, built by Forge, secured by Sentinel, controlled by you, grown by Studio.</div></div>
      <div className="nav"><button className="btn ghost" data-back="sentinel">← Back</button>
        <span style={{ display: 'flex', gap: '10px' }}><button className="btn run" id="runGeo">▸ Run Studio (GEO)</button><button className="btn primary adv" id="toDashboard" disabled>Open my dashboard →</button></span></div>
    </section>
  )
}
