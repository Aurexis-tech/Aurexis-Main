import { useEffect } from 'react'
import { boot } from './lib/engine.js'
import Intro from './screens/Intro.jsx'
import Profile from './screens/Profile.jsx'
import Discover from './screens/Discover.jsx'
import Forge from './screens/Forge.jsx'
import Sentinel from './screens/Sentinel.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Grow from './screens/Grow.jsx'
import Blueprint from './screens/Blueprint.jsx'

// App shell: renders the exact baseline body markup (canvas, intro, header,
// stepper rail, all stage screens, footer) and boots the ported imperative
// engine once after mount. Navigation, the stepper and all sequences are owned
// by the engine (the original go()/wiring), so React never re-renders the
// screens and never fights the imperative DOM. The screens are mounted in the
// SAME DOM order as the baseline (profile…blueprint last).
export default function App() {
  useEffect(() => { boot() }, [])

  return (
    <>
      <canvas id="bgcanvas"></canvas>

      <Intro />

      <div className="wrap">
        <div className="top">
          <div className="brand">
            <svg className="emblem" viewBox="0 0 42 42" fill="none">
              <circle cx="21" cy="21" r="19" stroke="rgba(231,185,77,.25)" strokeWidth="1" />
              <circle cx="21" cy="21" r="13" stroke="rgba(231,185,77,.5)" strokeWidth="1.2" />
              <circle cx="21" cy="21" r="7.5" stroke="rgba(76,208,179,.7)" strokeWidth="1.2" />
              <circle cx="21" cy="21" r="2.8" fill="#e7b94d" /><circle cx="40" cy="21" r="1.6" fill="#4cd0b3" />
            </svg>
            <div><div className="nm">Aurexis</div><div className="sb">Opportunity-to-Reality Engine</div></div>
          </div>
          <div className="legend"><span className="lg-c"><i></i>Forge · create</span><span className="lg-v"><i></i>Sentinel · verify</span><span className="lg-g"><i></i>Studio · grow</span></div>
        </div>

        <div className="rail"><div className="railinner"><div className="track"></div><div className="fill" id="railfill"></div><div className="nodes" id="nodes"></div></div></div>

        <Profile />
        <Discover />
        <Forge />
        <Sentinel />
        <Dashboard />
        <Grow />
        <Blueprint />

        <div className="kicker">High-level interactive prototype · Aurexis Opportunity-to-Reality Engine · figures are illustrative</div>
        <div className="kbd">Tip: use <b>←</b> / <b>→</b> to move between steps</div>
      </div>
    </>
  )
}
