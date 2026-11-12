# CRT / HUD redesign — phosphor blue (spec for Claude Code)

María Sol approved a new visual direction for the whole site: a CRT / HUD look
in phosphor blue, with a light version of the same blue. This spec replaces the
"strict monochrome" and "graphite bezel card" rules in `design/` wherever they
disagree. Everything in `CLAUDE.md` still applies (commits `RNN:`, pnpm,
PowerShell, never a CSS transform on the Spline canvas, never a new WebGL
context, `prefers-reduced-motion`, verify on rendered pixels at 1440×900 and
390×844).

## What is in this folder

| Path | What |
|---|---|
| `design-source/*.dc.html` | The approved design, one file per section and theme. Read exact values (colors, sizes, spacing, copy) from here. Image `src="/_blob/…"` values are placeholders: see `assets/README.md` for which file each one is. |
| `design-source/canvas.json` | Layout of the design canvas (which file is which section). |
| `assets/` | Processed images: robot treatments, María Sol's portrait, project stills, the palette ramp. |

Section ↔ file:

| Section | Desktop dark | Desktop light | Mobile dark | Mobile light |
|---|---|---|---|---|
| Scene 1 (hero) | `Hero.dc.html` | `HeroLight.dc.html` | `HeroM.dc.html` | `HeroMLight.dc.html` |
| Scene 1, ASCII robot variant (not chosen yet) | `HeroAscii.dc.html` | – | – | – |
| Scene 2 (capabilities) | `Main.dc.html` | `MainLight.dc.html` | `Mobile.dc.html` | `MobileLight.dc.html` |
| Capability card options | `Cards.dc.html` (option A "Dossier" is the one in use) | | | |
| Projects | `Projects.dc.html` | `ProjectsLight.dc.html` | `ProjectsM.dc.html` | `ProjectsMLight.dc.html` |
| About | `About.dc.html` | `AboutLight.dc.html` | `AboutM.dc.html` | `AboutMLight.dc.html` |
| Contact + footer | `Contact.dc.html` | `ContactLight.dc.html` | `ContactM.dc.html` | `ContactMLight.dc.html` |
| Tokens / type / effects sheet | `System.dc.html` | | | |
| Menu (dock) + section index | `Menu.dc.html` (both themes, desktop + mobile) | | | |

The `Full*.dc.html` / `MobileFull*.dc.html` files only stack the sections to
show the whole page; they hold no design of their own.

---

## 1. Tokens

### Dark (phosphor blue, sampled from María Sol's portrait)

The dark blues were remapped to the portrait's palette so the whole site is one
blue. Use these, not the older `#CFE8FF`-family values you may see in old notes.

| Token | Value | Use |
|---|---|---|
| `--crt-bg` | `#020409` | page background |
| `--crt-core` | `#DEFBFF` | brightest text, glowing titles |
| `--crt-text` | `#C8ECFE` | main text, labels |
| `--crt-text-2` | `#8FD2FB` | body paragraphs |
| `--crt-dim` | `#6CB9EE` | secondary labels, numbers in lists |
| `--crt-phosphor` | `#7DC6F6` | accents, chips |
| `--crt-line` | `rgba(125,198,246,0.5)` | 1px frames, dividers (0.3 for row dividers) |
| `--crt-grid` | `rgba(110,186,239,0.06)` | background grid, 48 px desktop / 32 px mobile |
| `--status` | `#F472B6` | the STATUS dot, the only non-blue color (both themes) |

Full ramp (luminance → color) in `assets/photo_ramp.json`.

### Light (blue ink on cool paper)

| Token | Value | Use |
|---|---|---|
| `--crt-bg` | `#EAEFF5` | page background |
| `--crt-core` | `#0E2C4C` | titles |
| `--crt-text` | `#193755` | main text |
| `--crt-text-2` | `#24405D` | body |
| `--crt-dim` | `#4C647C` | secondary |
| `--crt-line` | `rgba(31,95,175,0.4)` | frames |
| panels | `rgba(250,252,255,0.85)` | card / window fill |

Glow in light = a soft halo, not bloom:
`text-shadow: 0 0 0.6px rgba(20,70,150,0.5), 0 0 14px rgba(60,130,240,0.22)`.

### Glow (dark)

- Big titles / wordmark: `0 0 3px var(--crt-core), 0 0 16–20px rgba(110,186,239,0.6), 0 0 50px rgba(...,0.25)`.
- Labels: `0 0 6px rgba(110,186,239,0.7)`.
- Paragraphs (Inter): no glow, so long text stays readable.

### Global overlays (both themes, `pointer-events: none`)

- Scanlines: `repeating-linear-gradient(0deg, rgba(0,0,0,.2) 0 1px, transparent 1px 3px)` (light: alpha ≈ .05).
- Vignette on hero / scene 2 only.
- Background grid (token above).

### Type

- Michroma: wordmark, section titles, card titles, big numbers (kept).
- **VT323 (new)**: HUD labels, data rows, buttons, rail 01·02·03, SKIP INTRO. Load it the same way as the other fonts.
- JetBrains Mono: ASCII, chips, terminal, `[core.sys]`-style tags (kept).
- Inter: paragraphs (kept).

### Shared pieces

- **Frame with nodes**: 1px `--crt-line` border, 7px glowing dots on the corners (and where a divider meets the frame).
- **Crosshair corners**: L-shaped corners (3–4px desktop, 2–3px mobile) around the thing in focus, with `[label]` tags in JetBrains Mono.
- **Data row**: VT323 label left, value right, 40–44px tall, divider below.
- **Terminal window**: title bar `msse@…: ~/…` + three circles (last one filled).

---

## 2. Scene 1 (hero)

- Background `--crt-bg` + grid + vignette + scanlines. Wordmark `MSSE` in Michroma with the glow, behind the robot.
- **Robot treatment, dark**: the silver robot gets the phosphor blue look of `assets/robot-phosphor-dark-v2.png` (that file is a still, for reference). Do it **over** the live Spline canvas, never by editing the canvas:
  1. try an overlay layer above the canvas with `mix-blend-mode: color` in `#6EBAEF` plus the scanline layer, and compare against the reference still;
  2. if it doesn't match, try `filter: url(#crt-dark)` (see §5) on the canvas wrapper and **measure FPS** before/after on desktop and mobile. A filter is not a transform, but it can be expensive on a WebGL canvas: if it drops frames, keep option 1.
- **Light**: the black robot (current light model) in blue ink: reference `assets/robot-ink-light.png`, same approach.
- Framing: the robot pulled back to ≈80% of the viewport width, head whole (see `Hero.dc.html`; light: head slightly bigger than dark, `HeroLight.dc.html`). Framing goes through the Spline camera / rig only.
- Crosshair around the head, `[core.head]` and `[msse.online]` tags.
- HUD windows become dossier frames: the tour tile (`CH.01 · README TOUR`, WATCH THE TOUR), SYSTEM CHECK with the barcode, BUILD THE FUTURE top right (Inter 200, 0.3em), rail 01·02·03 right edge, SCROLL, SKIP INTRO.
- Mobile (`HeroM*.dc.html`): wordmark on top, robot under it, BUILD THE FUTURE, a `WATCH THE VIDEOS` button (the gallery link from `spec-video-gallery`), SCROLL, SKIP INTRO.
- `HeroAscii.dc.html` is an **alternative** (the robot drawn in characters). Not approved; don't build it.

## 2b. Menu (dock) and section index — same structure, new look

`Menu.dc.html` (dark and light, desktop and mobile). Nothing changes in
`NavigationDock.tsx` / `SectionIndex.tsx` behavior, items, order, test ids,
aria labels or position (dock bottom center; index on the right edge). Only
the styling:

- Dock: frame with nodes (1px `--crt-line`, corner dots), panel fill
  `--crt-panel` + the current blur. `MSSE://` in Michroma with the label glow.
  Links in VT323 21px, 0.14em, icon + label (icons only below `md`, as today).
  Active link: `--crt-title` text with glow, 1px `--crt-line` border and a
  faint fill. Divider: 1px `--crt-line`.
- Theme toggle: dashed `--crt-line` border, VT323 label (`LIGHT` / `DARK`).
- INITIATE: filled button like the contact SEND (dark: `#DAF8FF` with dark
  text and glow; light: `#0E2C4C` with paper text).
- Section index: JetBrains Mono, sub-items smaller, `--crt-dim`; the active
  one in `--crt-title` with glow and a short glowing tick. PAUSE: VT323 in a
  `--crt-line` box.
- Touch targets stay ≥ 44px.

Do it in phase 2 (shared files: session A).

## 3. Scene 2 (capabilities) — no robot

- The robot **leaves** at the end of scene 1: fade the Spline wrapper's opacity to 0 (no transform), then **pause its render loop** with the existing "pause 3D when out of view" mechanism. This frees the GPU for the rest of the page.
- In its place: an **ASCII object** inside crosshair corners. It's text, not WebGL: a `<pre>` (or a 2D canvas) of 76×40 characters (mobile 46×26), JetBrains Mono 12px / 12px line-height (mobile 9px), color `#B9E7FE` with glow.
  - One shape per step: 01 MIND → sphere with latitude/longitude lines, 02 INTERFACE → torus, 03 ENGINE → rounded cube. Morph between them in 900 ms (smoothstep).
  - Port the renderer from `Main.dc.html` (`sdf`, `ascii`, `wave` methods): ray-marched signed distance fields, ramp `" .\`'-:;~=+*xzXUOZ0#%@"`, light from top-left, ~14 fps tick (70 ms), a 180 ms row glitch every 3.4 s, a moving scan line.
  - `prefers-reduced-motion`: one static frame per step, no rotation, no glitch.
  - Tie the step to the existing scene 2 timeline beats (which card is active), not to a timer. The auto-advance in the design is only for the mock.
- Title top-left (`02 // CAPABILITIES`, `WHAT THE CORE RUNS ON`), `STATUS: ONLINE` top-right, `STACK` background word.
- **Capability card → option A "Dossier"** (replaces the graphite bezel card in `CapabilityCard.tsx`). Layout in `Main.dc.html`: header `SUBSYSTEM 01` + small icon; a row with the big Michroma number boxed with corner brackets on the left and part/title/body on the right; data rows `FUNCTION`, `SHIPPED IN`, `STACK` (chips); an oscilloscope wave at the bottom with `SIG · MIND`, `FRAME 000123`, `LINK · MSSE://MIND`.
  - **No more body parts in scene 2.** The robot is gone, so the HEAD / HANDS / TORSO labels go too. Rename the part labels (rail, card subtitle, `SIG ·` / `LINK ·` tags, any `part` field in `portfolioData.ts`) to: AI Engineering → `MIND` (`THE MIND`), Frontend → `INTERFACE` (`THE INTERFACE`), Backend → `ENGINE` (`THE ENGINE`). Scene 1 keeps `[core.head]`: the robot is still there.
  - New data per capability: `function` and `shippedIn`. The values in the design are drafts: **show María Sol the three lists before committing.** Body text stays the one in `portfolioData.ts`.
- Rail `01 MIND · 02 INTERFACE · 03 ENGINE` under the ASCII object, SKIP INTRO bottom center.
- Mobile (`Mobile*.dc.html`): one card at a time under the ASCII object, rail above the card.

## 4. Projects

- Header: pill `03 // SELECTED WORK`, `PROJECTS` with glow, intro line, `WORK` background word.
- Desktop: featured Blaze card (media left, info right), then the grid of five + a terminal tile `msse@core: ~/projects` that links to GitHub (`Projects.dc.html`). Mobile: carousel with scroll-snap, one card per swipe, `01 / 06 · SWIPE >` (`ProjectsM.dc.html`).
- Card = frame with nodes: header `Ø3.x` + status, 16:10 media with crosshair corners, name (Michroma), subtitle (VT323), lead, chips, `CODE >` / `LIVE >` (only the ones that exist, as today).
- **Media effect (videos and posters)** — this is María Sol's explicit ask: every project clip gets the "interference" look. Dark = the portrait's celeste; light = blue ink. Reference stills: `assets/projects/<name>-dark.jpg` / `-light.jpg`.
  - Apply `filter: url(#crt-dark)` / `url(#crt-light)` (§5) on the `<video>` and its poster. Measure: if several filtered videos playing at once drop frames, filter only the clip in view, or bake the filter into the poster and the loop with ffmpeg instead (same palette tables).
  - Recordings of white UIs must be **inverted** in dark (so the screen glows on black) and recordings of dark UIs inverted in light. Add `invertDark` / `invertLight` to `ShowcaseProject`:
    - invert in **dark**: Blaze, Polaris, Lynx (light recordings);
    - invert in **light**: Alphecca, Ethos, Marvel Characters (dark recordings).
  - Scanline overlay on top of the media, plus a short horizontal glitch: 3–5 thin slices offset sideways for ~150 ms every few seconds (CSS keyframes on clip-path slices over a duplicate layer, or on the poster only). Reduced motion: no glitch.

## 5. SVG filters (put once in the app root, hidden)

Luminance → palette, built from `assets/photo_ramp.json`:

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="crt-dark" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.000 0.000 0.038 0.106 0.175 0.254 0.338 0.441 0.569 0.733 0.871"/>
      <feFuncG type="table" tableValues="0.008 0.112 0.226 0.334 0.438 0.539 0.639 0.739 0.827 0.911 0.984"/>
      <feFuncB type="table" tableValues="0.031 0.235 0.400 0.525 0.649 0.762 0.863 0.944 0.984 0.996 1.000"/>
    </feComponentTransfer>
  </filter>
  <filter id="crt-light" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.031 0.053 0.075 0.096 0.118 0.218 0.319 0.420 0.558 0.734 0.910"/>
      <feFuncG type="table" tableValues="0.102 0.147 0.192 0.237 0.282 0.381 0.480 0.578 0.689 0.813 0.937"/>
      <feFuncB type="table" tableValues="0.188 0.269 0.349 0.429 0.510 0.602 0.694 0.785 0.859 0.914 0.969"/>
    </feComponentTransfer>
  </filter>
</svg>
```

For the inverted variant, put `filter: invert(1) url(#crt-dark)` (CSS filters chain left to right).

## 6. About

- `04 // WHO`, `THE HUMAN BEHIND THE MACHINE`, `HUMAN` background word.
- Dossier `SUBJECT MSSE-01`: portrait (`assets/maria-sol-portrait-v9.jpg`, shown whole: `aspect-ratio: 1856 / 2194`, `object-fit: contain`, no side crop), `SHIPPING CODE SINCE` + big `2022`, rows `NAME`, `FUNCTION`, `BASE`, the oscilloscope `SIGNAL · PIANO / LOGICS SHARE PATTERNS`.
- Light: the portrait sits in a **dark screen** inside the light dossier (bg `#020409`, inner shadow, light corner brackets). It's the same image in both themes.
- Principles as three VT323 rows: `01 CONTRACTS BEFORE CODE`, `02 INTERFACES ARE THE PRODUCT`, `03 HUMANS WHERE THEY MATTER`.
- Bio: keep today's text, unchanged.

## 7. Contact + footer

- `05 // CONTACT`, `LET'S TALK`.
- The form is a terminal window `msse@contact: ~/new-message`: `> NAME`, `> EMAIL`, `> LINKEDIN (OPTIONAL)`, `> MESSAGE`, `$ send --to msse ▮`, `SEND >>`. Keep the current behavior and validation; only the look changes.
- Side card `CHANNEL OPEN` (status dot) with BASE and GITHUB rows and a small radar crosshair.
- GridField stays only here and in the footer, recolored to the grid token, as a perspective floor.
- Footer: `MSSE://`, GITHUB · LINKEDIN, `© 2026 MARÍA SOL GOSENDE`.
- Mobile (`ContactM*.dc.html`): `LET'S` / `TALK` on two lines (Michroma 58px) inside crosshair corners with two ghost copies that jump sideways for ~160 ms every 2.8 s (one phosphor, one faint pink); a live signal wave (`SIGNAL · OPEN` / `RX · MSSE://CONTACT`); a log that types `> channel open` / `> waiting for your message` with a blinking cursor; after the form, the `CHANNEL OPEN` card (BASE · BUENOS AIRES, TIME · GMT-3, GITHUB) with a small radar whose sweep lights a pink blip. Reduced motion: no glitch, no typing (show the full lines), static radar.

## 8. Phases (commit after each, report, María Sol deploys)

1. **Tokens, fonts, overlays, SVG filters** (shared files: session A only). Both themes. Nothing else changes yet.
2. **Scene 1 + menu**: robot treatment (measure), wordmark, HUD frames, the dock and section index restyle (§2b), mobile.
3. **Scene 2**: robot leaves + render loop paused, ASCII object, dossier card, rail. Show María Sol the `function` / `shippedIn` lists first.
4. **Projects**: cards, media filter + invert flags + glitch (measure), mobile carousel.
5. **About + Contact + footer**.
6. **QA**: 1440×900, 1280×720, 1920×1080, 390×844, both themes, reduced motion, CPU/FPS before vs after (scene 2 should get *lighter*, not heavier).

If something risks the time budget (the robot treatment, the ASCII renderer), ship the closest simple version, mark `TODO(polish)` and move on.
