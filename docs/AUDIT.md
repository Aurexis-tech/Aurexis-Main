# Aurexis React prototype — UX/QA audit (read-only)

**Audited build:** branch `feature/backend-foundation` @ `7f7b894`, the React/Vite
app under `./react/`. This branch's `react/` prototype is **identical to the
merged product on `main`** (`v2.1-react-screens`): Blueprint and Discover are the
declarative JSX migrations; the only `react/` differences from `main` are the
dev-only `dev-check.html`/`dev-check.jsx` and the `/api` proxy in
`vite.config.js`, none of which touch the prototype screens. So this is a faithful
audit of the live product.

**Dev server:** Vite on **http://localhost:5180** (`npm run dev -- --port 5180`).
**Method:** real Chromium (Playwright), **real animations (no reduced-motion)**,
full flow Intro → Profile → Discover → Blueprint → Forge → Sentinel → Studio/Grow
→ Dashboard at 1440×900, then key screens at 375×812; every interactive control
exercised; console + page errors captured throughout. Backend/`/api`/dev-check
were **out of scope** (no backend in this pass, as expected).
**Read-only:** no code changed, nothing committed. `git status` was clean before
and after.

## Severity summary

| Severity | Count | IDs |
|----------|------:|-----|
| BLOCKER  | 0 | — |
| MAJOR    | 0 | — |
| MINOR    | 1 | AUD-01 (✅ RESOLVED) |
| **Total real defects** | **1** (0 open) | |

Plus 4 *notes* (intentional behaviour / coverage caveats) that are **not** defects
— listed at the end so they aren't mistaken for bugs.

**Headline:** the app is in very good shape. **0 console errors/warnings, 0
uncaught page errors** across the entire flow. Every screen renders, every primary
control works, all three run-sequences (Forge/Sentinel/Studio) complete, the
dashboard recomputes live, and global navigation (stepper jump, keyboard arrows,
back, restart) all behave correctly.

---

## Findings by screen

### Intro — PASS
Begin CTA present and works (hides the overlay); 3 intro chips render (decorative,
not interactive — correct); emblem/heading animate. No issues. *(01-intro.png)*

### Profile — PASS
- Advance (`#toDiscover`) correctly **disabled** until complete.
- All 5 questions answerable; selecting builds a live signature: label
  `Bold Builder`, description `Fast & iterative · SaaS tools · Full-time.
  Strengths: Build & Vision.`, 5-trait list, and the **radar polygon updates**
  (points move off the collapsed centre). *(02/03-profile-*.png)*
- The 3 self-generated follow-ups appear after a short "analysing" beat and gate
  the advance; once answered, the insight line renders and `#toDiscover` enables.
- **Re-answering works:** changing Risk → All-in updated the label to
  `All-in Builder` live and kept the advance correctly enabled.

### Discover — PASS
- 3 opportunity cards render with fit-% **count-up** completing (e.g. `97% / 89% /
  86%`), titles, score-breakdown bars, build tags. *(04-discover.png)*
- Advance (`#toBlueprint`) disabled until a card is selected.
- **Selection + re-selection correct:** selecting card 1 highlights it
  (`opp sel gborder`); selecting card 0 then clears card 1 and highlights card 0;
  advance enables. *(05-discover-selected.png)*

### Blueprint — PASS
Chosen opp name (`Inbox Triage Copilot`), 6 summary items, and the flow line all
render from the chosen state; advance works. *(06-blueprint.png)*

### Forge — PASS (functionally) · see AUD-01 for mobile layout
Run sequence completes end-to-end: 5 products → all "done ✓", architecture diagram
drawn, build log fills (11 lines), progress bar reaches **100%**, capability
ladder V1–V7. Run button correctly disables during/after the run; advance enables
on completion. *(07-forge-done.png)*

### Sentinel — PASS
Run completes: all 8 audit checks turn green, score dial reaches **98**, the
"Sentinel Verified" seal shows; advance enables. *(08-sentinel-done.png)*

### Studio / Grow — PASS
Run completes: 5 GEO rows, all 6 channels light up, recommendation gauge animates
to **71%**, the "after" answer types in, final seal shows; advance enables.
*(09-grow-done.png)*

### Dashboard — PASS
- 4 hero tiles, 8 unit-economics stats, scenario line, and **both charts render**
  (revenue + users, area+line paths present). *(10-dashboard.png)*
- **Live recompute confirmed:** price slider → `$199` updates the price label and
  the tiles; Growth pace → Aggressive updates the scenario line; Evolver/Operator
  toggles change the unit-economics. *(11-dashboard-modified.png)*
- Confetti burst on entry is the intentional celebration animation (transient).

### Global navigation — PASS
- **Stepper rail:** 7 nodes; reached nodes are clickable and **jumping works**
  (clicked Profile node → Profile shown). *(12-stepper-jump-profile.png)*
- **Keyboard:** ArrowRight advances (Profile → Discover), ArrowLeft goes back
  (Discover → Profile). Back navigation therefore confirmed working.
- **Restart ("Run the loop again"):** fully resets — returns to Profile, label
  back to "Answer to begin…", advance re-disabled, all answer selections cleared.
  *(13-after-restart.png)*

### Responsive — mostly PASS, one defect
At 375 px: Intro, Profile, Discover, Dashboard all fit (no horizontal overflow);
grids reflow correctly (opps → 1 column, tiles → 2 columns); the stepper rail fits
within its own scroll container. **Forge overflows — see AUD-01.**

---

## Defects

### AUD-01 — Forge — Capability ladder overflows horizontally on mobile
- **Severity:** MINOR (cosmetic/layout; functionality unaffected)
- **Repro:** Open the app at a 375 px-wide viewport, reach the Forge screen.
- **Observed:** the page is ~**416 px wide at a 375 px viewport** (≈41 px
  horizontal overflow → a horizontal scrollbar). The "FORGE CAPABILITY LADDER" row
  (`.vsteps`, 7 items V1–V7) does not wrap or shrink: **V6 is clipped and V7 is
  pushed off-screen** to the right.
- **Expected:** no horizontal overflow at mobile width; the 7 ladder steps should
  wrap, scroll within their own container, or shrink to fit.
- **Evidence:** `m05-forge.png` (V6 clipped, V7 off-screen); measured
  `mobile_forge_overflow = { scrollWidth: 416, clientWidth: 375 }`. All other
  audited screens measured `scrollWidth == clientWidth == 375`.
- **Likely cause (not fixed):** `.vsteps { display:flex }` with `.vstep { flex:1 }`
  but 7 items + inter-item gaps + non-wrapping labels exceed 375 px, and there's
  no `flex-wrap`/overflow container at narrow widths (the other multi-item rows on
  the page either wrap or have their own `overflow:auto`). Note: this is inherent
  to the prototype's layout — it is present in the original static baseline too
  (visual-parity passed precisely because baseline and React overflow identically),
  so it is a **pre-existing responsive limitation**, not a regression from the
  React port.
- **Status:** ✅ **RESOLVED** on branch `fix/aud-01-forge-ladder-mobile` — added
  `overflow-x:auto` to `.vsteps` (one CSS property): the 7 ladder steps now scroll
  inside the card at narrow widths. Verified mobile page width **416 → 375** (no
  page overflow), all V1–V7 reachable in-card, desktop **unchanged** (single row,
  identical metrics), no collateral shift on Dashboard/Discover.

---

## Notes — intentional behaviour / coverage caveats (NOT defects)

- **N1 · Simulated/illustrative data (by design).** Opportunity fit %, market
  sizes, financials, security score (98), and GEO rate (71%) are illustrative
  (the page footer says "figures are illustrative"). The fit numbers vary slightly
  run-to-run (97/89/86 here) due to a small intentional `Math.random` jitter in
  scoring. Simulated ≠ broken.
- **N2 · Run buttons are single-shot (acceptable).** After a stage's run
  completes, its "Run …" button stays disabled. Re-entering the stage via its
  forward button re-enables it; jumping back via the **stepper rail** shows the
  completed state with the run disabled (the rail navigates without re-init). This
  is recoverable and reads as "already built", not a dead end — flagged only for
  awareness, not as a defect.
- **N3 · Coverage caveats (honest disclosure).** (a) Enter-on-Intro was not
  separately exercised — the walk used the Begin click; the keydown handler for it
  is present and the same handler's Arrow keys were verified working. (b) The
  opportunity-card hover-tilt effect was not exercised (no pointer hover in the
  automated walk); it is a cosmetic effect only. (c) One automated step
  ("click Discover's Back button directly") logged a timeout — this was a
  **test-sequencing artifact** (the script had already navigated to Profile via
  ArrowLeft, so Discover's hidden Back button wasn't clickable); back navigation
  itself is confirmed working (ArrowLeft → Discover→Profile).
- **N4 · No backend this pass (expected).** `/api` and `/dev-check` were out of
  scope; the prototype makes no network calls and showed no related errors.

---

## Evidence locations

- **Screenshots (19):** `C:\Users\nidhi\AppData\Local\Temp\aurexis-audit\`
  - Desktop: `01-intro` … `13-after-restart.png`
  - Mobile: `m01-intro` … `m06-dashboard.png`
- **Raw observations + console capture:**
  `C:\Users\nidhi\AppData\Local\Temp\aurexis-audit\result.json`
  (`console_msgs: []`, `page_errors: []`).
- **Console/page errors during the entire walk:** none.

*Audit performed read-only. No code was changed and nothing was committed; this
`docs/AUDIT.md` is the only file written and is left uncommitted for review.*
