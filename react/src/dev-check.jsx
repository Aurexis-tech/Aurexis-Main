// Hidden dev-only plumbing check. Standalone entry (not part of the prototype):
// two buttons that hit the serverless functions and show the raw result, proving
// frontend → function → Claude and frontend → function → Supabase end to end.
// No prototype code is imported; nothing here ships to users.
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'

async function getJson(path) {
  const res = await fetch(path)
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { status: res.status, body }
}

function Check({ label, path, hint }) {
  // `phase` is the lifecycle (idle/loading/done/error); `status` is the HTTP code
  // from the response. They are kept separate so the response's status can't
  // clobber the lifecycle flag (a successful 200 must still read as "done").
  const [state, setState] = useState({ phase: 'idle' })
  const run = async () => {
    setState({ phase: 'loading' })
    try { const r = await getJson(path); setState({ phase: 'done', status: r.status, body: r.body }) }
    catch (e) { setState({ phase: 'error', error: String(e.message || e) }) }
  }
  const ok = state.phase === 'done' && state.body && state.body.ok
  const color = state.phase === 'idle' ? '#888'
    : state.phase === 'loading' ? '#e7b94d'
    : ok ? '#4cd0b3' : '#f08a8a'
  return (
    <div style={{ border: '1px solid #243', borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={run} disabled={state.phase === 'loading'}
          style={{ font: '600 14px system-ui', padding: '9px 16px', borderRadius: 8, border: 'none',
            cursor: 'pointer', background: '#e7b94d', color: '#1c1404' }}>
          {state.phase === 'loading' ? '…' : label}
        </button>
        <code style={{ color: '#9aabc0', fontSize: 12 }}>GET {path}</code>
        <span style={{ marginLeft: 'auto', color, fontWeight: 700, fontSize: 13 }}>
          {state.phase === 'idle' ? '—' : state.phase === 'loading' ? 'calling…'
            : ok ? `ok (HTTP ${state.status})` : `FAIL (HTTP ${state.status ?? '—'})`}
        </span>
      </div>
      <div style={{ color: '#5e7088', fontSize: 12, margin: '8px 0 0' }}>{hint}</div>
      {state.phase === 'done' && (
        <pre style={{ marginTop: 10, padding: 12, background: '#0b1220', borderRadius: 8, color: '#cfe9e2',
          fontSize: 12, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(state.body, null, 2)}
        </pre>
      )}
      {state.phase === 'error' && (
        <pre style={{ marginTop: 10, color: '#f08a8a', fontSize: 12 }}>
          {state.error}{'\n'}(is `vercel dev` running on :3000 and the Vite proxy active?)
        </pre>
      )}
    </div>
  )
}

function DevCheck() {
  const [health, setHealth] = useState('checking…')
  useEffect(() => {
    getJson('/api/health')
      .then(r => setHealth(r.body && r.body.ok ? `up (ts ${r.body.ts})` : `unexpected: ${JSON.stringify(r.body)}`))
      .catch(e => setHealth(`down — ${e.message}`))
  }, [])
  return (
    <div style={{ font: '15px/1.5 system-ui, sans-serif', color: '#eef3f9', background: '#070d18',
      minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ font: '600 22px Georgia, serif', margin: 0 }}>Aurexis · dev-check</h1>
        <p style={{ color: '#9aabc0', marginTop: 6 }}>
          Hidden plumbing check (Phase 0). Not part of the product UI. Function liveness:{' '}
          <b style={{ color: '#4cd0b3' }}>{health}</b>
        </p>
        <Check label="Ping AI" path="/api/ai-ping"
          hint="frontend → function → Claude (claude-sonnet-4-6). Needs ANTHROPIC_API_KEY in repo-root .env.local." />
        <Check label="Ping DB" path="/api/db-ping"
          hint="frontend → function → Supabase. Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, and the 0001 migration applied." />
        <p style={{ color: '#5e7088', fontSize: 12 }}>
          Run with two terminals: <code>vercel dev</code> (repo root, :3000) for /api, and{' '}
          <code>npm run dev</code> (in <code>react/</code>, :5173) for this page. See docs/SETUP.md.
        </p>
      </div>
    </div>
  )
}

createRoot(document.getElementById('dev-root')).render(<DevCheck />)
