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
  nodes, …). For the **imperative-island** screens, containers the engine fills
  (e.g. `#questions`, `#checks`, `#archSvg`, `#tiles`) are rendered **empty**:
  React mounts the container, the ported engine owns its inner DOM — they never
  fight over the same subtree. **Blueprint and Discover are the exception** — they
  render their content declaratively from `lib/` (see
  [Architecture: declarative screens + imperative islands](#architecture-declarative-screens--imperative-islands)).
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

## Architecture: declarative screens + imperative islands

**This split is the intended, final architecture — not an incomplete migration.**
We deliberately stop here: the screens that benefit from declarative React are
declarative, and the screens whose value is timed animation stay as imperative
islands. Both halves are held to the same parity bar.

- **Declarative (React JSX): `Blueprint`, `Discover`.** These render their content
  from pure functions in `lib/` — `blueprintModel(state)` and `computeOpps(state)`
  (the opportunity scoring, extracted verbatim and proven byte-identical). The
  component subscribes via `lib/bridge.js` and renders the current shared `state`
  when the engine enters the screen. Discover keeps its card behaviours (fit%
  count-up, entry stagger, hover tilt — `lib/anim.js`) as a small entry effect, so
  motion and `prefers-reduced-motion` handling are unchanged.

- **Imperative islands (by design):** the **Profile** radar, the **Forge** build
  sequence (log + architecture diagram), the **Sentinel** dial / security audit,
  the **Dashboard** live charts + economic model, the **Grow / Studio** GEO ramp,
  and the **canvas** constellation background. These are kept imperative on
  purpose: their value *is* the hand-tuned timed animation (`await wait(ms)`
  sequences, `requestAnimationFrame` loops, manual SVG path math). An idiomatic
  React rewrite would risk visual/timing parity for **no user-visible benefit** —
  so the ported engine continues to own those subtrees.

- **`lib/bridge.js` is the seam.** `subscribeScreen(key, fn)` / `notifyScreen(key)`
  let a single screen be migrated to declarative React **in isolation**: navigation
  stays imperative (the engine still owns `.on` toggling and the shared `state`),
  and on entry the engine calls `notifyScreen(...)` so exactly one renderer — React
  *or* the engine — writes that screen's DOM subtree. No double-writing, no
  conflict, no big-bang rewrite.

- **Fidelity model.** `styles.css` is **byte-identical** to the baseline (blob
  `83fa9618…`). Equivalence is enforced by **visual + reflow + behavioural parity**
  across **7 viewports × 8 stages** (`parity/parity-summary.json`), re-run on every
  change. See [Verification](#verification).

### Migrating another screen later (optional)

The architecture is stable as-is; no further migration is required. If you ever
choose to migrate one of the islands:

1. Branch off `main`.
2. Use the **bridge pattern**: extract that screen's data derivation into a pure
   function in `lib/` (don't reword/recompute — verify byte-identical output),
   render it declaratively, and `subscribeScreen`/`notifyScreen` on entry. Remove
   only that screen's imperative rendering from `engine.js`.
3. **Keep the animated parts as island effects** (reuse the engine's helpers in a
   `useEffect`) rather than reimplementing motion as React state.
4. It **must pass `npm run parity` and `node parity/behavior-check.mjs`** (every
   stage × viewport `< 0.20%`, reflow `match`, behaviour identical) before merge.

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
│   │   ├── logic.js        # pure fns + blueprintModel() / computeOpps() derivations
│   │   ├── bridge.js       # subscribeScreen/notifyScreen — engine→React seam
│   │   ├── anim.js         # Discover card helpers (countUp/enterCards/attachTilt)
│   │   └── engine.js       # imperative renderers + sequences + boot()
│   └── screens/
│       ├── Intro.jsx  Profile.jsx  Discover.jsx*  Blueprint.jsx*   (* = declarative)
│       └── Forge.jsx  Sentinel.jsx Dashboard.jsx Grow.jsx          (imperative islands)
└── parity/                 # verification (see below)
    ├── run-parity.mjs      # responsive visual parity: 7 viewports × 8 stages
    ├── behavior-check.mjs  # behavioural parity: driven interactions
    ├── parity-summary.json # committed result (per-viewport → per-stage + reflow)
    └── {baseline,react,diff}-<width>-<stage>.png   # regenerable, git-ignored
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

**Responsive visual parity** (`run-parity.mjs`) drives Intro → Profile →
Discover → Blueprint → Forge → Sentinel → Studio/Grow → Dashboard and pixel-diffs
every stage at **seven viewport widths** that straddle every CSS breakpoint
(`styles.css` has `min-width` breakpoints at **560 / 700 / 720 / 760 / 820 px**).
Each width is a fixed *tall* viewport (deviceScaleFactor 1) — never `fullPage`,
which would resize mid-capture and re-rasterize the backdrop-filter panels +
canvas into noise. Latest run — **every stage at every width passes** the 0.20%
tolerance (max cell 0.0067%; residuals are sub-pixel text anti-aliasing):

| width | band | In | Pr | Di | Bp | Fo | Se | Gr | Da |
|------:|------|---:|---:|---:|---:|---:|---:|---:|---:|
| **375**  | mobile (<560)     | 0 | 0 | 0 | 0 | 0.0067 | 0 | 0 | 0 |
| **600**  | 560–699           | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **710**  | 700–719           | 0 | 0 | 0 | 0 | 0 | 0.0011 | 0 | 0.0002 |
| **740**  | 720–759           | 0 | 0 | 0 | 0 | 0.0030 | 0 | 0 | 0 |
| **768**  | tablet (760–819)  | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1024** | small-lap (≥820)  | 0 | 0.0032 | 0 | 0 | 0 | 0 | 0 | 0 |
| **1440** | desktop (≥820)    | 0 | 0 | 0.0003 | 0 | 0 | 0 | 0 | 0 |

(values are max pixel-diff %; `0` = 0.0000%. Stages: In·tro Pr·ofile Di·scover
Bp·blueprint Fo·rge Se·ntinel Gr·ow Da·shboard.)

The harness also proves the breakpoints genuinely fire — at each width it records
`grid-template-columns` track counts and confirms they're **identical between
baseline and React**, and that the layout truly reflows mobile→desktop (not "same
because nothing moved"):

| element | 375px (mobile) | 1440px (desktop) |
|---------|:--------------:|:----------------:|
| `#opps` (discover) | 1 col | 3 cols |
| `.gp2` (profile)   | 1 col | 2 cols |
| `#tiles` (dashboard) | 2 cols | 4 cols |
| `#ustats` (dashboard) | 2 cols | 4 cols |
| `#bpGrid` (blueprint) | 2 cols | 3 cols |

**Behavioural parity** (`behavior-check.mjs`) asserts the two apps produce
identical results for: keyboard nav (Enter starts; ←/→ move between steps), the
profile signature, opportunity scoring (fits `97%|88%|85%`), the Forge/Sentinel/
Studio sequences (security score `98`, AI rate `71%`), the dashboard recompute
(price slider → `$199`, growth pace, Evolver/Operator toggles, the live scenario
line), the back buttons, and the restart loop. Latest run: **PASS — identical**.

> Note on evidence: at 7 viewports × 8 stages the screenshot set is ~30 MB, so the
> PNGs are **git-ignored** (regenerable via `npm run parity`); the committed proof
> is `parity/parity-summary.json` (per-viewport → per-stage max-diff % + the
> reflow track counts). Playwright's Chromium lives in the global cache and
> `node_modules/` is git-ignored too.

## Fidelity

This React app is a **parallel implementation** whose fidelity is verified by
**visual parity** (the screenshot diffs in `parity/`) and behavioural parity —
**not** by the SHA-256 byte-identity that governs the static baseline on `main`.
The baseline and its `reference/` original are untouched; this port is additive.
