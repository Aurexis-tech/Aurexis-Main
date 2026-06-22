// Framework-neutral logic ported verbatim from the baseline app.js. Behavior is
// unchanged. `model()` reads live control values from the DOM exactly as the
// original did (it is "pure" only in the sense of holding no React state).
import { DKIT, FOCUS_KW, FQ_A, FB, FQ_C } from './data.js'
import { $ } from './dom.js'
import { state } from './state.js'

export function traitScores(a){
  const t={Build:.12,Grow:.12,System:.12,Vision:.12,Create:.12};
  const add=(k,v)=>{t[k]=Math.min(1,t[k]+v);};
  ({"Building things":()=>{add("Build",.5);add("Create",.12)},"Selling & growth":()=>{add("Grow",.5);add("Vision",.1)},
    "Systems & optimisation":()=>{add("System",.5);add("Build",.1)},"Big-picture strategy":()=>{add("Vision",.5);add("Grow",.12)},
    "Solving hard problems":()=>{add("System",.35);add("Build",.25)},"Creative & design":()=>{add("Create",.5);add("Build",.1)}}[a.energy]||(()=>{}))();
  ({"Fast & iterative":()=>add("Build",.3),"Data-first":()=>add("System",.35),"Intuition-led":()=>add("Vision",.3),
    "Customer-led":()=>add("Grow",.3),"Methodical":()=>{add("System",.25);add("Build",.1)}}[a.style]||(()=>{}))();
  ({"Cautious":()=>add("System",.2),"Steady":()=>add("System",.14),"Balanced":()=>{add("Build",.1);add("Grow",.1)},
    "Bold":()=>{add("Vision",.25);add("Grow",.15)},"All-in":()=>{add("Vision",.3);add("Grow",.2)}}[a.risk]||(()=>{}))();
  if(a.domain==="Creator economy"||a.domain==="E-commerce & DTC") add("Create",.15);
  if(a.domain==="AI & dev tools") add("System",.15);
  if(a.domain==="Marketplaces") add("Grow",.15);
  return t;
}
export function radarPoint(i,val){ const ang=-Math.PI/2 + i*2*Math.PI/5; const R=12+val*58; return [90+R*Math.cos(ang),90+R*Math.sin(ang)]; }

export function hashStr(s){let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}

export function focusMatch(o,f){ if(o._focus && o._focus.indexOf(f)>=0) return true;
  const kw=FOCUS_KW[f]; if(!kw) return false; const txt=(o.t+" "+o.g+" "+o.b.join(" ")).toLowerCase();
  return kw.some(w=>txt.indexOf(w)>=0); }

export function genOpps(domain){
  const k=DKIT[domain]; const noun=k?k[0]:domain.split(/[ \/&]/)[0]; const ctx=k?k[1]:domain.toLowerCase();
  return [
    {t:noun+" Copilot",g:"An AI copilot for "+ctx+".",b:["AI agent","Web app","Integrations","Dashboard"],bias:{energy:"Building things",style:"Fast & iterative"},_focus:["novelty","founder-fit","craft","depth","handson","experiment","workflow"]},
    {t:noun+" Autopilot",g:"Automates "+ctx+" end to end.",b:["Automation engine","Workflows","Integrations","Dashboard"],bias:{energy:"Systems & optimisation",style:"Methodical"},_focus:["automation","efficiency","reliability","scale","lighttouch","plan"]},
    {t:noun+" Insights",g:"Predictive analytics for "+ctx+".",b:["Data pipeline","Prediction model","Dashboard","Alerts"],bias:{style:"Data-first",energy:"Solving hard problems"},_focus:["data","signal","evidence","timing","conversion"]},
  ];
}

export function cGeneric(domain){return {id:"c",q:"In "+domain+", what would you rather own?",opts:[{l:"The workflow",f:"workflow"},{l:"The data",f:"data"},{l:"The audience",f:"audience"}]};}

export function pickFollowups(a){
  const A=FQ_A[a.energy]||cGeneric(a.domain);
  const B=(a.risk==="Bold"||a.risk==="All-in")?FB.bold:(a.risk==="Cautious"||a.risk==="Steady")?FB.careful:(a.style==="Data-first")?FB.data:(a.style==="Intuition-led")?FB.intuition:(a.style==="Customer-led")?FB.customer:FB.generic;
  const C=FQ_C[a.domain]||cGeneric(a.domain);
  return [A,B,C];
}

export function fmtUSD(n){ n=Math.round(n);
  if(n>=1e6) return "$"+(n/1e6).toFixed(n>=1e7?1:2)+"M";
  if(n>=1e3) return "$"+(n/1e3).toFixed(n>=1e4?0:1)+"K";
  return "$"+n.toLocaleString(); }

export function sparkPts(slope){ // rising mini-series, steeper with pace/growth
  const N=7,out=[]; for(let i=0;i<=N;i++){ const t=i/N;
    let v=t*(.35+slope*.6)+(i%2?.05:-.03); v=Math.max(0,Math.min(1,v));
    out.push((i*42/N).toFixed(1)+","+(16-v*13).toFixed(1)); } return out.join(" "); }

// Blueprint screen data, derived from shared state — mirrors the strings/order
// the engine's initBlueprint() used verbatim (now the single source of truth for
// the declarative Blueprint component). No reword, no recompute.
export function blueprintModel(s){
  const a=s.answers, o=s.chosen;
  return {
    name:o.t,
    items:[
      ["Your profile",s.profileLabel,`${a.style} · ${a.time}`],
      ["The opportunity",o.t,`${a.domain} · ${o.fit}% fit · ~${o.ttr} mo to revenue`],
      ["Forge will build",o.b.length+" systems",o.b.join(" · ")],
      ["Sentinel will secure","10-point audit","Hardened toward near hack-proof"],
      ["You will control","A live dashboard","Pricing, scale & quality — your settings"],
      ["Studio will grow","AI recommendation","Across ChatGPT, Claude, Gemini & more"],
    ],
  };
}

export function model(){
  const price=+$("#price").value, p=state.pace;
  const evolve=$('[data-tog="evolve"]').classList.contains("on");
  const scale=$('[data-tog="scale"]').classList.contains("on");
  const users=state.users*(scale?1:.85)*(evolve?1.12:1)*(0.8+p*0.18);
  const mrr=Math.round(users*price/100)*100, arr=mrr*12;
  let churn=5.2-(evolve?1.8:0)+(price-49)/100*1.1; churn=Math.max(1.6,Math.min(7.5,churn));
  let margin=0.80+(evolve?0.02:0)+(scale?0:-0.03); margin=Math.max(.72,Math.min(.9,margin));
  const cac=Math.round(70*(0.7+p*0.34));
  const ltv=price*margin/(churn/100), ratio=ltv/cac, payback=cac/(price*margin);
  let g=(0.05+0.045*p)-churn/100; g=Math.max(-0.04,g); // monthly net growth
  return {price,p,evolve,scale,users,mrr,arr,churn,margin,cac,ltv,ratio,payback,g,
          uptime:scale?"99.95%":"99.5%",quality:evolve?"Rising":"Flat"};
}
