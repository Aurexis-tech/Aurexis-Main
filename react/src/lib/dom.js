// Framework-neutral DOM helpers — verbatim from the baseline app.js (only the
// `const` → `export const`). RM is read once at module load, exactly as before.
export const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const $ = s => document.querySelector(s);
export const $$ = s => Array.prototype.slice.call(document.querySelectorAll(s));
export const wait = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
export const GC = 527.79;
