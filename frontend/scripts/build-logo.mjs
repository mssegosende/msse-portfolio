// Builds the logo's static files from its geometry (src/components/logoMark.ts),
// with Playwright's Chromium (already installed for the e2e) for the PNGs:
//
//   node scripts/build-logo.mjs        (from frontend/)
//
// Writes, into public/:
//   favicon.svg           the mark cropped to its brackets, no crosshair (at 16px
//                         the lines turn to mud), colours by prefers-color-scheme
//   favicon-32.png        the same, dark, 32x32
//   apple-touch-icon.png  the whole mark with its crosshair, dark, 180x180
// and into design/logo/ the final marks with Michroma's S:
//   msse-mark-dark.svg, msse-mark-light.svg
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const source = readFileSync(path.join(root, "src/components/logoMark.ts"), "utf8");
const str = (name) => {
  const m = source.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`));
  if (!m) throw new Error(`logoMark.ts: no ${name}`);
  return m[1];
};
const num = (name) => Number(source.match(new RegExp(`export const ${name} = ([\\d.]+)`))[1]);
const BRACKETS = str("BRACKETS");
const CROSSHAIR = str("CROSSHAIR");
const S_PATH = str("S_PATH");
const BRACKET_STROKE = num("BRACKET_STROKE");
const CROSSHAIR_STROKE = num("CROSSHAIR_STROKE");
const CROSSHAIR_OPACITY = num("CROSSHAIR_OPACITY");

// The --crt-* tokens (src/index.css), both themes.
const THEME = {
  dark: { bg: "#020409", text: "#C8ECFE", core: "#DEFBFF", phosphor: "#7DC6F6" },
  light: { bg: "#EAEFF5", text: "#193755", core: "#0E2C4C", phosphor: "#1F5FAF" },
};

/** The whole mark on its ground, at the design's own strokes (120 units). */
const fullMark = (c, { bracket = BRACKET_STROKE, crosshair = CROSSHAIR_STROKE } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` +
  `<rect width="120" height="120" fill="${c.bg}"/>` +
  `<path d="${CROSSHAIR}" fill="none" stroke="${c.phosphor}" stroke-opacity="${CROSSHAIR_OPACITY}" stroke-width="${crosshair}"/>` +
  `<path d="${BRACKETS}" fill="none" stroke="${c.text}" stroke-width="${bracket}"/>` +
  `<path d="${S_PATH}" fill="${c.core}"/></svg>\n`;

// The favicon follows the BROWSER's colour scheme, not the site's theme
// (María Sol, 13 Nov): no ground (transparent), the mark pure white on a dark
// browser and --crt-core (#0E2C4C) on a light one; cropped to the brackets
// (24..96), no crosshair, strokes heavy enough for 16px (7 units = ~1.6px at
// 16). The S is drawn 1.3x larger with a thin stroke of its own colour: wider
// than that and its openings close into an 8.
const FAV_BOX = "24 24 72 72";
const FAV_STROKE = 7;
const FAV_S_STROKE = 1.2;
const FAV_S = `transform="translate(60 60) scale(1.3) translate(-60 -60)"`;
const FAV = { dark: "#FFFFFF", light: "#0E2C4C" };
const markBody = (b, s) => `<path ${b} d="${BRACKETS}"/>` + `<path ${s} ${FAV_S} d="${S_PATH}"/>`;
const faviconSvg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FAV_BOX}"><style>` +
  `.b{fill:none;stroke:${FAV.light};stroke-width:${FAV_STROKE}}` +
  `.s{fill:${FAV.light};stroke:${FAV.light};stroke-width:${FAV_S_STROKE};stroke-linejoin:round}` +
  `@media (prefers-color-scheme:dark){.b{stroke:${FAV.dark}}.s{fill:${FAV.dark};stroke:${FAV.dark}}}` +
  `</style>` +
  markBody('class="b"', 'class="s"') +
  `</svg>
`;
// The PNG fallbacks (browsers that ignore SVG favicons or their media
// queries, Safari): the white mark on a small dark rounded tile (--crt-bg),
// readable on a tab bar of any colour.
const tile = (rx) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${FAV_BOX}">` +
  `<rect x="24" y="24" width="72" height="72" rx="${rx}" fill="${THEME.dark.bg}"/>` +
  markBody(
    `fill="none" stroke="${FAV.dark}" stroke-width="${FAV_STROKE}"`,
    `fill="${FAV.dark}" stroke="${FAV.dark}" stroke-width="${FAV_S_STROKE}" stroke-linejoin="round"`,
  ) +
  `</svg>
`;
// The touch icon: the same white mark with its crosshair (60px on screen
// reads it), on the dark ground edge to edge (iOS rounds the corners itself).
const touchIcon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` +
  `<rect width="120" height="120" fill="${THEME.dark.bg}"/>` +
  `<path d="${CROSSHAIR}" fill="none" stroke="${FAV.dark}" stroke-opacity="${CROSSHAIR_OPACITY}" stroke-width="1.6"/>` +
  `<path d="${BRACKETS}" fill="none" stroke="${FAV.dark}" stroke-width="2.6"/>` +
  `<path d="${S_PATH}" fill="${FAV.dark}"/></svg>
`;

const pub = path.join(root, "public");
const design = path.join(root, "../design/logo");
writeFileSync(path.join(pub, "favicon.svg"), faviconSvg);
writeFileSync(path.join(design, "msse-mark-dark.svg"), fullMark(THEME.dark));
writeFileSync(path.join(design, "msse-mark-light.svg"), fullMark(THEME.light));

const browser = await chromium.launch();
const png = async (svg, size, file) => {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`,
  );
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
  console.log(path.relative(root, file));
};
await png(tile(10), 32, path.join(pub, "favicon-32.png"));
await png(touchIcon, 180, path.join(pub, "apple-touch-icon.png"));

// The share image (og:image, twitter:image), 1200x630: the dark ground, the
// mark large with its crosshair, the name in Michroma and the role under it,
// in the site's fonts (Google Fonts, as the site loads them).
const OG = { name: "María Sol Gosende", role: "Software & AI engineer" };
const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await og.setContent(`<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Michroma&family=JetBrains+Mono:wght@400&display=block" rel="stylesheet">
<style>
  html,body{margin:0;width:1200px;height:630px;background:${THEME.dark.bg};overflow:hidden}
  body{display:flex;align-items:center;gap:56px;padding:0 96px;box-sizing:border-box;
    background-image:linear-gradient(rgba(110,186,239,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(110,186,239,.06) 1px,transparent 1px);
    background-size:48px 48px}
  svg{width:400px;height:400px;flex:none}
  h1{margin:0;font:400 54px/1.15 Michroma,sans-serif;letter-spacing:.04em;color:#EEF8FF;
    text-shadow:0 0 14px rgba(110,186,239,.45)}
  p{margin:22px 0 0;font:400 30px/1.3 "JetBrains Mono",monospace;letter-spacing:.06em;color:${THEME.dark.text}}
  p b{font-weight:400;color:${THEME.dark.phosphor}}
</style></head><body>
${fullMark(THEME.dark, { bracket: 1.6, crosshair: 1 }).replace(/<rect[^>]*\/>/, "")}
<div><h1>${OG.name}</h1><p><b>&gt;</b> ${OG.role.replace("&", "&amp;")}</p></div>
</body></html>`);
await og.evaluate("document.fonts.ready");
await og.waitForTimeout(300);
await og.screenshot({ path: path.join(pub, "og-image.png") });
await og.close();
console.log("public/og-image.png");

await browser.close();
console.log("public/favicon.svg, design/logo/msse-mark-{dark,light}.svg");
