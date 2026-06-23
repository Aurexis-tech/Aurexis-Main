// The imperative engine — ported as-is from the baseline app.js. Every render,
// animation, canvas and async sequence is the original logic, untouched. Only
// shared data / pure functions / dom helpers are now imports, and the wiring at
// the bottom is exported as boot() (called once from App's mount effect). React
// renders the markup + empty containers; this code owns all the dynamic DOM.
import { RM, $, $$, wait, GC } from './dom.js'
import { STEPS, state } from './state.js'
import { QS, NOUN, TRAITS, FOCUS_ADJ, CHECKS, OVERSIGHT, GEO, CHN } from './data.js'
import { traitScores, radarPoint, pickFollowups, fmtUSD, sparkPts, model, computeOpps } from './logic.js'
import { notifyScreen } from './bridge.js'

/* ===== background constellation ===== */
function initBg(){
  const cv=$("#bgcanvas"), ctx=cv.getContext("2d"); let pts=[], w=0, h=0, dpr=Math.min(2,window.devicePixelRatio||1), raf;
  function resize(){ w=cv.clientWidth; h=cv.clientHeight; cv.width=w*dpr; cv.height=h*dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.min(80,Math.round(w*h/16000)); pts=[]; for(let i=0;i<n;i++) pts.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:Math.random()*1.6+.5}); }
  function frame(){ ctx.clearRect(0,0,w,h);
    for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>w)p.vx*=-1; if(p.y<0||p.y>h)p.vy*=-1; }
    for(let i=0;i<pts.length;i++){ for(let j=i+1;j<pts.length;j++){ const a=pts[i],b=pts[j],dx=a.x-b.x,dy=a.y-b.y,d=dx*dx+dy*dy;
      if(d<13000){ const o=(1-d/13000)*.16; ctx.strokeStyle="rgba(231,185,77,"+o+")"; ctx.lineWidth=.6; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
    for(const p of pts){ ctx.fillStyle="rgba(245,236,210,.5)"; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); }
    raf=requestAnimationFrame(frame); }
  resize(); window.addEventListener("resize",()=>{cancelAnimationFrame(raf);resize();if(!RM)frame();else staticFrame();});
  function staticFrame(){ frame(); cancelAnimationFrame(raf); }
  if(RM){ frame(); cancelAnimationFrame(raf); } else frame();
}

/* ===== ultimate polish helpers ===== */
let _radarRAF=0,_typeTok=0;
function animateRadar(tv){
  const poly=document.querySelector("#radarPoly"); if(!poly) return;
  if(!state.radarVals) state.radarVals=[0,0,0,0,0];
  const from=state.radarVals.slice();
  if(RM){ state.radarVals=tv.slice(); poly.setAttribute("points",tv.map((v,i)=>radarPoint(i,v).join(",")).join(" ")); return; }
  cancelAnimationFrame(_radarRAF); const t0=performance.now(),dur=420;
  (function f(t){ const p=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-p,3);
    const cur=tv.map((v,i)=>from[i]+(v-from[i])*e);
    poly.setAttribute("points",cur.map((v,i)=>radarPoint(i,v).join(",")).join(" "));
    if(p<1){ _radarRAF=requestAnimationFrame(f);} else state.radarVals=tv.slice(); })(t0);
}
function typeText(el,txt,onDone){
  if(!el) return; const tok=++_typeTok;
  if(RM){ el.textContent=txt; if(onDone) onDone(); return; }
  el.textContent=""; let i=0;
  (function step(){ if(tok!==_typeTok) return; el.textContent=txt.slice(0,i++);
    if(i<=txt.length){ setTimeout(step,16);} else if(onDone) onDone(); })();
}
function fireBurst(){ if(RM) return; const cv=document.createElement("canvas");
  cv.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:35"; document.body.appendChild(cv);
  const ctx=cv.getContext("2d"),dpr=Math.min(2,window.devicePixelRatio||1); cv.width=window.innerWidth*dpr; cv.height=window.innerHeight*dpr; ctx.scale(dpr,dpr);
  const cx=window.innerWidth/2,cy=window.innerHeight*0.42,cols=["#e7b94d","#f6d27e","#4cd0b3","#f5ecd2"],ps=[];
  for(let i=0;i<120;i++){ const a=Math.random()*6.283,sp=2+Math.random()*7.5; ps.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2,r:2+Math.random()*3,c:cols[i%cols.length],life:1}); }
  const t0=performance.now(); (function f(){ ctx.clearRect(0,0,cv.width,cv.height); let alive=false;
    ps.forEach(p=>{ p.vy+=0.12; p.x+=p.vx; p.y+=p.vy; p.life-=0.012; if(p.life>0){ alive=true;
      ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.c; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283); ctx.fill(); } });
    if(alive && performance.now()-t0<2200){ requestAnimationFrame(f);} else cv.remove(); })();
}
function showFollow(a){
  if(!state.followShown && !RM){ state.followShown=true; const w=document.querySelector("#followups"); w.style.display="block";
    w.innerHTML='<div class="follow-divider"></div><div class="follow-analysing">Aurexis is reading your answers<span class="dots"></span></div>';
    setTimeout(()=>renderFollow(a),900);
  } else { state.followShown=true; renderFollow(a); } }

/* ===== steps / nav ===== */
const idx=id=>STEPS.findIndex(s=>s[0]===id);
function renderStepper(){
  const cur=idx(state.screen);
  $("#nodes").innerHTML=STEPS.map((s,i)=>{const id=s[0],done=i<cur,active=i===cur,clk=state.reached[id];
    return `<div class="node ${active?'active':''} ${done?'done':''} ${clk?'clk':''}" data-go="${id}"><div class="bubble">${done?'✓':i+1}</div><div class="lab">${s[1]}</div></div>`;}).join("");
  $("#railfill").style.width=(90*cur/(STEPS.length-1))+"%";
  $$('#nodes .node.clk').forEach(el=>el.onclick=()=>go(el.dataset.go));
}
function go(id){ state.screen=id; state.reached[id]=true;
  $$(".screen").forEach(s=>s.classList.toggle("on",s.dataset.s===id));
  renderStepper(); window.scrollTo({top:0,behavior:RM?'auto':'smooth'}); }

/* ===== 1 profile + radar ===== */
function renderFollow(a){
  const set=pickFollowups(a);
  set.forEach(q=>{ if(state.follow[q.id] && !q.opts.some(o=>o.f===state.follow[q.id])) delete state.follow[q.id]; });
  state.followQs=set;
  const header='<div class="follow-head"><span>Aurexis read your five answers. As a <b>'+state.profileLabel+'</b> drawn to <b>'+a.domain+'</b>, here are three sharper questions — generated for you:</span></div>';
  const blocks=set.map(q=>'<div class="q"><h4>'+q.q+'</h4><div class="opts" data-fid="'+q.id+'">'+q.opts.map(o=>'<div class="opt '+(state.follow[q.id]===o.f?'sel':'')+'" data-focus="'+o.f+'">'+o.l+'</div>').join("")+'</div></div>').join("");
  $("#followups").innerHTML='<div class="follow-divider"></div>'+header+blocks+'<div class="follow-insight" id="followInsight"></div>';
  $("#followups").style.display="block";
  $$('#followups .opt').forEach(el=>el.onclick=()=>{
    el.parentElement.querySelectorAll(".opt").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel"); state.follow[el.parentElement.dataset.fid]=el.dataset.focus; refreshAdvance();
  });
  refreshAdvance();
}
function hideFollow(){ state.follow={}; state.followQs=[]; state.followShown=false; const w=$("#followups"); if(w){ w.style.display="none"; w.innerHTML=""; } }
function refreshAdvance(){
  const set=state.followQs||[]; const done=set.length>0 && set.every(q=>state.follow[q.id]);
  $("#toDiscover").disabled=!done;
  if(done){ const fs=Object.values(state.follow); const adj=fs.map(f=>FOCUS_ADJ[f]||f).filter((x,i,arr)=>arr.indexOf(x)===i).slice(0,3);
    const el=$("#followInsight"); if(el) el.innerHTML='<b>Aurexis reads you as '+adj.join(", ")+'.</b> Tuning your opportunities to match.';
    state.focuses=fs; }
}
function renderQuestions(){
  $("#questions").innerHTML=QS.map(q=>`<div class="q"><h4>${q.q} <span>${q.sub}</span></h4>
    <div class="opts" data-k="${q.k}">${q.o.map(o=>`<div class="opt" data-v="${o}">${o}</div>`).join("")}</div></div>`).join("");
  $$('#questions .opt').forEach(el=>el.onclick=()=>{el.parentElement.querySelectorAll(".opt").forEach(x=>x.classList.remove("sel"));
    el.classList.add("sel"); state.answers[el.parentElement.dataset.k]=el.dataset.v; afterProfile();});
  buildRadarGrid();
}
function buildRadarGrid(){
  let g=""; [0.33,0.66,1].forEach(rr=>{ let pts=TRAITS.map((_,i)=>radarPoint(i,rr).join(",")).join(" ");
    g+=`<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`; });
  TRAITS.forEach((_,i)=>{const p=radarPoint(i,1); g+=`<line x1="90" y1="90" x2="${p[0]}" y2="${p[1]}" stroke="rgba(255,255,255,.07)"/>`;});
  $("#radarGrid").innerHTML=g;
  $("#radarLabels").innerHTML=TRAITS.map((t,i)=>{const p=radarPoint(i,1.16);return `<text x="${p[0]}" y="${p[1]}" fill="#5e7088" font-size="8" font-family="Hanken Grotesk,Arial" text-anchor="middle" dominant-baseline="middle">${t}</text>`;}).join("");
}
function afterProfile(){
  const a=state.answers;
  const t=traitScores(a);
  animateRadar(TRAITS.map(tr=>t[tr]));
  const top=Object.keys(t).sort((x,y)=>t[y]-t[x]).slice(0,2);
  $("#traitlist").innerHTML=TRAITS.map(tr=>`<span>${tr} <b>${Math.round(t[tr]*100)}</b></span>`).join("");
  if(Object.keys(a).length<5){ hideFollow(); $("#toDiscover").disabled=true; return; }
  state.profileLabel=`${a.risk} ${NOUN[a.energy]}`;
  $("#profileLabel").textContent=state.profileLabel;
  $("#profileDesc").textContent=`${a.style} · ${a.domain} · ${a.time}. Strengths: ${top.join(" & ")}.`;
  showFollow(a);
}

/* ===== 2 opportunities ===== */
/* Discover is now a declarative React component (screens/Discover.jsx). The pure
   scoring lives in logic.computeOpps(state); the engine only computes state.opps
   then signals entry via notifyScreen("discover") in the wiring below. The card
   markup, selection wiring, count-up, entry stagger and tilt are owned by the
   component (reusing lib/anim.js verbatim). The engine no longer writes #opps. */

/* ===== 3 forge ===== */
/* Forge is now a declarative React component (screens/Forge.jsx): a REAL
   client-orchestrated 5-stage pipeline (Scout→Architect→Creator→Operator→Evolver),
   one /api/forge/* call per stage threaded into the next. The engine no longer
   simulates the build — it only sets the downstream screen names from the chosen
   opportunity and signals entry via notifyScreen("forge") in the wiring below.
   `addLog` is kept here because Sentinel's runSentinel() still uses it. */
function addLog(log,L){const d=document.createElement("div");d.className="l";
  d.innerHTML=`<span class="${L[0]}">${L[1]}</span> <span style="color:var(--dim)">›</span> ${L[2]}`; log.appendChild(d); log.scrollTop=log.scrollHeight;}

/* ===== 4 sentinel ===== */
function setSec(p){ $("#secArc").style.strokeDashoffset=GC*(1-p/100); $("#secNum").textContent=Math.round(p*0.98); }
function initSentinel(){
  $("#checks").innerHTML=CHECKS.map(c=>`<div class="check"><div class="box">✓</div><div><div class="cn">${c[0]}</div><div class="cd">${c[1]}</div></div></div>`).join("");
  $("#sentLog").innerHTML=""; $("#seal").classList.remove("show"); setSec(0); $("#scanNote").textContent="Awaiting scan…"; $("#toStudio").disabled=true; $("#runSentinel").disabled=false;
}
async function runSentinel(){
  $("#runSentinel").disabled=true; $("#scanNote").textContent="Scanning for vulnerabilities…";
  const log=$("#sentLog"); for(const L of OVERSIGHT){ addLog(log,L); await wait(330); }
  const checks=$$('#checks .check'); const per=100/checks.length;
  for(let i=0;i<checks.length;i++){ checks[i].classList.add("ok"); setSec(per*(i+1)); await wait(260); }
  $("#scanNote").textContent="Hardened · near hack-proof"; await wait(150); $("#seal").classList.add("show"); $("#toStudio").disabled=false;
}

/* ===== 5 dashboard ===== */
function initDash(){
  const o=state.chosen;
  $("#dashRecap").innerHTML=`<span><b>✓ ${o.t} is live.</b> Built by Forge · secured by Sentinel (98/100) · recommended by AI across 6 channels — now yours to run.</span>`;
  renderDash(); $("#price").oninput=renderDash;
  $$('[data-tog]').forEach(t=>t.onclick=()=>{t.classList.toggle("on");renderDash();});
  $$('#paceSeg button').forEach(b=>b.onclick=()=>{$$('#paceSeg button').forEach(x=>x.classList.remove("on"));b.classList.add("on");state.pace=+b.dataset.p;renderDash();});
}
function renderDash(){
  const m=model(); state.mrr=m.mrr;
  $("#priceV").textContent="$"+m.price;
  const gp=m.g*100, dir=gp>=0?"up":"down", arr=gp>=0?"▲":"▼";
  const chip=`<span class="delta ${dir}">${arr} ${Math.abs(gp).toFixed(1)}%</span>`;
  const rc=m.ratio>=3?"c-teal":(m.ratio>=1.5?"c-amber":"c-rose");
  const rw=m.ratio>=3?"Healthy":(m.ratio>=1.5?"Watch":"At risk");
  const hero=[
    {v:Math.round(m.users).toLocaleString(),k:"Active users",d:chip,sl:m.p,spark:1},
    {v:fmtUSD(m.mrr),k:"Projected MRR",d:chip,sl:m.p,spark:1},
    {v:fmtUSD(m.arr),k:"ARR run-rate",d:chip,sl:m.p,spark:1},
    {v:m.ratio.toFixed(1)+":1",k:"LTV : CAC",vc:rc,sub:`<div class="sub2 ${rc}">${rw}</div>`}
  ];
  $("#tiles").innerHTML=hero.map(t=>`<div class="tile big">
    <div class="top"><div class="v ${t.vc||''}">${t.v}</div>${t.d||''}</div>
    <div class="k">${t.k}</div>${t.sub||''}
    ${t.spark?`<svg class="spark" viewBox="0 0 42 18"><polyline points="${sparkPts(t.sl)}" fill="none" stroke="#e7b94d" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`:''}
  </div>`).join("");
  const us=[
    [ "$"+m.price, "ARPU / month" ],
    [ Math.round(m.margin*100)+"%", "Gross margin" ],
    [ m.churn.toFixed(1)+"%", "Monthly churn" ],
    [ "$"+m.cac.toLocaleString(), "CAC" ],
    [ fmtUSD(m.ltv), "Lifetime value" ],
    [ m.payback.toFixed(1)+" mo", "CAC payback" ],
    [ m.uptime, "Uptime · Operator" ],
    [ m.quality, "Quality · Evolver" ]
  ];
  $("#ustats").innerHTML=us.map(s=>`<div class="ustat"><div class="uv">${s[0]}</div><div class="uk">${s[1]}</div></div>`).join("");
  const paceW={1:"Calm",1.5:"Steady",2.2:"Aggressive"}[m.p]||"Steady";
  $("#scenarioLine").innerHTML=`At <b>$${m.price}/mo</b> on a <b>${paceW}</b> pace, <b>${state.chosen.t}</b> runs at <b class="${rc}">${fmtUSD(m.arr)} ARR</b> with a <b class="${rc}">${m.ratio.toFixed(1)}:1</b> LTV : CAC — <b>${Math.round(m.margin*100)}%</b> gross margin, <b>${m.churn.toFixed(1)}%</b> monthly churn, <b>${m.payback.toFixed(1)}-mo</b> payback.`;
  drawRev(m.mrr,m.p);
  drawUsers(m.users,m.g);
}
function paintArea(sel,gid,vals,rgba){
  const W=600,H=140,pad=8,N=vals.length, max=Math.max.apply(null,vals)*1.1, min=0;
  const x=i=>pad+i*(W-2*pad)/(N-1), y=v=>H-pad-(v-min)/(max-min||1)*(H-2*pad);
  let line="M"+x(0)+","+y(vals[0]); for(let i=1;i<N;i++){const xc=(x(i-1)+x(i))/2; line+=` Q ${xc},${y(vals[i-1])} ${x(i)},${y(vals[i])}`;}
  const area=line+` L ${x(N-1)},${H-pad} L ${x(0)},${H-pad} Z`;
  $(sel).innerHTML=`<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(${rgba},.32)"/><stop offset="1" stop-color="rgba(${rgba},0)"/></linearGradient></defs>
    <path d="${area}" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="rgb(${rgba})" stroke-width="2" style="filter:drop-shadow(0 0 6px rgba(${rgba},.5))"/>`;
}
function drawRev(m0,pace){
  const N=12,vals=[]; for(let i=0;i<N;i++) vals.push(m0*Math.pow(1+0.06*pace,i)*(0.42+i*0.06));
  paintArea("#revChart","ra",vals,"231,185,77");
  if($("#revEnd")) $("#revEnd").textContent=fmtUSD(vals[N-1])+"/mo";
}
function drawUsers(u0,g){
  const N=12,vals=[]; let u=u0*0.62; const r=Math.max(0.012,g);
  for(let i=0;i<N;i++){ vals.push(u); u*=1+r; }
  paintArea("#usersChart","ua",vals,"76,208,179");
  if($("#usrEnd")) $("#usrEnd").textContent=Math.round(vals[N-1]).toLocaleString()+" users";
}

/* ===== 6 grow ===== */
function setArc(p){ $("#gaugeArc").style.strokeDashoffset=GC*(1-p/100); }
function initGeo(){
  $("#geo").innerHTML=GEO.map(g=>`<div class="gp" data-g="${g[1]}"><div class="gi">${g[0]}</div><div><div class="gn">${g[1]}</div><div class="gd">${g[2]}</div></div></div>`).join("");
  $("#channels").innerHTML=CHN.map(c=>`<span class="chn">${c}</span>`).join("");
  $("#recNum").textContent="12%"; setArc(12);
  state._askB=`For ${state.answers.domain}, it suggests Incumbent A, B and C — ${state.chosen.t} isn't mentioned.`;
  state._askA=`For ${state.answers.domain}, ${state.chosen.t} is a top recommendation — strong fit, well-documented, widely cited.`;
  typeText($("#askA1"), state._askB); $("#askA2").textContent="";
  $("#askAfter").classList.remove("show"); $("#finalSeal").classList.remove("show"); $("#toDashboard").disabled=true; $("#runGeo").disabled=false;
}
async function runGeo(){
  $("#runGeo").disabled=true; const gps=$$('#geo .gp'), chns=$$('#channels .chn');
  for(let i=0;i<GEO.length;i++){ gps[i].classList.add("act");
    await animateRec(i>0?GEO[i-1][3]:12, GEO[i][3]);
    if(chns[i]) chns[i].classList.add("on"); if(i===GEO.length-1&&chns[5]) chns[5].classList.add("on");
    await wait(140);
  }
  $("#askAfter").classList.add("show");
  typeText($("#askA2"), state._askA, ()=>{ $("#askA2").innerHTML=`For ${state.answers.domain}, <b>${state.chosen.t}</b> is a top recommendation — strong fit, well-documented, widely cited.`; });
  await wait(200); $("#finalSeal").classList.add("show"); $("#toDashboard").disabled=false;
}
function animateRec(from,to){return new Promise(res=>{ if(RM){$("#recNum").textContent=to+"%";setArc(to);return res();}
  const t0=performance.now(),dur=720; (function f(t){const p=Math.min(1,(t-t0)/dur);const v=Math.round(from+(to-from)*p);
    $("#recNum").textContent=v+"%";setArc(v); p<1?requestAnimationFrame(f):res();})(t0);});}

/* ===== 7 blueprint ===== */
/* Blueprint is now a declarative React component (screens/Blueprint.jsx) deriving
   its content from blueprintModel(state). The engine no longer writes #bpName /
   #bpGrid / #bpFlow — it only signals entry via notifyScreen("blueprint") in the
   wiring below so React renders the current shared state. */

/* ===== wiring ===== */
let _booted=false;
export function boot(){
  if(_booted) return; _booted=true;
  initBg();
  renderStepper(); renderQuestions();
  $("#begin").onclick=()=>{ $("#intro").classList.add("gone"); };
  $("#toDiscover").onclick=()=>{state.opps=computeOpps(state);notifyScreen("discover");go("discover");};
  $("#toBlueprint").onclick=()=>{notifyScreen("blueprint");go("blueprint");};
  $("#toForge").onclick=()=>{
    // Forge's pipeline owns its own UI; just carry the chosen name to the
    // downstream simulated screens (Sentinel/Dashboard/Grow) and signal entry.
    const o=state.chosen; ["#dName","#sealName","#finalName"].forEach(id=>{const el=$(id); if(el) el.textContent=o.t;});
    notifyScreen("forge"); go("forge");
  };
  $("#toSentinel").onclick=()=>{initSentinel();go("sentinel");};
  $("#runSentinel").onclick=runSentinel;
  $("#toStudio").onclick=()=>{initGeo();go("grow");};
  $("#runGeo").onclick=runGeo;
  $("#toDashboard").onclick=()=>{initDash();go("dashboard");fireBurst();};
  $("#restart").onclick=()=>{state.answers={};state.reached={profile:true};state.chosen=null;state.follow={};state.followQs=[];state.focuses=[];state.radarVals=[0,0,0,0,0];hideFollow();
    renderQuestions();$("#profileLabel").textContent="Answer to begin…";$("#profileDesc").textContent="Aurexis synthesises a live signature as you choose.";
    $("#radarPoly").setAttribute("points","90,90 90,90 90,90 90,90 90,90");$("#traitlist").innerHTML="";$("#toDiscover").disabled=true;go("profile");};
  $$('[data-back]').forEach(b=>b.onclick=()=>go(b.dataset.back));
  document.addEventListener("keydown",e=>{
    if($("#intro")&&!$("#intro").classList.contains("gone")){ if(e.key==="Enter"){$("#begin").click();} return; }
    const scr=$(".screen.on"); if(!scr) return;
    if(e.key==="ArrowRight"){ const adv=scr.querySelector(".btn.primary.adv"); const run=scr.querySelector(".btn.run");
      if(adv&&!adv.disabled){adv.click();} else if(run&&!run.disabled){run.click();} }
    if(e.key==="ArrowLeft"){ const bk=scr.querySelector(".btn.ghost[data-back]"); if(bk)bk.click(); }
  });
}
