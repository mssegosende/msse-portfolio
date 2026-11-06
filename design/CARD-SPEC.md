# Card spec — the black framed card (scene 2 capabilities)

The framed card from mock C, used for the scene 2 capability cards (and the
same frame family for the project cards in scene 3 and the contact form card in
scene 5). Placement, size, timing and copy live in `HANDOFF.md`; this file is
only the card's anatomy. Reference screens: `screens/desktop/light/scene-2-*`
and `screens/desktop/dark/scene-2-*`.

## The card, layer by layer (desktop, at the reference size 304 × 434 px)

All corner geometry is `clip-path`; px values are at the reference size.

1. **Outline** — full box, `#5B646E`, clip-path:
   `polygon(30px 0, calc(100% - 16px) 0, 100% 16px, 100% 150px, calc(100% - 8px) 158px, calc(100% - 8px) calc(100% - 24px), calc(100% - 30px) 100%, 16px 100%, 0 calc(100% - 16px), 0 calc(100% - 160px), 8px calc(100% - 168px), 8px 22px)`
2. **Graphite bezel** — `inset: 1px`, same polygon, background
   `linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 10%), linear-gradient(160deg, #3A4148 0%, #252A30 45%, #1B1F24 100%)`
3. **Gap** — `top/bottom 12px, left/right 20px`, `#050608`, clip-path
   `polygon(26px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 26px), calc(100% - 26px) 100%, 12px 100%, 0 calc(100% - 12px), 0 26px)`
4. **Panel** — `top/bottom 14px, left/right 22px`, clip-path
   `polygon(24px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 10px 100%, 0 calc(100% - 10px), 0 24px)`
   - light theme: `radial-gradient(ellipse 120% 70% at 20% 0%, #262B31 0%, #12151A 55%, #0B0D10 100%)`
   - dark theme (silver satin): `radial-gradient(ellipse 120% 80% at 18% 0%, #FBFCFD 0%, #E6EAED 42%, #C9D0D6 100%)`
5. **Bottom tab** — centered on the bottom edge, `width: min(220px, 74%)`,
   height 40px, trapezoid `polygon(0 100%, 20px 0, calc(100% - 20px) 0, 100% 100%)`,
   same outline + graphite layers as 1–2. Content: `MSSE://` (Michroma 9.5px,
   letter-spacing 0.16em) · a 1.5 × 16px divider (rgba(233,237,241,0.6)) ·
   `{part}` (Inter 12.5px, 500). Text `#E9EDF1` in both themes.
6. Soft drop shadow on the whole card: `drop-shadow(0 34px 40px rgba(18,24,34,0.38))`.

The card is **opaque** now (the current card is glass with backdrop-blur so the
arm shows through). That is intended — María Sol chose this card.

## Content (inside the panel: margin 14px 22px, padding 24px 18px 58px, flex column)

Top to bottom:

1. **Tag** `SYS.{num}` — JetBrains Mono 10px, letter-spacing 0.14em, padding
   6px 11px, border 1.5px, radius 7px, aligned left.
2. **Flexible empty space** (`flex: 1`) — pushes everything below down.
3. **Title row** — `display:flex; align-items:flex-end; justify-content:space-between; gap:10px`
   - left: `h3` Rajdhani 600, 22px, letter-spacing 0.08em, line-height 1.05,
     with a small subtitle above it: `{part}` (e.g. "HEAD") in 12px,
     letter-spacing 0.22em;
   - right: **the number**, Michroma 38px, line-height 0.9, **solid fill**
     (replaces the outlined Rajdhani number).
4. **Body** `{text}` — Inter 14px, line-height 1.55, margin-top 10px.
5. **Chips** — margin-top 14px, wrap, gap 6px; each chip Inter 12px 500,
   padding 5px 11px, radius 999px, **border only** (1px), no fill.

Colors per theme:

| | light theme (dark panel) | dark theme (silver panel) |
|---|---|---|
| tag text / border | #FFFFFF / rgba(255,255,255,0.72) | #0B0D10 / rgba(11,13,16,0.7) |
| subtitle | #AEB6BF | #4A525C |
| title, number | #FFFFFF | #0B0D10 |
| body | #C9D0D7 | #14181D |
| chip text / border | #E9EDF1 / rgba(255,255,255,0.32) | #14181D / rgba(11,13,16,0.35) |

## Dark mode

Same graphite frame and bottom tab. The inner panel becomes satin silver —
`repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 3px, rgba(255,255,255,0.22) 3px 4px), radial-gradient(ellipse 120% 80% at 18% 0%, #FBFCFD 0%, #E6EAED 42%, #C9D0D6 100%)`
— the gap layer becomes `#2A3037`, and the text uses the dark-theme column of
the color table above. The tab text stays light.

## Implementation notes

- Build the card once and reuse it (desktop and mobile share it).
- Michroma: load it the same way the site loads Rajdhani / Inter (check first
  whether it is already loaded).
- Chips come from a `tags: string[]` field on each capability (values in
  `HANDOFF.md`).
- Scale the whole card (frame + type) together; never shrink fonts to make
  text fit — report overflow instead.
