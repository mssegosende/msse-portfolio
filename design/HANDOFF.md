# Portfolio redesign — HANDOFF (fast track, ~12 h)

**This is the source of truth.** Everything lives in the `design/` folder:

- `design/screens/{desktop,mobile}/{light,dark}/` — PNG of every screen,
  named `scene-<n>-<section>[-<step>].png` (e.g.
  `screens/desktop/light/scene-2-capabilities-02-card-2.png`). **Screenshots
  were rendered without the web fonts** — trust this doc for typography, the
  PNGs for layout.
- `design/source/{desktop,mobile}/{light,dark}/*.dc.html` — the mock's source
  for each screen, same names as the screenshots. Open them as
  text to read exact values (px, colors, gradients, clip-paths, timings). They
  are not runnable pages; ignore `{{...}}` template holes and `<sc-for>/<sc-if>`.
- `design/CARD-SPEC.md` — exact layers/colors/fonts of the black framed card.
- `design/assets/` — robot cut-outs used in the mock (reference only; the site
  keeps its Spline robot) and the grain texture.
- Live mock (for María Sol): https://claude.ai/artifact/NU4JKXMQByAqxPLe5Pw9dh

Any older handoff or context docs from previous sessions are superseded by this one.

## Rules for this sprint

(Also in `CLAUDE.md` at the repo root, which every session reads automatically.)

- **Speed over polish.** Bigger batches are OK. Commit after every working step.
- **Deploy after every phase** (P0, P1, P2…). The site must always work.
- If something risks blowing the time (Spline framing, an animation), ship the
  simplest version that looks like the mock and leave a `TODO(polish)`.
- Never apply a CSS transform to the Spline canvas; framing via camera/rig.
  No extra WebGL context. Respect `prefers-reduced-motion`.
- pnpm 9.15.9 only; Windows + PowerShell; repo-specific rules in `CLAUDE.md`.
- Content: nothing employer-specific; "since 2022", never "5+ years".
- Measure on screenshots: 1440×900, 1280×720, 1920×1080, mobile 390×844.

## How to run it in parallel

1. **Session A** (`msse-portfolio`, branch `main`) does P0 and P1 first — P1
   makes every change to the shared files (tokens, fonts, Ø numbering, menu,
   section index).
2. Then two more Claude Code sessions in separate worktrees:
   ```
   git worktree add ..\msse-projects -b scene3-projects
   git worktree add ..\msse-human -b scene4-5
   ```
   Each worktree needs its `.env` files copied and `npx pnpm@9.15.9 install`.
   - **Session A** keeps going with P2 (scenes 1–2, the pinned timeline).
   - **Session B** (`..\msse-projects`) does P3 (projects).
   - **Session C** (`..\msse-human`) does P4 (about + contact).
   File ownership and ports: see `CLAUDE.md` (B and C don't edit the shared
   animation/content/CSS files; they report `NEEDS-A:` instead).
3. Merge B and C into main, then session A does P5 (mobile) and P6 (dark +
   final QA + e2e).

---

## Shared spec (applies everywhere)

- **Monochrome.** Only color: the blue `#2E6FF2` STATUS dot (scene 1).
- **Section titles** (CAPABILITIES / PROJECTS / WHO / LET'S TALK sections):
  `Science Gothic`, weight 200, `font-stretch: 150%`, 64 px desktop / 34 px
  mobile, line-height ~1.05. Same position in every section: left 56 px,
  pill label above it, top ~52 px. Load:
  `https://fonts.googleapis.com/css2?family=Science+Gothic:wdth,wght@50..200,100..900`
  (fallback Michroma). Michroma stays for the MSSE wordmark, card numbers and
  project names.
- **Numbers with a slashed zero in front:** `Ø1 … Ø5`, steps `Ø2.1`, cards
  `Ø1 Ø2 Ø3`, projects `Ø3.1 … Ø3.4`. Visual only: `aria-label` keeps the plain
  number.
- **Section index (desktop, right edge):** the 5 sections always visible
  (Ø1 Hero · Ø2 Capabilities · Ø3 Projects · Ø4 About · Ø5 Contact); the
  active one opens its steps below it. Rajdhani, sections 15 px / steps 12 px,
  active white 600, rest 50 % white, `mix-blend-mode: difference` so it adapts
  to what's behind. Clickable. **Not on mobile.**
- **Background shadows** per section: the section gradient + a soft white glow
  behind the subject + vignette
  `radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(20,26,34,.26) 100%)`
  + soft ground shadow under cards. Background words (STACK, WORK, HUMAN,
  SIGNAL): Michroma, white→gray gradient text, soft drop shadow.
- **Menu (dock):** María Sol's current menu, unchanged on desktop (icons,
  DARK with folded corner, INITIATE black). Appears at the end of scene 2 and
  stays. Current section item marked. **Mobile:** compact — `MSSE://` +
  icon-only About / Projects / Capabilities + icon-only DARK + INITIATE.
- **Signature** ("MSSE:// · © 2026 María Sol Gosende · Software & AI
  engineer" floating bottom-left): **not used.** Only the scene 5 footer shows
  that text.
- **Cards:** the black framed card from mock C (graphite bezel, chamfered
  silhouette, dark inner panel, bottom tab `MSSE:// │ …`) — exact layers in
  `design/CARD-SPEC.md`.

---

## P0 · Urgent content (30 min) → deploy

- About/WHO: replace the current text with the scene 4 text below (no "5+
  years", no employers, no core-banking / LA platform / C# migration).
- Debug panel: already removed from the code in v1 (commit 108). The panel
  seen in production came from the old repo. Only check nothing debug-related
  renders, and remove the unused `[data-debug-wrapper]` rule in `index.css`.

## P1 · Shared pieces (1–1.5 h) → deploy

Science Gothic titles, Ø numbering, section index (desktop), background
shadows, dock check. Nothing else.

## P2 · Scenes 1–2, pinned timeline (3–4 h) → deploy

**Scene 1 (desktop):** background `#EEF1F4 → #C2C9D0 55% → #7D8893`.
- On load, fast (~2 s total): `MSSE` wordmark (Michroma ~22vw, white gradient
  fading down) as an **endless marquee** (`MSSE MSSE …`, ~46 s loop) → top bar
  `MSSE://` + `STATUS: ONLINE` + SKIP INTRO → robot fades in (opacity + blur
  on a wrapper, done by 2 s). Robot ≈ full width, head slightly cut at the top.
- Scroll steps: Ø1.1 intro video tile (mid-left) · Ø1.2 barcode + SYSTEM CHECK
  (bottom-left, frosted) · Ø1.3 "BUILD THE FUTURE / ONE SYSTEM AT A TIME"
  (top-right) + section index · then SCROLL indicator. Holds at the end.

**Scene 2 (desktop):** background dark top → light bottom
`#7D8893 → #C2C9D0 38% → #EEF1F4`. No `MSSE://`, no STATUS.
- Title CAPABILITIES / "WHAT THE CORE RUNS ON" (white + shadow), STACK behind.
- **Robot: the giant head the whole scene**, in front of the title, always
  moving (slow idle sway + mouse parallax). At 1440: render ≈ 2700 px wide,
  crown cut ≈ 9 % above the top edge, head centered at ≈ 58 % of the width.
- **Card:** vertical, ~324 × 463 at 1440, 110 px from the left, vertically
  centered between title and bottom. **One at a time**, each new one rises
  over the previous, which fades. Content:
  - Ø1 **AI ENGINEERING** — subtitle THE MIND, tab MIND: "The part that thinks. Models that read, reason and decide — LangGraph agents where every step has a typed contract and a defined way to fail, measured with evals." Chips: LangGraph, LangChain, RAG, Evals.
  - Ø2 **BACKEND** — THE NERVOUS SYSTEM, tab NERVES: "Unseen, it carries every signal. APIs are the nerves, services the organs, the database the memory — Python and FastAPI, the domain never tied to the framework." Chips: Python, FastAPI, PostgreSQL, Node.
  - Ø3 **FRONTEND** — THE BODY, tab BODY: "What you see and touch. HTML is the skeleton, CSS the skin, JavaScript the muscles that move it — React and TypeScript, with Zod at the boundaries." Chips: React, TypeScript, Next.js, Zod, GSAP.
  - Order: mind → nerves → body (as above) unless María Sol says otherwise.
- After Ø2.3: the dock appears; cards keep rotating every ~5 s, pause on
  hover/touch.

## P3 · Scene 3 projects (2–3 h, parallel) → deploy

Background `#EEF1F4 → #DCE1E6 60% → #C2C9D0`; pill SELECTED WORK + PROJECTS;
intro "Things I build to learn in public — each one a problem I wanted solved
properly, from the data model up to the interface."; WORK word top-right.
- **Desktop Ø3.1 featured:** wide card ≈ 1038 × 475 at 1440, centered. Left:
  tags, name (Michroma) + `Ø3.1`, status, text, chips. Right: 16:10 **GIF
  player** (looping mp4/GIF, PAUSE/PLAY, progress line, `NEXT · <name>`).
  Arcturus also shows `PR DIFF → AGENTS · RULES → RATING → < THRESHOLD · HUMAN`.
  When the GIF ends, the next project takes the featured spot (Arcturus →
  Ethos → Apsis → Polaris). Pause also on hover.
- **Desktop, keep scrolling:** row of 3 cards (≈ 330 × 514) for the other
  projects, appearing one per step. Media slot = **folder**: back panel with
  the GIF peeking out, front flap of dark frosted glass (`backdrop-filter:
  blur(14px)`) with a raised tab showing name + `Ø3.x · GIF`. Clicking a
  folder swaps that project into the featured spot.
- **Mobile:** a **carousel**, one project at a time in the featured format
  (GIF on top, text below), next card peeking from the right, counter
  `Ø3.1 / Ø3.4` + bars + `SWIPE →`; advances when the GIF ends or on swipe.
- Projects text: **`design/projects-copy.md` replaces every project above** —
  six projects (Blaze, Alphecca, Polaris, Lynx, Ethos, Marvel Characters);
  Arcturus and Apsis are out (no review-flow strip). Featured spot cycles all
  six; the folder row is a 3-up carousel with ‹ › arrows; mobile Ø3.1 / Ø3.6.

## P4 · Scenes 4–5 (1.5–2 h, parallel) → deploy

**Scene 4 · WHO** — background `#E1E6EA → #C2C9D0 60% → #7D8893`, HUMAN word.
- Title "THE HUMAN BEHIND THE MACHINE".
- Text: "I'm María Sol — a full stack developer and AI engineer in Buenos Aires. I came to code through a cousin who was sure I could do it, and a computer I wanted to understand down to the parts: I built my own PC in 2020, and I've been writing software professionally since 2022." / "Piano taught me the thing I use most: different logics share patterns. Once I see the pattern, a new language or framework stops being foreign — that's how I learn, and how I walk into a system I've never seen."
- "Shipping code since **2022**" (Michroma). Principles: CONTRACTS BEFORE CODE — "Typed schemas and validation at the edge aren't bureaucracy. They're what makes an agent's output something you can trust." · INTERFACES ARE THE PRODUCT — "Motion, latency and feedback are engineering decisions, not decoration." · HUMANS WHERE THEY MATTER — "Automate the routine, and design the exact point where a person should step in."
- Desktop: text left, 2022 + principles right; steps Ø4.1 text, Ø4.2 piano + 2022, Ø4.3 principles.
- Mobile: one column; 2022 smaller (~58 px) **right-aligned**; an accent bar (short thick block + thin line) between the text and the principles; principles numbered Ø1–Ø3; counter `Ø4.3 / Ø4.3`.

**Scene 5 · LET'S TALK** — background `#7D8893 → #C2C9D0 42% → #EEF1F4`, SIGNAL word.
- Pill OPEN CHANNEL, title LET'S TALK (white + shadow), "Tell me what you're building. I answer every message — and if you share your LinkedIn, I'll send you my CV.", "Remote · worldwide · GMT−3". **No GitHub / email pill buttons.**
- Terminal form card (name, email, company optional, linkedin for the CV, message, "Transmit message"), tab `MSSE:// │ Secure channel`. Labels on one line.
- Interactive grid (only here), bulging around the cursor.
- Footer: MSSE:// + "© 2026 María Sol Gosende / Software & AI engineer" left, GitHub + email icon buttons right, on both sides of the dock.

## P5 · Mobile pass (2–3 h) → deploy

- **Scene 1:** small `MSSE://` (size of STATUS) + STATUS pill top; robot a bit
  lower and shifted right so one arm shows (head fully visible, ~40 px from
  the top); **two big MSSE marquee rows** (~212 px, opposite directions)
  **behind** the robot; bottom, centered: `Ø1 / Ø5`, BUILD THE FUTURE / ONE
  SYSTEM AT A TIME, SCROLL, SKIP INTRO. **No video tile, no SYSTEM CHECK.**
- **Scene 2:** title on top; robot starts further back and to the side and
  **approaches** to a big head under the title; full-width card at the bottom,
  one at a time, counter `Ø2.1 / Ø2.3` + bars. Scroll changes the card (one per
  gesture); after the third it auto-rotates, **pauses while a finger is down**.
- Scenes 3–5: see P3/P4 mobile notes. No section index, no signature.

## P6 · Dark mode + final QA (1–2 h) → deploy

- Hero: sampled ramp `#121315 0%, #1A1D24 20%, #2C323E 40%, #424B58 50%, #5F6B7B 60%, #7F8B9C 70%, #98A4B2 80%, #ABB5B7 90%, #8C96A8 94%, #6B7789 100%`. Other sections: blue-black with steel-blue hazes. Silver robot. Cards: same graphite frame, **satin silver inner panel, dark text**; GIF player / folders stay dark. Dark dock with LIGHT. Mobile hero bottom text stays dark (it sits on the light horizon).
- QA at the 4 sizes: nothing overlaps (card vs head, cards vs title/menu), no
  text overflow, reduced motion works.

---

## Paste-ready prompts

**Session A — P0 + P1**
```
Commit first. Read CLAUDE.md and design/HANDOFF.md (look at design/screens too).
We have ~12 h total, so prioritize speed and commit after each working step.
Do P0 now (About text + debug leftovers check), commit, and tell
me when it's ready to deploy. Then do P1 (shared pieces, including every change
to the shared files listed in CLAUDE.md) and commit.
Screenshots at 1440×900 and 390×844 when done.
```

**Session A — P2** (after P1 is merged)
```
Commit first. Do P2 from design/HANDOFF.md: scenes 1 and 2 in the pinned
timeline. If the giant-head framing in Spline is slow to get right, ship the
closest framing you can in 1 h and leave TODO(polish). Commit per scene.
Screenshots of each step at 1440×900.
```

**Session B — P3** (in ..\msse-projects)
```
Commit first. Do P3 from design/HANDOFF.md (projects: featured card with
GIF player + auto-advance, folder row, mobile carousel). Use placeholder
looping media for now. Follow the file ownership and port rules in CLAUDE.md
(you are session B: port 3001, no e2e). Commit when done and report what's left.
```

**Session C — P4** (in ..\msse-human)
```
Commit first. Do P4 from design/HANDOFF.md (scene 4 WHO and scene 5
LET'S TALK, desktop + mobile notes). Follow the file ownership and port rules
in CLAUDE.md (you are session C: port 3002, no e2e). Commit when done.
```

**After merging B and C — P5 + P6**
```
Commit first. Merge scene3-projects and scene4-5 into main. Then do P5
(mobile pass) and P6 (dark mode + QA) from design/HANDOFF.md. Screenshots
at 1440×900, 1280×720, 1920×1080 and 390×844, light and dark. Run format
check, lint, build and the e2e tests. List anything not done.
```
