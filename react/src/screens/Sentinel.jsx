// Stage 5 · Sentinel. #checks, #secArc, #secNum, #scanNote, #sentLog, #seal,
// #sealName owned by the engine (initSentinel / runSentinel). The dial arc's
// stroke-dashoffset is driven imperatively via setSec(); React renders the
// initial attributes + the transition/filter inline style only.
export default function Sentinel() {
  return (
    <section className="screen" data-s="sentinel">
      <div className="eyebrow">Step 4 · Sentinel · trust</div>
      <h1 className="scr">Sentinel oversees &amp; verifies</h1>
      <p className="lead">Sentinel runs <b>during</b> the build — confirming every step and keeping you updated — and <b>after</b>, hardening the product toward near hack-proof, then certifying it.</p>
      <div className="grid g2">
        <div className="panel" style={{ padding: '20px' }}><div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '13px', fontWeight: 600, letterSpacing: '.02em' }}>SECURITY AUDIT</div><div id="checks"></div></div>
        <div className="panel">
          <div className="dialwrap">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="13" />
              <circle id="secArc" cx="100" cy="100" r="84" fill="none" stroke="url(#sg)" strokeWidth="13" strokeLinecap="round" strokeDasharray="527.79" strokeDashoffset="527.79" style={{ transition: 'stroke-dashoffset .25s linear', filter: 'drop-shadow(0 0 8px rgba(76,208,179,.5))' }} />
              <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fe6d0" /><stop offset="1" stopColor="#2c9f8a" /></linearGradient></defs>
            </svg>
            <div className="dialcen"><div className="num" id="secNum">0</div><div className="lab">Security score · /100</div></div>
          </div>
          <div className="scan-note" id="scanNote">Awaiting scan…</div>
          <div className="term" style={{ marginTop: '14px' }}><div className="bar"><i></i><i></i><i></i><span>sentinel · oversight</span></div><div className="log" id="sentLog" style={{ height: '120px' }}></div></div>
          <div className="seal" id="seal">
            <svg className="ring" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="33" stroke="rgba(76,208,179,.25)" strokeWidth="1.4" />
              <circle cx="36" cy="36" r="26" stroke="rgba(76,208,179,.5)" strokeWidth="1.4" strokeDasharray="5 6" />
              <circle cx="36" cy="36" r="18" fill="rgba(76,208,179,.1)" stroke="var(--teal)" strokeWidth="2" />
              <path d="M28 36 l5 5 l11 -12" stroke="var(--teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="st">Sentinel Verified</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: '5px' }}><span id="sealName"></span> passed a 10-point audit.</div>
          </div>
        </div>
      </div>
      <div className="nav"><button className="btn ghost" data-back="forge">← Back</button>
        <span style={{ display: 'flex', gap: '10px' }}><button className="btn run" id="runSentinel">▸ Run Sentinel</button><button className="btn primary adv" id="toStudio" disabled>Take it to market →</button></span></div>
    </section>
  )
}
