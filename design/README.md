# design/ — portfolio redesign package

Everything Claude Code needs to build the new portfolio, in one folder.

| Path | What it is |
|---|---|
| `HANDOFF.md` | **The spec + the plan.** Phases P0–P6, every measurement, text and color, and paste-ready prompts. |
| `CARD-SPEC.md` | Exact layers / colors / fonts of the black framed card. |
| `screens/desktop/light/` · `screens/desktop/dark/` | Every desktop screen (1440×900), named `scene-<n>-<section>[-<step>].png`. |
| `screens/mobile/light/` · `screens/mobile/dark/` | Every mobile screen (390 px wide), same naming. |
| `source/{desktop,mobile}/{light,dark}/` | The mock's source per screen, same names — read as text for exact values. Not runnable. |
| `assets/` | Robot cut-outs used in the mock (reference only — the site keeps its Spline robot) + grain texture. |

Screenshots were rendered without the web fonts (Science Gothic, Michroma,
Rajdhani, Inter, JetBrains Mono). Use `HANDOFF.md` for typography and the PNGs
for layout, spacing and hierarchy.

## Mock board ↔ package file

The live mock's boards use the same structure: `<Device> · <Theme> · Scene <n> — <Section>`.

| Mock board | Package name |
|---|---|
| Desktop · Light/Dark · Scene 1 — Hero sequence | `scene-1-hero` |
| Desktop · Light/Dark · Scene 2 — Capabilities: head + cards | `scene-2-capabilities` |
| Desktop · Light/Dark · Scene 3a — Projects: featured project | `scene-3-projects-featured` |
| Desktop · Light/Dark · Scene 3b — Projects: folder row | `scene-3-projects-folder-row` |
| Desktop · Light/Dark · Scene 4 — About | `scene-4-about` |
| Desktop · Light/Dark · Scene 5 — Contact | `scene-5-contact` |
| Mobile · Light/Dark · Scene 1 — Hero | `scene-1-hero` |
| Mobile · Light/Dark · Scene 2 — Capabilities | `scene-2-capabilities` |
| Mobile · Light/Dark · Scene 3 — Projects carousel | `scene-3-projects-carousel` |
| Mobile · Light/Dark · Scene 4 — About | `scene-4-about` |
| Mobile · Light/Dark · Scene 5 — Contact | `scene-5-contact` |

Boards titled `Archive · …` and `Reference · …` are earlier explorations — not part of the build.
