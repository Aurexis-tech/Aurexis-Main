# Next session — make Forge real (minimal backend slice)

> Snapshot: trunk is `main` @ tag **`v3.0-foundation`** — the polished client
> product (declarative Blueprint/Discover + intentional imperative islands) plus
> the Phase-0 backend foundation (api skeleton + Supabase migration) and the
> AUD-01 mobile fix, all consolidated. Pre-Forge trunk. The unmerged stack is gone.

## Goal

**Make Forge real** — the first engine to produce genuine output, as a **minimal,
additive slice on the existing backend** (no new infra):

- New endpoint **`POST /api/forge`** (server-side): takes the chosen blueprint
  (opportunity + the blueprint items already in app state) and asks **Claude
  (`claude-sonnet-4-6`, via `api/_lib/anthropic.js`)** to generate:
  1. a concrete **architecture** for the product, and
  2. a **starter-code / project scaffold** — a real set of files (paths +
     contents) for a runnable starter.
- Claude returns **structured JSON**, validated against a schema server-side
  before it reaches the browser.
- The browser **zips the returned files client-side** (e.g. a tiny zip lib or
  `CompressionStream`) and offers a **download**. Optionally render the file tree
  in the Forge screen.
- **Human-in-the-loop:** the user reviews/downloads the scaffold and decides what
  to run. **No autonomous deploy, no "auto-launches a business."** Copy stays
  honest: "generates a starter project/scaffold," never the prototype's absolute
  claims (see the copy rule in `docs/ARCHITECTURE.md`).

This is **Phase 3** in `docs/ROADMAP.md`. Keep it a thin vertical slice: real
generation + download, nothing more.

## Explicitly OUT of scope this session

- **No auth, no DB persistence.** Don't wire Supabase Auth or save sessions yet —
  that's Phase 1, deliberately deferred. `/api/forge` runs statelessly on the
  existing serverless setup, same as the other ping endpoints.
- Don't touch Sentinel/Studio/Dashboard or the prototype's other screens.
- Don't change the static baseline at repo root (it stays the sha-verified
  reference: `e4d359e5…82ac1`).

## How to wire it (suggested shape)

- Mirror the existing pattern: `api/forge.js` (CJS) → `require('./_lib/anthropic')`
  → `complete()` with a Forge system prompt + a strict JSON output contract.
- Frontend: the Forge screen already has the chosen blueprint in shared `state`
  (`state.chosen`, plus `blueprintModel(state)`). Add a "Generate scaffold" action
  that POSTs to `/api/forge` and, on success, builds a zip for download. Keep the
  existing animated build sequence as-is (island); the real generation is an
  additive action, not a rewrite of the screen.

## Open items / gotchas carried over

- **`vercel dev` has never actually run here.** It needs an interactive link and
  the local Vercel CLI is logged into **`fintechowner-7002` / team `aurexis-ai7062`
  (no projects)** — a **different account** than the one holding the real project.
  The Phase-0 slice was **proven via the local function harness only** (real keys,
  real Claude + Supabase calls all green), not via `vercel dev`. To run `vercel
  dev` for real: log into the correct account + link an existing project in a real
  terminal, then `vercel dev` + `npm run dev` (react) → `/dev-check.html`.
- **Backend verification = harness-only so far.** `/api/health`, `/api/ai-ping`,
  `/api/db-ping` returned 200 with real keys; Supabase migration `0001_init` is
  applied to project **Aurexis-Main** (`tuseogboaxflcxwptcwe`) and advisor-clean.
- **Secrets:** `.env.local` (repo root) holds the real server keys; it is
  git-ignored and untracked. Never commit it. `.env.example` lists names only.
- **Auth/persistence deferred:** when Phase 1 lands, add `VITE_SUPABASE_*` to
  `react/.env.local` and gate `/api/*` on the user's token; `sessions`/`profiles`
  tables already exist with owner-only RLS.

## Quick start for next session

```bash
cd "D:/Aurexis/Main Aurexis/aurexis"
git checkout -b feature/forge-real        # branch off main (v3.0-foundation)
npm install                               # root: /api SDKs
cd react && npm install                   # frontend
# build /api/forge.js, add the client action, then verify with the harness
# (or vercel dev once the account/link is sorted).
```
