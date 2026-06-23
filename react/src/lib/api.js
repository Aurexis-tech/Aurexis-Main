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

// POST one Forge stage and return its parsed JSON. Throws an Error (with .status)
// on a transport error or any non-ok / { ok:false } response — callers catch this
// to render a per-stage failure + Retry.
export async function postForge(stage, body, { signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/forge/${stage}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    const err = new Error('Could not reach the Forge service (is the API running?).')
    err.status = 0
    throw err
  }
  let data = null
  try { data = await res.json() } catch { /* non-JSON */ }
  if (!res.ok || !data || data.ok !== true) {
    const err = new Error((data && data.error) || `Request failed (HTTP ${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}
