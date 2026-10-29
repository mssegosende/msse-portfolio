# msse

Personal portfolio of María Sol Gosende Centurión — Software & AI Engineer.

A single-page site whose hero is a scroll-driven sequence: a 3D robot built in
Spline, choreographed on one pinned GSAP timeline through a hero, a close-up and
three feature cards. Below it are the usual sections — about, projects,
capabilities, and a contact form backed by a small FastAPI service.

**Live:** _(not deployed yet)_

---

## Stack

**Frontend** — React 19 and TypeScript (strict) on Vite, Tailwind CSS, GSAP +
ScrollTrigger, Framer Motion, Lenis for smooth scrolling, and
`@splinetool/react-spline` for the 3D scenes. Vitest and Testing Library for unit
tests, Playwright for end-to-end tests. pnpm 9 as the package manager.

**Backend** — FastAPI with Pydantic validation and Motor (async MongoDB). It serves
exactly one endpoint that matters, `POST /api/contact`. The site renders without it.

---

## Architecture decisions

**One pinned GSAP timeline drives the whole hero.**
The hero is a single `ScrollTrigger` with `pin: true` and `scrub: 1`, `+=1040%` long
on desktop and `+=780%` on phones. The headline exit, the light draining to black, the
crossfade to chapter 2, the camera framings and the three feature cards are all
positions on that one timeline. One trigger per beat would make every transition a
seam where two triggers have to agree on what the scroll position means; with one
timeline, each beat is a single number. The choreography (beat times, framings,
gaze poses, connector anchors) is plain data in `scroll-scene/choreography.ts`,
separate from the code that plays it.

**One model per theme, and the theme decides how many scenes mount.**
There are two Spline files: a black robot for the light theme and a silver one for
the dark theme.

- _Desktop_ mounts both models in both layers (four scenes) with fixed keys. The theme
  only picks which one is visible, so a toggle never reloads or rebuilds anything. The
  ticker drives the hidden mounts too, so they are always in the current beat.
- _Phones_ mount only the theme's model, two scenes in total: with more, iOS kills the
  tab. Changing theme on a phone reloads the page (`lib/themeReload.ts`), because iOS
  never frees discarded Spline scenes and swapping them in place leaks until the tab
  dies. The new theme and the scroll position travel in `sessionStorage`; the position
  is stored as pin progress rather than pixels, since the viewport height on iOS
  changes between loads with the URL bar.

Beyond that, scenes stop rendering when nobody can see them. Chapter 2 mounts once the
hero has loaded but stays paused until just before the crossfade. The hero pauses past
45% of the sequence. Both pause while the hero is off screen. When a scene goes away,
its WebGL context is released explicitly (`releaseGlContext`): `dispose()` leaves it
alive until GC, and browsers cap live contexts.

**Framing is done by the camera, not by CSS.**
Scaling a canvas in CSS displays more pixels than it renders. On desktop, the wrapper
stays at a fixed scale and `lib/spline/camera.ts` applies zoom and pan through the
projection matrix's off-axis terms, re-applied inside `updateProjectionMatrix` so the
runtime's own recomputations (resize, intro) never undo it. Each scene file also ships
an intro that animates its camera; the cameras are pinned to fixed poses so framing
doesn't depend on the theme or on load time. The two files place and pose the robot
differently, so `lib/spline/rig.ts` normalizes its position and reapplies a canonical
arm pose every frame.

**The gaze is written, not looked at.**
The scenes have no look-at target and no runtime variables, but they expose a named
rig. In chapter 2 the timeline writes `Head.rotation` directly, eased on the GSAP
ticker. On the desktop hero the head follows the cursor, also written by the site:
Spline's own look-at only hears the visible canvas, so the hidden mount's head would
drift.

**Runtime patches for phones and non-Chromium browsers.**
`lib/spline/runtime.ts` patches two private methods of the Spline runtime, once,
before any scene mounts:

- Phones cap the device pixel ratio at 2. The scene files ask for the full ratio, and
  at DPR 3 every buffer was huge.
- Phones and non-Chromium desktop browsers are forced onto WebGL. On phones, WebGPU's
  pipeline caches retain every discarded scene; in Safari, WebGPU doesn't render the
  robot's eyes (a video texture). Chromium keeps WebGPU.

Both patches are private API: if the runtime changes, they silently do nothing, which
is why the runtime version is pinned.

**Failure never takes the page down.**
`react-spline` rethrows load failures from render, so every mount sits in a
`SceneBoundary`. If the hero doesn't load in time, the page reveals without it. If
chapter 2 fails, a static render (`public/robot-alpha.png`) takes its place; on
desktop, if one model fails, the other one shows in both themes.

**Portrait only on phones and tablets.**
A browser tab cannot lock orientation, so `RotateLock` covers the page in landscape,
in pure CSS from the first paint; `manifest.json` pins portrait for installed apps. A
phone held sideways stays on the phone layout (`lib/layout.ts`): switching it to the
desktop layout would mount four scenes.

**Contact form: honeypot plus an in-memory per-IP rate limit.**
The form carries a hidden `website` field; if it is filled the API returns success and
stores nothing, so a bot gets no signal that it was caught. Submissions are then capped
at 5 per IP per 10-minute sliding window. The limiter is a process-local dict: it
resets on restart and does not hold across replicas. That is fine for a single small
instance and would need Redis or the reverse proxy past one.

---

## Key files

| Path                                      | What it is                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/data/portfolioData.ts`      | All editable content — copy, projects, tags, Spline scene URLs.                                                                                                                                                                                                        |
| `frontend/src/components/ScrollScene.tsx` | The pinned hero: wires the hooks below into the markup.                                                                                                                                                                                                                |
| `frontend/src/components/scroll-scene/`   | The hero's pieces: `choreography.ts` (the sequence as data), `useHeroScenes` (which scene mounts where, loading, failure, GPU release), `useHeroTimeline` (the GSAP timeline and ticker), and the presentational parts (cards, connectors, rail, story panel, loader). |
| `frontend/src/components/spline/`         | `SceneBoundary` (one failed scene never takes the page down) and `ReleasingBox` (GPU context release on unmount).                                                                                                                                                      |
| `frontend/src/lib/spline/`                | Camera framing and pinning, runtime patches, the robot rig, scene URLs per theme.                                                                                                                                                                                      |
| `frontend/src/lib/themeReload.ts`         | The phone theme reload and the position it carries.                                                                                                                                                                                                                    |
| `frontend/src/components/`                | The flat sections: About, Projects, Capabilities, Contact, Footer, NavigationDock, RotateLock.                                                                                                                                                                         |
| `frontend/src/hooks/`                     | `useLenis`, `useTheme`, `useMediaQuery`, `useTitleTicker`.                                                                                                                                                                                                             |
| `frontend/src/index.css`                  | Theme tokens, fonts, and the few rules Tailwind cannot express.                                                                                                                                                                                                        |
| `frontend/e2e/`                           | Playwright specs.                                                                                                                                                                                                                                                      |
| `frontend/scripts/`                       | Regenerates chapter 2's static fallback (see below).                                                                                                                                                                                                                   |
| `backend/server.py`                       | The whole API: one contact endpoint, validation, honeypot, rate limit.                                                                                                                                                                                                 |

### Draft projects

Entries in `projects` marked `draft: true` render in development with a DRAFT badge
and are stripped from the production build by `getProjects()`, which also re-lays out
the rest on the 12-column grid. Placeholder copy therefore never reaches a deployed
site. Rewrite the copy, drop the flag.

---

## Running locally

**Frontend** — all you need for anything visual. Needs Node 22; pnpm's version is
pinned in `packageManager`, so `corepack enable` or `npx pnpm@9.15.9` gives the same
one everywhere.

```bash
cd frontend
pnpm install
pnpm dev            # http://localhost:3000
```

| Command                             | What it does                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm build`                        | Type-checks, then builds to `dist/`.                                             |
| `pnpm preview`                      | Serves the build.                                                                |
| `pnpm lint`                         | ESLint.                                                                          |
| `pnpm typecheck`                    | `tsc` over the app and over the e2e specs.                                       |
| `pnpm format` / `pnpm format:check` | Prettier.                                                                        |
| `pnpm test`                         | Unit tests (Vitest). `pnpm test:watch` keeps them running.                       |
| `pnpm test:coverage`                | Unit tests with a coverage report: a table in the terminal, HTML in `coverage/`. |
| `pnpm test:e2e`                     | End-to-end tests (Playwright). Run `pnpm build` first.                           |

**Backend** — only for the contact form, and it needs a MongoDB instance:

```bash
cd backend
python -m venv .venv
.venv/Scripts/Activate.ps1      # PowerShell; use source .venv/bin/activate on Unix
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### Environment

Neither file is versioned; `frontend/.env.example` lists the frontend keys.

| File            | Keys                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| `frontend/.env` | `VITE_BACKEND_URL` — the contact service's base URL. Read at build time, so on Vercel it is a build variable. |
| `backend/.env`  | `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`                                                                        |

---

## Tests

**Unit tests** (`src/**/*.test.ts(x)`, jsdom) cover the logic that's easy to break
without noticing: the phone theme reload and its saved position, the camera
projection, the choreography's framings, the project grid and draft stripping,
`useMediaQuery`, and the contact form against 2xx, 429, 5xx, network failure and
validation. `src/test/` provides a controllable `matchMedia` and an
`IntersectionObserver` stub.

`pnpm test:coverage` reports coverage for all of `src/`. Expect it low overall: the
scenes, the timeline and the sections are covered by the e2e suite, not here.

**End-to-end tests** (`e2e/`) run against the production build. The layout specs block
the Spline CDN, so they are deterministic: the feature cards at the closing beat
across viewports, the cards clearing the dock on phones, navigation, the theme toggle
on each layout and the rotate lock. `scenes.spec` loads the real scenes and checks
that desktop mounts all four and phones never more than two.

Playwright uses its own Chromium (`pnpm exec playwright install chromium`). To use a
Chromium already installed instead (Chrome, Brave, Edge), point `PW_CHROMIUM_PATH` at
its executable.

**CI** (`.github/workflows/ci.yml`) runs lint, typecheck, format check, unit tests
with coverage (uploaded as an artifact), build and the e2e suite on every push to `main` and every pull request.

### Regenerating the static fallback

```bash
cd frontend
node scripts/capture-robot.mjs <scene-url>   # renders the scene alone to scripts/robot-full.png
python scripts/make-alpha.py                 # keys out the background into public/robot-alpha.png
```

The capture waits 45 s for the scene's intro to finish. `make-alpha.py` needs numpy
and Pillow.
