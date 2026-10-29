# MSGCENGINEER

Personal portfolio of María Sol Gosende Centurión — Full Stack Developer & AI Engineer.

A single-page site whose hero is a scroll-driven sequence: two Spline 3D scenes,
a light one and a dark one, crossfaded and choreographed on one pinned GSAP
timeline. Below it are the usual sections — about, projects, capabilities, and a
contact form backed by a small FastAPI service.

**Live:** _(not deployed yet)_

---

## Stack

**Frontend** — React 19 on Create React App with craco, Tailwind CSS, GSAP +
ScrollTrigger, Framer Motion, Lenis for smooth scrolling, `@splinetool/react-spline`
for the 3D scenes, and pnpm 9 as the package manager.

**Backend** — FastAPI with Pydantic validation and Motor (async MongoDB). It serves
exactly one endpoint that matters, `POST /api/contact`. The site renders without it.

---

## Architecture decisions

**One pinned GSAP timeline drives both Spline scenes.**
`ScrollScene.jsx` is a single `ScrollTrigger` with `pin: true`, `end: "+=1040%"` and
`scrub: 1`. Everything — the headline exit, the light draining to black, the crossfade
to the second scene, the four camera framings and the three feature cards — is a
position on that one timeline. The alternative, one trigger per beat, makes every
transition a seam where two triggers have to agree about what the scroll position
means; a single timeline has no seams and each beat is one number you can move.
Scene 2 is mounted lazily at 15% progress and scene 1 is paused past 45%, so only
one WebGL context is ever doing work.

**The gaze is `Head.rotation`, not a Spline look-at target.**
The scene ships no look-at target and no runtime variables (`getVariables()` returns
`{}`), but it does expose a named rig. The directed gaze writes `Head.rotation` in
radians straight onto the runtime instance from a `gsap.ticker`, eased, capped at
±0.35 rad. A `gazeLock` flag keeps the head welded to the timeline's pose through the
whole sequence and releases it on the closing beat, after which the cursor takes
priority for 1.2s at a time. Without the lock the two inputs fight and the head drifts
mid-beat.

**`ROBOT_DX` — scale-proportional centring compensation.**
The robot is not centred inside its own Spline scene: its body sits about 180px
(unscaled) right of the canvas centre, so `x: 0` centres the *canvas*, not the
*figure*. Measured off the rendered silhouette at two zoom levels, the offset scales
with the zoom (+258px at 1.35×, +208px at 1.15× → ~180px unscaled), so the correction
has to be proportional rather than a fixed nudge:

```js
const fx = (visualPx, scale) => `${((visualPx - ROBOT_DX * scale) / VW) * 100}%`;
```

Every framing then declares where the *body* should land, not where the canvas should
land. The connector anchors are derived once in robot space and re-projected against
the live scale on each tick, so they follow the body through the zoom instead of being
calibrated to one beat.

**Verification is by screenshot, not by reading the transform.**
The WebGL canvas cannot be read back (`preserveDrawingBuffer` is off, so `drawImage`
returns black), and the Spline scene animates its own pose over time — two captures
with an identical transform put the robot in slightly different places. Positions are
therefore checked by hiding the UI, screenshotting the bare silhouette in a headless
browser and measuring the luminance bounding box. Residual error is ±35px and is not
removable from CSS.

**Contact form: honeypot plus an in-memory per-IP rate limit.**
The form carries a hidden `website` field; if it is filled the API returns success and
stores nothing, so a bot gets no signal that it was caught. Submissions are then capped
at 5 per IP per 10-minute sliding window. **The limiter is a process-local dict**: it
resets on restart and does not hold across replicas, which is honest for a single small
instance and would need Redis or the reverse proxy the moment this scales past one.

**pnpm, not npm or yarn.**
`pnpm.overrides` in `package.json` pins around 40 transitive security patches, plus
`eslint` 8.57.1: Create React App lints with eslint 8, and pnpm would otherwise hand its
webpack plugin a newer major. The version is pinned in `packageManager`, so `corepack`
or `npx pnpm@9.15.9` gives the same pnpm everywhere.

---

## Key files

| Path | What it is |
|---|---|
| `frontend/src/data/portfolioData.js` | All editable content — copy, projects, tags, Spline scene URLs. Single source of truth. |
| `frontend/src/components/ScrollScene.jsx` | The pinned hero: state, the GSAP timeline, the gaze rig and the theme swap. Still the one complex file. |
| `frontend/src/components/scroll-scene/` | The hero's presentational pieces (feature cards, connectors, rail, story panel, loader) and `useCalloutsAboveDock`. |
| `frontend/src/components/spline/` | `SceneBoundary` (one failed scene never takes the page down) and `ReleasingBox` (GPU context release). |
| `frontend/src/lib/spline/` | Spline helpers: camera framing and pinning, runtime patches, the robot rig, scene URLs per theme, theme-swap timing. |
| `frontend/src/components/` | The flat sections: About, Projects, Capabilities, Contact, Footer, NavigationDock, RotateLock. |
| `frontend/src/lib/motion.js` | Shared entrance motion: easing, `fadeUpVariants`, `revealOnView`, the hero's line reveal. |
| `frontend/src/hooks/` | `useLenis` (smooth scroll, `scrollToTop`), `useTheme`, `useMediaQuery`, `useTitleTicker`. |
| `frontend/src/index.css` | Theme tokens, font imports and the few rules Tailwind cannot express. |
| `frontend/craco.config.js` | The `@` → `src` alias, lint rules and the webpack-dev-server 5 adapter. |
| `backend/server.py` | The whole API: one contact endpoint, validation, honeypot, rate limit. |

### Draft projects

Entries in `projects` marked `draft: true` render in development with a DRAFT badge
and are stripped from the production build by `getProjects()`, which also re-lays out
the survivors on the 12-column grid. Placeholder copy therefore never reaches a
deployed site. Rewrite the copy, drop the flag.

---

## Running locally

**Frontend** — this is all you need for anything visual:

```bash
cd frontend
pnpm install
pnpm start          # http://localhost:3000
```

Production build:

```bash
pnpm build
npx serve -s build
```

**Backend** — only for the contact form, and it needs a MongoDB instance:

```bash
cd backend
python -m venv .venv
.venv/Scripts/Activate.ps1      # PowerShell; use source .venv/bin/activate on Unix
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Environment

Neither file is versioned.

| File | Keys |
|---|---|
| `frontend/.env` | `REACT_APP_BACKEND_URL` |
| `backend/.env` | `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS` |
