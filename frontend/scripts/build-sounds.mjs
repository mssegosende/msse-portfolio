// Cuts the site's HUD sounds out of María Sol's two sound-design tracks
// ("Futuristic Sound Design.mp3" and "Futuristic Sound Design 2.mp3", in
// Desktop/portfolio-clips), ffmpeg on the PATH:
//
//   node scripts/build-sounds.mjs <folder with the two tracks>
//
// The tracks are full mixes: a low music bed under interface sounds. Each cut
// below is one of those sounds, the bed filtered out (high-pass 700 Hz, twice),
// with a 3 ms fade in and a 20 ms fade out, peak-normalized to -3 dBFS, as a
// 16-bit WAV (WAV, not MP3: no encoder delay at the start, so they land on
// time). The background is track 2 as it is, made into a seamless loop (its
// end cross-faded into its start), as an MP3. Into public/sounds/.
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-sounds.mjs <folder with the two tracks>");
  process.exit(1);
}
const T1 = path.join(src, "Futuristic Sound Design.mp3");
const T2 = path.join(src, "Futuristic Sound Design 2.mp3");
const out = path.join(root, "public/sounds");
mkdirSync(out, { recursive: true });
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args]);

// name: [track, start s, end s] (found by their spectrograms).
const CUTS = {
  "blip-a": [T1, 1.19, 1.26], // typing, a short tonal blip
  "blip-b": [T1, 7.53, 7.59], // typing, a digital tick
  beep: [T1, 0.33, 0.4], // the ECG's beep, a pure tone
  select: [T2, 0.16, 0.4], // hover, two tones
  confirm: [T2, 4.29, 4.66], // click, tones stepping up
  boot: [T2, 12.03, 12.7], // power-up, a rising sweep
  whoosh: [T1, 45.44, 45.96], // section change, broadband air
  command: [T2, 10.22, 10.86], // message sent, repeated bleeps
  glitch: [T1, 8.13, 8.25], // glitch, a chaotic burst
};

for (const [name, [track, a, b]] of Object.entries(CUTS)) {
  const len = b - a;
  const file = path.join(out, `${name}.wav`);
  ff([
    "-ss",
    a.toFixed(3),
    "-t",
    len.toFixed(3),
    "-i",
    track,
    "-af",
    [
      "highpass=f=700",
      "highpass=f=700",
      "afade=t=in:d=0.003",
      `afade=t=out:st=${(len - 0.02).toFixed(3)}:d=0.02`,
      "loudnorm=I=-14:TP=-3:LRA=7:linear=true",
      "aresample=44100",
    ].join(","),
    "-c:a",
    "pcm_s16le",
    file,
  ]);
  console.log(
    `${name}.wav  ${Math.round(len * 1000)} ms  ${Math.round(statSync(file).size / 1024)} KB`,
  );
}

// The background: track 2 without its fade-out tail, its last 3 s cross-faded
// into its first 3 s, so the loop has no seam.
const body = path.join(os.tmpdir(), "bg-body.wav");
const head = path.join(os.tmpdir(), "bg-head.wav");
const tail = path.join(os.tmpdir(), "bg-tail.wav");
const XF = 3;
const END = 89.6;
ff(["-ss", "0.2", "-t", (END - 0.2).toFixed(2), "-i", T2, body]);
ff(["-i", body, "-t", String(XF), head]);
ff(["-sseof", `-${XF}`, "-i", body, tail]);
const bg = path.join(out, "background.mp3");
ff([
  "-i",
  body,
  "-i",
  tail,
  "-i",
  head,
  "-filter_complex",
  // The middle of the body, then the tail fading out over the head fading in.
  `[0:a]atrim=start=${XF}:end=${(END - 0.2 - XF).toFixed(2)},asetpts=PTS-STARTPTS[mid];` +
    `[1:a]afade=t=out:d=${XF}[t];[2:a]afade=t=in:d=${XF}[h];[t][h]amix=inputs=2:normalize=0[seam];` +
    `[mid][seam]concat=n=2:v=0:a=1,loudnorm=I=-20:TP=-3:LRA=11[out]`,
  "-map",
  "[out]",
  "-c:a",
  "libmp3lame",
  "-b:a",
  "128k",
  bg,
]);
console.log(`background.mp3  ${Math.round(statSync(bg).size / 1024)} KB`);
