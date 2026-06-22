# Aurexis — Opportunity-to-Reality Engine

A high-level interactive prototype for **Aurexis**, an engine that reads who you
are, finds an opportunity matched to you, builds it, secures it, hands you the
controls, and takes it to market — as one continuous guided flow.

This repository is a **structure-only refactor** of the original single-file
prototype (`Aurexis_Engine_Prototype_8.html`). The markup, CSS, and JavaScript
were split into separate files **without changing a single rendered byte** — the
page looks and behaves identically to the original. See **Fidelity** below.

## File tree

```
aurexis/
├── index.html          # markup only (inline <style>/<script> swapped for <link>/<script src>)
├── src/
│   ├── styles.css      # the original <style> contents, verbatim
│   └── app.js          # the original <script> contents, verbatim
├── package.json
├── vite.config.js
├── .gitignore
└── README.md
```

The **only** edits to the original markup were two tag swaps, each left in its
exact original position:

- the inline `<style>…</style>` block → `<link rel="stylesheet" href="./src/styles.css">`
- the inline `<script>…</script>` block (end of `<body>`) → `<script src="./src/app.js"></script>`

`app.js` is loaded as a **classic** script (not `type="module"`) at the end of
`<body>`, so its execution semantics match the original inline script exactly.
All `<head>` meta tags and the Google Fonts `<link>`s are untouched, and every
path is relative (`./src/...`) so the app runs over `file://` or any static
server.

## Run it

Pick whichever is easiest — all three serve the identical page.

**1. Just open the file** (no tooling)

```
# macOS
open index.html
# Windows
start index.html
# Linux
xdg-open index.html
```

**2. Any static server** (recommended over `file://` so fonts/relative paths
behave consistently)

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

**3. Vite dev server** (hot reload while you iterate)

```
npm install
npm run dev          # http://localhost:5173, opens automatically
```

Other npm scripts: `npm run build` (static build → `dist/`, minify off),
`npm run preview` (serve the build), `npm run serve` (one-shot static serve via
`npx serve .`).

## How the app works

The prototype is a single linear, keyboard-navigable journey (use **←** / **→**
to move between steps). A progress rail tracks where you are; each step unlocks
the next once you act.

1. **Intro** — the cover. "Turn who you are into what's real." Press
   *Begin the engine* to enter the flow.
2. **Profile** — Aurexis profiles your personality and decision-making style
   from a short set of questions, rendering a live "profile signature" radar.
3. **Discover** — opportunities are ranked and simulated against your profile
   and live market signal; you pick the one to bring to reality.
4. **Blueprint** — the Architect maps exactly what will be created, secured, and
   grown. Approve the plan, then watch it become real.
5. **Forge · create** — five products build the system end to end (agents,
   software, automations, workflows, infrastructure) with a live build log,
   architecture diagram, and capability ladder.
6. **Sentinel · verify** — runs *during* the build to confirm each step and
   *after* to harden the product, producing a security score and a
   "Sentinel Verified" seal.
7. **Dashboard** — your control surface: drag price, growth pace, and toggles to
   model revenue, active users, and unit economics live.
8. **Studio · grow** — the SEO/GEO layer that gets the product *recommended by
   AI*, not just ranked, with a live recommendation-rate gauge and before/after
   comparison.

All figures are illustrative — this is a prototype, not a live system.

## Fidelity

The refactor is byte-exact. Concatenating the split files back into a single
document —

```
head  →  "<style>"  →  src/styles.css  →  "</style>"  →  in-between markup
      →  "<script>"  →  src/app.js      →  "</script>" →  tail
```

— reproduces the original `Aurexis_Engine_Prototype_8.html` **exactly**. `diff`
reports no differences and the SHA-256 of the reconstruction matches the
original:

```
e4d359e53e2c1453e93d7544a7109c034becb02fd227382eeddba50be4482ac1
```

## Next phases (optional)

- **React componentization** — break each step (Intro, Profile, Discover,
  Blueprint, Forge, Sentinel, Dashboard, Studio) into components with shared
  state, replacing the hand-rolled DOM wiring in `app.js`.
- **Real backend** — swap the illustrative figures for live profiling, market
  signal, build orchestration, and security scoring behind an API.
- **Self-hosted fonts** — vendor the Fraunces / Hanken Grotesk families locally
  to drop the Google Fonts dependency and run fully offline.
