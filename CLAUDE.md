# Portfolio redesign sprint (read first)

We are implementing a finished redesign. The spec, the plan and every screen
are in `design/` — start with `design/HANDOFF.md`, look at `design/screens/`,
and read exact values from `design/source/**/*.dc.html`.

## Rules for this sprint
- Speed over polish. Commit after every working step with a clear message.
- The site must keep working after every phase; María Sol deploys per phase
  (pushing `main` deploys).
- Change only what the current phase asks. Don't invent visual treatments that
  aren't in the design, and don't remove existing ones that are.
- The layout in design/screens is fixed. When content changes (more or fewer
  items, longer text), adapt the data to the existing design; never redesign.
  If something can't fit without changing the design, ask María Sol first.
- Never apply a CSS transform to the Spline canvas — framing goes through the
  Spline camera / bot rig. Never add a WebGL context.
- Respect `prefers-reduced-motion` (no marquee, no auto-rotation/advance).
- Content: nothing employer-specific; "since 2022", never "5+ years".
- Verify on the rendered pixel: screenshots at 1440×900 and 390×844 (plus
  1280×720 / 1920×1080 in the final QA). Compare against `design/screens/`.
- If something risks the time budget (Spline framing, a tricky animation),
  ship the closest simple version in ≤ 1 h, mark it `TODO(polish)`, move on.
- Report at the end of each phase: what's done, what's left, anything to decide.

## Commits
- Format: `RNN: scope- Subject` — `R` = redesign, numbered from `R01`, e.g.
  `R02: content- Replace About text with the scene 4 copy`. Scopes: feat, fix,
  content, style, refactor, perf, test, docs, build, chore. Read
  `git log --oneline -5` to find the last number before committing.
- Commits up to `129:` (tag `v1`) are the first version; don't rewrite them.
- Sessions B and C number inside their own branch: `RB01`, `RB02`… and `RC01`,
  `RC02`…. The merge commit into `main` takes the next `R` number.
- No attribution trailers: no `Co-Authored-By`, no `Claude-Session`, no
  "Generated with Claude Code".

## Deploy
- Vercel project `msse-portfolio`, Root Directory `frontend`, Vite preset.
  Pushing `main` deploys to https://msse-portfolio.vercel.app.
- The AWS files (`infra/aws/`, the `deploy` job in CI) stay as they are: the
  job is skipped until AWS is set up after the sprint. Don't add a `vercel.json`.
- The backend (contact form) is not deployed yet; don't try to fix that now.

## This repo
- Package manager: **pnpm 9.15.9** (pinned). Use `pnpm` if it's on the PATH,
  otherwise `npx pnpm@9.15.9 …`. Never switch package managers or add a
  second lockfile.
- Environment: **Windows + PowerShell**. Write PowerShell commands, not bash.
- Line endings: follow `.gitattributes` (LF). Run the format check before
  committing; don't commit CRLF changes to files you didn't touch.
- Old notes live in `.notes/` (gitignored). `design/` replaces them where they
  disagree.
- `design_guidelines.json` (repo root) is an obsolete Emergent file (cyan,
  Orbitron). Ignore it; `design/` is the reference.

## Parallel sessions (git worktrees)
Three sessions may run at once: **A** in `msse-portfolio` (branch `main`),
**B** in `..\msse-projects` (branch `scene3-projects`), **C** in
`..\msse-human` (branch `scene4-5`).

**File ownership** — the animation core and shared files are hot spots, so:
- **Session A only** edits the shared files: `useHeroTimeline.ts`,
  `useHeroScenes.ts`, `ScrollScene.tsx`, `choreography.ts`, the runtime/quality
  code, `index.css`, `portfolioData.ts`, theme tokens, fonts, the menu/dock and
  the section index. All shared changes (tokens, fonts, Ø numbering) are made
  in P1, before B and C start.
- **Sessions B and C** work in their own section components and new files
  (their own CSS module / data file if needed). If they need a change in a
  shared file, they don't make it: they write a line starting with
  `NEEDS-A:` in their final report and keep going.

**Ports:**
- Session A: dev server on its default port (3000).
- Session B: dev server with `--port 3001 --strictPort`.
- Session C: dev server with `--port 3002 --strictPort`.
- Always read the actual URL from the dev server output before screenshotting.
- **E2E tests (Playwright, port 4173) only run in session A, after merging.**
  B and C never run them (they would collide on 4173 or test the wrong build).
