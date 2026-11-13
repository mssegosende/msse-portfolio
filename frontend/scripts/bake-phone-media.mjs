// Bakes the CRT palette into the project clips and posters for phones
// (María Sol, 13 Nov: on her phone the clips showed in full colour; iOS
// Safari doesn't run an SVG url() filter over a playing <video>).
//
//   node scripts/bake-phone-media.mjs        (from frontend/, ffmpeg on the PATH)
//
// The same steps as the live filter (src/components/crt/CrtFilters.tsx, whose
// tables this reads): invert first where the project asks for it in that
// theme (projectsData.ts: invertDark / invertLight), then luminance, then each
// channel through its table, linear between the entries (feComponentTransfer
// type="table"). Writes public/projects/phone/<id>-<dark|light>.mp4 and .jpg,
// 800 wide (the carousel shows ~330 CSS px, twice that on a 2x screen).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const filters = readFileSync(path.join(root, "src/components/crt/CrtFilters.tsx"), "utf8");
const projects = readFileSync(path.join(root, "src/data/projectsData.ts"), "utf8");

/** The palette tables, as CrtFilters.tsx has them. */
const tables = {};
for (const theme of ["dark", "light"]) {
  const block = filters.slice(filters.indexOf(`${theme}: {`));
  tables[theme] = Object.fromEntries(
    ["r", "g", "b"].map((ch) => {
      const m = block.match(new RegExp(`${ch}: "([0-9. ]+)"`));
      return [ch, m[1].trim().split(/\s+/).map(Number)];
    }),
  );
}

/** Each project's id, clip, poster and inversions. */
const list = projects
  .split(/\n\s*\{\n\s*id: "/)
  .slice(1)
  .map((chunk) => ({
    id: chunk.slice(0, chunk.indexOf('"')),
    media: chunk.match(/media: "([^"]+)"/)?.[1],
    poster: chunk.match(/poster: "([^"]+)"/)?.[1],
    invertDark: /invertDark: true/.test(chunk),
    invertLight: /invertLight: true/.test(chunk),
  }))
  .filter((p) => p.media);

/** An ffmpeg lut expression for one table: piecewise linear over val / 255. */
const lut = (t) => {
  const n = t.length - 1;
  let expr = `${(t[n] * 255).toFixed(3)}`;
  for (let i = n - 1; i >= 0; i--) {
    const a = t[i] * 255;
    const b = t[i + 1] * 255;
    expr = `if(lt(val*${n}/255,${i + 1}),${a.toFixed(3)}+(${(b - a).toFixed(3)})*(val*${n}/255-${i}),${expr})`;
  }
  return expr;
};

const chain = (theme, invert) =>
  [
    "scale=800:-2:flags=lanczos",
    "format=rgb24",
    invert ? "negate" : null,
    "colorchannelmixer=rr=0.299:rg=0.587:rb=0.114:gr=0.299:gg=0.587:gb=0.114:br=0.299:bg=0.587:bb=0.114",
    `lutrgb=r='${lut(tables[theme].r)}':g='${lut(tables[theme].g)}':b='${lut(tables[theme].b)}'`,
  ]
    .filter(Boolean)
    .join(",");

const out = path.join(root, "public/projects/phone");
mkdirSync(out, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
let total = 0;
for (const p of list) {
  for (const theme of ["dark", "light"]) {
    const invert = theme === "dark" ? p.invertDark : p.invertLight;
    const vf = chain(theme, invert);
    const clip = path.join(out, `${p.id}-${theme}.mp4`);
    ff([
      "-i",
      path.join(root, "public", p.media),
      "-an",
      "-vf",
      `${vf},format=yuv420p`,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "28",
      "-profile:v",
      "high",
      "-movflags",
      "+faststart",
      clip,
    ]);
    const still = path.join(out, `${p.id}-${theme}.jpg`);
    ff(["-i", path.join(root, "public", p.poster), "-vf", vf, "-q:v", "4", still]);
    const kb = (statSync(clip).size + statSync(still).size) / 1024;
    total += kb;
    console.log(`${p.id}-${theme}: ${Math.round(kb)} KB`);
  }
}
console.log(`total: ${(total / 1024).toFixed(1)} MB`);
