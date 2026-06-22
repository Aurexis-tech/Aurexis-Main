// Discover card animation helpers — moved verbatim from engine.js (behaviour
// unchanged). Reused imperatively by screens/Discover.jsx in a mount/entry
// effect. All honour prefers-reduced-motion exactly as before (RM short-circuit).
import { RM } from './dom.js'

export function countUp(el,to){ if(!el) return; if(RM){ el.textContent=to+"%"; return; }
  const t0=performance.now(),dur=700; (function f(t){ const p=Math.min(1,(t-t0)/dur);
    el.textContent=Math.round(to*(1-Math.pow(1-p,3)))+"%"; if(p<1) requestAnimationFrame(f); else el.textContent=to+"%"; })(t0); }
export function enterCards(){ if(RM) return; const cards=Array.prototype.slice.call(document.querySelectorAll("#opps .opp"));
  cards.forEach((c,i)=>{ c.classList.add("enter"); const d=60+i*90;
    setTimeout(()=>c.classList.add("show"),d); setTimeout(()=>{c.classList.remove("enter");c.classList.remove("show");},d+650); }); }
export function attachTilt(){ if(RM) return; Array.prototype.slice.call(document.querySelectorAll("#opps .opp")).forEach(c=>{
  c.addEventListener("mousemove",e=>{ const r=c.getBoundingClientRect(); const dx=(e.clientX-r.left)/r.width-.5,dy=(e.clientY-r.top)/r.height-.5;
    c.style.transform="perspective(700px) rotateX("+(-dy*6)+"deg) rotateY("+(dx*6)+"deg) translateY(-4px)"; });
  c.addEventListener("mouseleave",()=>{ c.style.transform=""; }); }); }
