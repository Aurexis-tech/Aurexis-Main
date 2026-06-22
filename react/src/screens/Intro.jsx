// Intro overlay. Markup identical to the baseline #intro block; the engine
// toggles .gone on #begin click. SVG attributes are camelCased for JSX; the
// rendered DOM is identical.
export default function Intro() {
  return (
    <div id="intro">
      <svg className="big-emblem" viewBox="0 0 120 120" fill="none">
        <g className="r">
          <circle cx="60" cy="60" r="54" stroke="rgba(231,185,77,.22)" strokeWidth="1" />
          <circle cx="60" cy="60" r="40" stroke="rgba(231,185,77,.45)" strokeWidth="1.2" strokeDasharray="3 6" />
          <circle cx="60" cy="60" r="26" stroke="rgba(76,208,179,.6)" strokeWidth="1.4" />
          <circle cx="114" cy="60" r="2.4" fill="#e7b94d" />
          <circle cx="60" cy="20" r="1.8" fill="#4cd0b3" />
        </g>
        <circle cx="60" cy="60" r="6" fill="#e7b94d" />
      </svg>
      <div className="kick">Aurexis · Opportunity-to-Reality Engine</div>
      <h1>Turn who you are into <em>what's real.</em></h1>
      <p>Aurexis reads your personality, finds the opportunity that fits you, builds it, secures it, hands you the controls, and takes it to market — one continuous engine.</p>
      <div className="flowline"><b>Profile → Opportunity → Forge → Sentinel → Dashboard → Studio</b></div>
      <button className="cta" id="begin">Begin the engine →</button>
      <div className="introchips"><span>Forge · create</span><span>Sentinel · verify</span><span>Studio · grow</span></div>
    </div>
  )
}
