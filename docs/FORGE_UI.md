# Forge UI — the real 5-stage pipeline runner

> Status: **harness/local-verified.** The Forge screen (`react/src/screens/Forge.jsx`)
> replaces the old simulated build animation with a **real, client-orchestrated**
> pipeline over the live `/api/forge/*` endpoints. `vercel dev` and deploy are still
> **UNPROVEN** (see the caveats at the bottom).

## Architecture: client-orchestrated, one call per stage

The browser holds the running pipeline state and calls the five stages
**sequentially as separate requests**, threading each stage's real output into the
next stage's input. There is **no monolithic "run-the-whole-chain" backend call** —
keeping each request short is what makes the chain *deploy-survivable* on serverless
later (one long call would blow the platform timeout; five shorter ones each fit,
except Scout — see caveats).

```
Scout ──opportunities[]──▶ (user PICKS one) ──▶ Architect ──Blueprint──▶ Creator
  └─ live web_search, ~90s            │                                    │
                                       └── domain/profile from flow state   ▼
                                                              Operator ◀── starter+blueprint
                                                                 │
                                                                 ▼
                                                              Evolver ◀── starter+blueprint+opportunity+operations
```

### How stage outputs thread to inputs (exact shapes)

| Stage | Request body the UI sends |
|-------|---------------------------|
| `scout` | `{ domain, profile:{label,style,time}, answers, focus? }` — derived from the existing flow state (`state.answers.domain`, `state.profileLabel`, the chosen opp's goal as an optional `focus`). |
| `architect` | `{ opportunity: scout.opportunities[picked], domain, profile }` — the **user-picked** Scout opportunity. |
| `creator` | `{ blueprint: <architect output>, domain, profile }`. |
| `operator` | `{ starter:{projectName,summary,stack,whatsRealVsStub}, blueprint:{infrastructureModel,systemModel,growthModel}, domain }` — the heavy `files[]` are intentionally **not** resent. |
| `evolver` | `{ starter:{projectName,summary,whatsRealVsStub}, blueprint:{productModel,growthModel,businessModel}, opportunity:{title,summary}, operations:{summary}, domain }` — the whole chain. |

`runFrom(stage)` runs from any stage through Evolver, threading **freshly-returned**
values and falling back to stored results for upstream stages — this is reused for
both the initial downstream run (after the pick) and per-stage **Retry**.

### Gating, progress, resilience
- **Gating.** A stage runs only after the prior one succeeded. Scout returns
  multiple opportunities and the user must **pick one** before Architect runs (that
  pick is Architect's input). After the pick, Architect→Creator→Operator→Evolver
  auto-feed in sequence; each stays individually visible.
- **Progress.** Honest per-stage status (`idle → running → done/failed`), a live
  **elapsed** timer, and an **indeterminate spinner** — *not* a fake timed bar.
  Scout shows a "can take ~90s" note.
- **Resilience.** A stage failure (timeout/5xx/transport) shows a clear error + a
  **Retry for that stage** (`runFrom(stage)`), without losing prior stages' results.
  No auto-retry loops.

## Client API config (no hardcoded ports, no secrets in the browser)

`react/src/lib/api.js` resolves the base URL as `VITE_API_BASE` (build-time) **or**
same-origin `/api`. So:
- **Local:** the Vite dev proxy (`vite.config.js`: `proxy: { '/api': 'http://localhost:3000' }`)
  forwards `/api/forge/*` to whatever serves `/api` locally — the function harness
  *or* `vercel dev` — on :3000. No app change needed to switch between them.
- **Production:** same-origin `/api` hits the deployed Vercel functions. Set
  `VITE_API_BASE` only if the API lives on a different origin.

The `/api/forge/*` endpoints are **server-side** (they hold `ANTHROPIC_API_KEY`); the
browser only POSTs to the relative/based URL and never sees a secret. `dist/` was
grepped — no `ANTHROPIC_API_KEY`/service-role/SDK in the client bundle.

## Cost & honesty
- Running the full pipeline makes **real AI calls (~$0.50–0.65 per run** — Scout's
  live web search dominates the input cost). The UI states this up front; it is not
  a fake figure.
- Honest copy throughout: a report to *investigate*, a design to *evaluate*, a
  *runnable starter* (not a running business / not deployed), an ops *PLAN*, a
  *roadmap to run yourself*. No autonomy claims; each stage's server-side
  `disclaimer` is rendered visibly.
- New dependency: **`jszip`** (`^3.10.1`) — client-side `.zip` of the Creator
  `files[]` preserving paths; no server storage. Adds ~98 KB raw / ~31 KB gz to the
  bundle (JS 201→311 KB). No code-highlighter dep (plain `<pre>`).

## ⚠️ Deploy-survivable shape, but UNPROVEN on `vercel dev` / deploy
The pipeline is built in the **stage-by-stage** shape precisely so each request can
fit a serverless timeout. **Two things remain unproven and must be solved before
deploy:**
1. **`vercel dev` itself** — never run for these endpoints (account mismatch + no
   static-project link; see `docs/NEXT_SESSION.md`). All verification here was via
   the local function harness behind the Vite proxy.
2. **Scout's ~90s call vs. serverless timeouts.** Vercel's default function timeout
   (and especially the Hobby tier's 10s/60s limits) will likely **kill Scout**. Before
   deploy, Scout needs either a raised `maxDuration`, a streaming/polling/background
   pattern, or a shorter web-search budget. The other four stages (~75–120s) carry
   the same risk to a lesser degree.
