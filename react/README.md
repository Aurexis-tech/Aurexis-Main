# Aurexis — React + Vite port

A **faithful React port** of the Aurexis prototype: same look, same behaviour,
same fonts, same timing, same reduced-motion handling. This is a **parallel
implementation** that lives beside the verified static baseline — it does **not**
replace it. The baseline on `main` (`../index.html` + `../src/*` +
`../reference/`) remains the byte-exact, SHA-256-verified source of truth.

Because a rewrite can never be byte-identical to the original, fidelity here is
verified a different way: **visual parity** (screenshot diffs) and **behavioural
parity** (driven interaction comparison) against the baseline. See
[Verification](#verification).

## How it's built (architecture)

The original `app.js` is imperative: a global `state`, `$`/`$$` DOM helpers,
`innerHTML` rendering, hand-rolled SVG path math, a `<canvas>` particle field,
and `await wait(ms)` animation sequences that respect `prefers-reduced-motion`
and `devicePixelRatio`. Re-expressing that as React state machines would change
timing and risk the visuals. So we **didn't**. The strategy is
**logic-as-modules + imperative islands**:

- **`src/styles.css`** — a **byte-identical** copy of the baseline `styles.css`
  (verified with SHA-256), imported once in `main.jsx`. Not converted to CSS
  modules / Tailwind / styled-components; not a single rule edited.
- **`src/lib/`** — the framework-neutral logic, ported **as-is**:
  - `dom.js` — `$`, `$$`, `wait`, `RM` (reduced-motion flag), `GC`.
  - `state.js` — `STEPS` and the shared `state` object (lifted out of the global
    scope into a module singleton; same shape, same initial values).
  - `data.js` — every data constant verbatim (`QS`, `NOUN`, `TRAITS`, `DKIT`,
    `FOCUS_KW`, `FQ_A`, `FB`, `FQ_C`, `FOCUS_ADJ`, `LIB`, `MKT`, `FPROD`, `VERS`,
    `CHECKS`, `OVERSIGHT`, `GEO`, `CHN`).
  - `logic.js` — pure functions (`traitScores`, `radarPoint`, `hashStr`,
    `focusMatch`, `genOpps`, `cGeneric`, `pickFollowups`, `fmtUSD`, `sparkPts`,
    `model`).
  - `engine.js` — the imperative renderers, the canvas field, the radar/chart/
    gauge math, the Forge/Sentinel/Studio async sequences, the stepper/nav, and
    the original wiring exported as `boot()`. Behaviour changed in **zero** ways.
- **`src/screens/`** — one component per stage (`Intro`, `Profile`, `Discover`,
  `Blueprint`, `Forge`, `Sentinel`, `Dashboard`, `Grow`). Each renders the
  **exact same markup** as the baseline — same classes, same element IDs
  (`#bgcanvas`, `#opps`, `#tiles`, `#price`, `#geo`, `#revChart`, the radar
  nodes, …). Containers the engine fills (e.g. `#questions`, `#opps`, `#checks`,
  `#archSvg`, `#tiles`) are rendered **empty**: React mounts the container, the
  ported engine owns its inner DOM. They never fight over the same subtree.
- **`src/App.jsx`** — the shell. Renders the canvas, intro, header, stepper rail
  and all stage screens (in the baseline's DOM order), then calls `boot()` once
  in a mount `useEffect`. Navigation, the stepper and every sequence are owned by
  the engine's original `go()`/handlers, so React never re-renders the screens.

Two deliberate, behaviour-preserving adaptations for the React host:

- **No `<StrictMode>`** — its dev-only double-invoke would `boot()` the imperative
  engine twice (two canvas loops, double listeners). The baseline ran a single
  classic `<script>`; we match that with one boot (also guarded internally).
- **The price slider is uncontrolled** (`defaultValue`, not `value`) so the
  engine reads/writes `.value` freely — exactly like the baseline's plain DOM
  input.

Fonts (Fraunces + Hanken Grotesk) are loaded via the same Google Fonts `<link>`
tags in `index.html`, identical to the baseline `<head>`.

## File tree

```
react/
├── index.html              # Vite entry; Google Fonts <link>s preserved verbatim
├── package.json            # React + Vite; no UI/animation libraries
├── vite.config.js          # build/dev tooling only; cssMinify off
├── .gitignore              # node_modules/, dist/, Playwright output
├── .gitattributes          # parity PNGs marked binary
├── README.md
├── src/
│   ├── main.jsx            # imports styles.css once; mounts <App/> (no StrictMode)
│   ├── App.jsx             # shell: markup + boot() in a mount effect
│   ├── styles.css          # byte-identical copy of baseline styles.css
│   ├── lib/
│   │   ├── dom.js          # $, $$, wait, RM, GC
│   │   ├── state.js        # STEPS, state
│   │   ├── data.js         # all data constants (verbatim)
│   │   ├── logic.js        # pure functions (verbatim)
│   │   └── engine.js       # imperative renderers + sequences + boot()
│   └── screens/
│       ├── Intro.jsx  Profile.jsx  Discover.jsx  Blueprint.jsx
│       └── Forge.jsx  Sentinel.jsx Dashboard.jsx Grow.jsx
└── parity/                 # verification (see below)
    ├── run-parity.mjs      # visual parity: per-stage screenshot diffs
    ├── behavior-check.mjs  # behavioural parity: driven interactions
    ├── parity-summary.json # machine-readable result
    └── {baseline,react,diff}-<stage>.png   # inspectable evidence
```

## How to run

```bash
cd react
npm install
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build` (→ `dist/`, CSS un-minified so it stays a faithful
copy), `npm run preview` (serve the build).

## Verification

Fidelity is proven against the baseline, not by byte-identity. Both checks run
the **same** guided flow through the static baseline (served from the repo root)
and the React build, with `prefers-reduced-motion` emulated and `Math.random`
stubbed to a constant so both apps reach identical, settled states.

```bash
cd react
npm run build
npx playwright install chromium
npm run parity                  # visual: 8-stage screenshot diff
node parity/behavior-check.mjs  # behavioural: driven interaction compare
```

**Visual parity** (`run-parity.mjs`) drives Intro → Profile → Discover →
Blueprint → Forge → Sentinel → Studio/Grow → Dashboard at a fixed 1440-wide
viewport (deviceScaleFactor 1), runs each animated sequence to completion, and
pixel-diffs every stage. Screenshots + diff images are written to `parity/` so
the comparison is inspectable. Latest run — every stage well under the 0.20%
tolerance (residuals are sub-pixel text anti-aliasing):

| Stage | Max pixel diff | Result |
|-------|----------------|--------|
| 1 · Intro | 0.0000% | PASS |
| 2 · Profile | 0.0032% | PASS |
| 3 · Discover | 0.0040% | PASS |
| 4 · Blueprint | 0.0035% | PASS |
| 5 · Forge | 0.0000% | PASS |
| 6 · Sentinel | 0.0041% | PASS |
| 7 · Studio / Grow | 0.0000% | PASS |
| 8 · Dashboard | 0.0045% | PASS |

**Behavioural parity** (`behavior-check.mjs`) asserts the two apps produce
identical results for: keyboard nav (Enter starts; ←/→ move between steps), the
profile signature, opportunity scoring (fits `97%|88%|85%`), the Forge/Sentinel/
Studio sequences (security score `98`, AI rate `71%`), the dashboard recompute
(price slider → `$199`, growth pace, Evolver/Operator toggles, the live scenario
line), the back buttons, and the restart loop. Latest run: **PASS — identical**.

> Note: `parity/` keeps the browser **out** of version control — Playwright's
> Chromium lives in the global cache and `node_modules/` is git-ignored; only the
> harness scripts and the (small) screenshot/diff PNGs are committed.

## Fidelity

This React app is a **parallel implementation** whose fidelity is verified by
**visual parity** (the screenshot diffs in `parity/`) and behavioural parity —
**not** by the SHA-256 byte-identity that governs the static baseline on `main`.
The baseline and its `reference/` original are untouched; this port is additive.
