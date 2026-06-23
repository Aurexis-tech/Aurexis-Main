# Deploy architecture — static UI now, pipeline backend later

> **Decision:** ship the **static UI** (the built React app, including the new Forge
> screen) to Vercel **aurexis-main (Hobby)** now. **Do NOT** rely on the Forge
> pipeline functions at runtime there — they can't fit Hobby's limits. The Forge UI
> **degrades honestly** to an interface preview when no backend is connected, and
> flips to a real run via a single env var when an always-on backend exists.

## Why the split

| Piece | Where it runs | Why |
|------|---------------|-----|
| Static UI (whole prototype + Forge screen) | **Vercel aurexis-main (Hobby), static** | It's a static SPA — cheap, instant, scales to zero. |
| Forge pipeline (`/api/forge/*`) | **An always-on host (Railway / Render / Fly), later** | Each stage is one AI call of **~75–120s** (Scout's web search ~90s). Vercel **Hobby caps functions at 60s** (and the default is even lower). Five such stages **cannot** run there — they'd time out. An always-on Node host has no such per-request cap. |

The pipeline was deliberately built **stage-by-stage (one request per stage)** so it
can fit a serverless timeout *if/when* the limit is high enough — but Hobby's 60s is
below even a single stage, so the backend moves off Vercel.

## The single switch: `VITE_API_BASE`

The Forge UI (`react/src/lib/api.js`, `react/src/screens/Forge.jsx`) reads
`VITE_API_BASE` at build time:

- **Unset (the aurexis-main static build):** `BACKEND_CONFIGURED = false` →
  **honest preview mode.** Forge shows a clear notice — *"Forge's live 5-stage
  pipeline runs on a dedicated backend that isn't connected to this deployment yet.
  This is a preview of the interface."* — the run button is disabled, **no calls are
  fired**, every stage panel stays explorable. Nothing is faked, nothing hangs.
- **Set to a reachable backend URL (later):** `BACKEND_CONFIGURED = true` → the
  **same UI** runs the real pipeline, threading each stage's output to the next.
  **No code change** — just set the env var and rebuild/redeploy.
- **Belt-and-suspenders:** even in live mode, if a stage call is unreachable or
  times out (a hard 240s client ceiling — above the legitimate worst case, so it
  never aborts a real call), it degrades to the same honest "backend not reachable"
  per-stage error + Retry. No infinite spinner, no crash.

Verified locally both ways: built with no `VITE_API_BASE` → preview notice + disabled
run + **0 API calls**; run with `VITE_API_BASE` pointed at a backend → Scout executed
for real (HTTP 200, 6 opportunities, 8 sources, ~89s) and the chain proceeds.

No secret is ever in the client — `/api/forge/*` are server-side (they hold
`ANTHROPIC_API_KEY`); the browser only POSTs to the relative/based URL. `dist/` is
grepped clean of keys/SDK on every build.

## vercel.json review (read, not changed)

The repo-root `vercel.json` is **no-build static**:

```json
{ "framework": null, "buildCommand": null, "outputDirectory": "." }
```

**What it actually serves:** the **byte-exact single-file baseline** at repo-root
`index.html` (+ `src/`) — the original prototype with the *simulated* engine — **plus**
the repo-root `/api/*` serverless functions. Its own comment notes: *"The React app
under ./react is a SEPARATE Vercel project and ignores this file."*

**Important topology note (flag for reconciliation):** that root config does **not**
serve the **React** build, so it does **not** carry the new client-orchestrated Forge
UI — that lives in the **React app under `react/`** (Vite build → `react/dist`). To
put the real Forge UI on aurexis-main, the Vercel project must build & serve the
React app (see steps below), not the root single-file baseline. The root `vercel.json`
is left untouched here.

**The `/api/forge/*` functions** stay in the repo (they move to the external backend
later — do not delete them). If the root project keeps deploying them, they will
exist but **must not be relied on** at runtime on Hobby: a call would 504 at 60s. The
UI's honest-degrade path means a static React deploy that can't reach a working
pipeline simply shows the preview — so leaving the functions deployed is harmless to
the UX, just unused.

The **experimental `forge` Vercel project** from an earlier session is **unrelated to
this work and untouched.**

## Deploy steps (run these yourself when ready — nothing is pushed here)

```bash
# 1. push the consolidated main
cd "D:/Aurexis/Main Aurexis/aurexis"
git push origin main            # remote: Aurexis-tech/Aurexis-Main

# 2. aurexis-main (Hobby) — serve the STATIC React UI (honest preview, no backend)
#    In the Vercel project settings for aurexis-main:
#      - Root Directory:     react
#      - Framework Preset:   Vite
#      - Build Command:      npm run build      (outputs react/dist)
#      - Output Directory:   dist
#      - Environment:        leave VITE_API_BASE UNSET  → Forge shows the honest preview
#    Then trigger a deploy (push to main, or `vercel --prod` from ./react once linked).

# 3. LATER — stand up the pipeline backend on an always-on host
#      - Deploy the /api/forge/* handlers (Node) to Railway/Render with
#        ANTHROPIC_API_KEY set server-side; expose POST /forge/{scout,architect,
#        creator,operator,evolver} with permissive CORS for the aurexis-main origin.
#      - Set VITE_API_BASE = https://<that-backend>/api  in aurexis-main, redeploy.
#        The same UI now runs the real pipeline — no code change.
```

> Status recap: the full 5-stage backend + the Forge UI are **harness/local-verified**
> end-to-end. **`vercel dev` and any deploy remain unproven**; the honest-degrade makes
> a backend-less static deploy safe to ship in the meantime.
