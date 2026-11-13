// Builds the README tour's files (the video gallery, src/data/videosData.ts)
// from María Sol's clips (ffmpeg on the PATH):
//
//   node scripts/build-tour-videos.mjs <folder with the clips>
//
// Each clip is matched to a gallery entry by its file name: its number
// ("05 ..."), or the entry title's first word ("ethos-health.mp4" -> 05
// Ethos). A file that matches nothing, or more than one entry, is skipped and
// reported; nothing is guessed. For each match, into public/videos/:
//   <id>.mp4          the full video: H.264, at most 1920x1080, CRF 28,
//                     preset veryfast, AAC 128k, faststart
//   <id>-preview.mp4  a 6 s muted loop, 480 wide, under ~400 KB
//   <id>.jpg          the poster, 960 wide
//   <id>.vtt          captions, from an .srt of the same name, if there is one
// Prints the mapping, each entry's duration and the folder's total size.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = process.argv[2];
if (!src || !existsSync(src)) {
  console.error("usage: node scripts/build-tour-videos.mjs <folder with the clips>");
  process.exit(1);
}

// The 13 entries: id and title, as videosData.ts has them.
const data = readFileSync(path.join(root, "src/data/videosData.ts"), "utf8");
const entries = [...data.matchAll(/entry\("(\d\d)", "[^"]+", "([^"]+)"/g)].map((m) => ({
  id: m[1],
  title: m[2],
}));
const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
// The title's first word that names it ("The series..." -> "series").
const firstWord = (t) =>
  norm(t)
    .split(" ")
    .find((w) => !["the", "a", "an"].includes(w));

const videos = readdirSync(src).filter((f) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(f));
const mapping = [];
const skipped = [];
for (const file of videos) {
  const base = norm(path.parse(file).name);
  const byNumber = entries.filter((e) => new RegExp(`^0*${Number(e.id)}\\b`).test(base));
  const byWord = entries.filter((e) => base.split(" ").includes(firstWord(e.title)));
  const hits = byNumber.length ? byNumber : byWord;
  if (hits.length === 1) mapping.push({ file, entry: hits[0] });
  else skipped.push({ file, why: hits.length ? "more than one entry" : "no entry" });
}

const out = path.join(root, "public/videos");
mkdirSync(out, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);
const probe = (f) =>
  Number(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      f,
    ]).toString(),
  );
const kb = (f) => Math.round(statSync(f).size / 1024);

const results = [];
for (const { file, entry } of mapping.sort((a, b) => a.entry.id.localeCompare(b.entry.id))) {
  const input = path.join(src, file);
  const id = entry.id;
  const duration = probe(input);
  const full = path.join(out, `${id}.mp4`);
  ff([
    "-i",
    input,
    "-vf", // Never larger than it was recorded.
    "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "28",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    full,
  ]);
  // The preview: 6 s from a third of the way in, muted, 480 wide; a higher
  // CRF if it comes out over ~400 KB.
  const at = Math.max(0, Math.min(duration - 6, duration / 3));
  const preview = path.join(out, `${id}-preview.mp4`);
  for (const crf of [30, 34, 38]) {
    ff([
      "-ss",
      at.toFixed(2),
      "-t",
      "6",
      "-i",
      input,
      "-an",
      "-vf",
      "scale=480:-2,fps=24",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      preview,
    ]);
    if (kb(preview) <= 400) break;
  }
  const poster = path.join(out, `${id}.jpg`);
  ff([
    "-ss",
    (at + 1).toFixed(2),
    "-i",
    input,
    "-frames:v",
    "1",
    "-vf",
    "scale=960:-2",
    "-q:v",
    "4",
    poster,
  ]);
  const srt = path.join(src, `${path.parse(file).name}.srt`);
  const vtt = existsSync(srt) ? path.join(out, `${id}.vtt`) : null;
  if (vtt) ff(["-i", srt, vtt]);
  results.push({
    id,
    title: entry.title,
    file,
    duration: Math.round(duration),
    fullKB: kb(full),
    previewKB: kb(preview),
    posterKB: kb(poster),
    captions: !!vtt,
  });
}

const total = readdirSync(out).reduce((s, f) => s + statSync(path.join(out, f)).size, 0);
console.table(results);
if (skipped.length) console.table(skipped);
const unmatched = entries.filter((e) => !mapping.some((m) => m.entry.id === e.id));
console.log(
  "entries with no file:",
  unmatched.map((e) => `${e.id} ${e.title}`).join(", ") || "none",
);
console.log(`public/videos: ${(total / 1024 / 1024).toFixed(1)} MB`);
