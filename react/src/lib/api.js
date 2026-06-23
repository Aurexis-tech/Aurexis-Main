// Client API config for the Forge pipeline. The /api/forge/* endpoints are
// SERVER-SIDE (they hold ANTHROPIC_API_KEY); the browser only POSTs to a relative
// (or VITE_API_BASE-prefixed) URL and never sees a secret.
//
// Base URL resolution (no hardcoded ports):
//   - VITE_API_BASE if set at build time (e.g. an absolute Vercel URL), else
//   - same-origin "/api" (works behind the Vite dev proxy → whatever serves /api
//     locally, and behind real Vercel in production).
const BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')

export const API_BASE = BASE

// Is a dedicated pipeline backend wired in at build time? On the static aurexis-main
// deploy VITE_API_BASE is unset → the UI shows an honest "backend not connected"
// preview instead of firing calls that would time out. Setting VITE_API_BASE to a
// running backend later flips this to a live run with NO other code change.
export const BACKEND_CONFIGURED = !!import.meta.env.VITE_API_BASE

// Hard client-side ceiling so a hung backend never produces an infinite spinner.
// Set well above the legitimate worst-case stage (Scout's web search can run ~90s,
// and a stage has occasionally reached ~3min) so it never aborts a real call — it
// only catches a truly stuck backend, degrading honestly instead of spinning.
const TIMEOUT_MS = 240000

// POST one Forge stage and return its parsed JSON. Throws an Error (with .status)
// on a transport error / timeout (status 0) or any non-ok / { ok:false } response —
// callers catch this to render a per-stage failure + Retry, never a crash/hang.
export async function postForge(stage, body, { signal } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  if (signal) { if (signal.aborted) ctrl.abort(); else signal.addEventListener('abort', () => ctrl.abort()) }
  let res
  try {
    res = await fetch(`${BASE}/forge/${stage}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } catch (e) {
    clearTimeout(timer)
    const err = new Error(ctrl.signal.aborted
      ? 'The Forge backend did not respond in time.'
      : 'Could not reach the Forge backend.')
    err.status = 0 // transport-level: unreachable / timed out
    throw err
  }
  clearTimeout(timer)
  let data = null
  try { data = await res.json() } catch { /* non-JSON */ }
  if (!res.ok || !data || data.ok !== true) {
    const err = new Error((data && data.error) || `Request failed (HTTP ${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}
