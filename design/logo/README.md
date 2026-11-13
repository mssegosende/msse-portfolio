# MSSE logo

María Sol's final design (13 Nov): four corner brackets (no closed square),
Michroma's "S" in the centre, thin crosshair lines on the centre axes outside
the brackets only.

- `msse-logo-light.svg`: the reference geometry (120-unit square): brackets,
  crosshair, stroke weights and the light theme's colours.
- `msse-logo-dark.png`: the dark theme's colours and proportions (1024px).

`msse-logo-dark.svg` and `msse-logo-light.png` were not in the hand-off; the
dark colours come from the PNG (sampled), the geometry from the light SVG.

In the site the "S" is Michroma's own glyph as a path (not the hand-drawn one
in the SVG), at the same height and centre: see
`frontend/src/components/logoMark.ts`, the single source for `<Logo />` and
`frontend/scripts/build-logo.mjs` (favicon, touch icon, OG image).

Colours, mapped to the site's tokens (both themes):

| Part | Token | Light | Dark |
| --- | --- | --- | --- |
| Brackets | `--crt-text` | `#193755` | `#C8ECFE` |
| S | `--crt-core` | `#0E2C4C` | `#DEFBFF` |
| Crosshair | `--crt-phosphor` at 0.4 | `#1F5FAF` | `#7DC6F6` |
| Ground | `--crt-bg` | `#EAEFF5` | `#020409` |
