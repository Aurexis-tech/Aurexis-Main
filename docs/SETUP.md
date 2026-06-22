# Aurexis — Local setup (Phase 0)

Get the plumbing slice (`/dev-check`) running locally: frontend → serverless
function → Claude, and → Supabase. You supply your own keys; **none are committed**.

## 0. Prerequisites

- Node 18+ and npm.
- An [Anthropic API key](https://console.anthropic.com/) (for `ai-ping`).
- A [Supabase](https://supabase.com/) project (for `db-ping`).
- Vercel CLI for local functions: `npm i -g vercel` (or use `npx vercel`).

## 1. Install dependencies

```bash
cd "D:/Aurexis/Main Aurexis/aurexis"
npm install            # root: installs @anthropic-ai/sdk + @supabase/supabase-js (for /api)
cd react && npm install && cd ..   # frontend deps (if not already installed)
```

## 2. Create a Supabase project & collect keys

1. Create a project at https://supabase.com/dashboard.
2. **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL` (and `VITE_SUPABASE_URL`)
   - **`anon` public key** → `VITE_SUPABASE_ANON_KEY` (browser-safe, Phase 1)
   - **`service_role` secret key** → `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ **server-only** — bypasses Row-Level Security; never put it in the browser.
3. Anthropic key from https://console.anthropic.com/ → `ANTHROPIC_API_KEY`.

## 3. Put secrets in `.env.local` (git-ignored)

Copy the template and fill in values. **Server** vars go in the **repo root**
(read by `vercel dev`); **browser** (`VITE_`) vars go in `react/` (Phase 1).

```bash
cp .env.example .env.local        # repo root — then edit:
#   ANTHROPIC_API_KEY=sk-ant-...
#   SUPABASE_URL=https://xxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role...
```

(For Phase 1, also create `react/.env.local` with `VITE_SUPABASE_URL=` and
`VITE_SUPABASE_ANON_KEY=`.) Both `.env*` files are git-ignored except
`.env.example`.

## 4. Apply the database migration

The schema in `supabase/migrations/0001_init.sql` is **authored, not auto-run**.
Apply it one of two ways:

- **Dashboard:** open **SQL Editor**, paste the contents of
  `supabase/migrations/0001_init.sql`, run.
- **CLI:** `supabase link --project-ref <ref>` then `supabase db push`.

This creates `public.health` (used by `db-ping`), `public.profiles`,
`public.sessions`, and their RLS policies.

## 5. Run it locally (two terminals)

**Terminal A — serverless functions** (repo root; serves `/api/*` on :3000 and
loads `.env.local`):

```bash
cd "D:/Aurexis/Main Aurexis/aurexis"
vercel dev          # first run asks to link a project — accept defaults; it's local only
# sanity: curl http://localhost:3000/api/health  →  {"ok":true,"ts":...}
```

**Terminal B — the Vite frontend** (in `react/`; serves the app + the hidden dev
page on :5173, and proxies `/api` → :3000):

```bash
cd "D:/Aurexis/Main Aurexis/aurexis/react"
npm run dev
```

## 6. Hit `/dev-check`

Open **http://localhost:5173/dev-check.html**

- It shows function liveness (`/api/health`) on load.
- **Ping AI** → calls `/api/ai-ping` → Claude → shows the reply (`Aurexis AI pong`).
- **Ping DB** → calls `/api/db-ping` → Supabase → shows `{ ok: true, rows: 1 }`
  (or a clean error if the migration hasn't been applied / keys are missing).

The prototype itself is unchanged and still served at
**http://localhost:5173/** — `/dev-check` is not linked from it.

## Troubleshooting

- **AI 500 "ANTHROPIC_API_KEY is not set"** — restart `vercel dev` after editing
  `.env.local` (it reads env at startup).
- **DB 500 about `health` not existing** — apply the migration (step 4).
- **`/api` 404 / network error in the page** — make sure `vercel dev` is up on
  :3000; the Vite proxy in `react/vite.config.js` forwards `/api` there.
- **Never** paste a real key into any committed file. If unsure, run the secret
  scan: `git grep -nE 'sk-ant-|service_role|eyJ' -- . ':!*.example'` (should be empty).
