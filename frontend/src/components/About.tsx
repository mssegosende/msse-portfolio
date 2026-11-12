import { useEffect, useRef, useState } from "react";
import { BioTerminal, TypeLine } from "./BioTerminal";
import { profile, manifesto } from "../data/portfolioData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionProgress, useSectionStep } from "../hooks/useSectionStep";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { at, clampScale, useFrame } from "../hooks/useFrame";
import { DataRow } from "./crt/CrtPieces";
import s from "./About.module.css";
import { useCrossfade } from "@/hooks/useSectionDissolve";

const STEPS = 3;

// Desktop reveal, on the section's progress (700vh, pinned for six screens):
// the bio types itself in a terminal panel from arrival (BioTerminal); the
// dossier ("since 2022") and each principle come in on their own stretch of
// scroll, then about 1.3 screens of hold before Contact. The crossfades in
// and out add their scroll at both ends (About.module.css), outside this pace.
const PRINCIPLE_AT = [0.52, 0.62, 0.72];

// The bio: today's four paragraphs, unchanged.
const BIO = [...profile.bio, ...profile.story];

// The dossier's rows (About.dc.html).
const ROWS: [string, string][] = [
  ["NAME", "MARÍA SOL GOSENDE"],
  ["FUNCTION", "FULL STACK · AI ENGINEER"],
  ["BASE", "BUENOS AIRES"],
];

// SIGNAL · PIANO: the design's decaying wave, drawn once (it doesn't move).
const SIGNAL = (() => {
  let d = "";
  for (let x = 0; x <= 614; x += 3) {
    const env = Math.exp(-((x % 154) / 60));
    const y = 42 + 30 * env * Math.sin(x * 0.22) + 6 * Math.sin(x * 0.05);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return d;
})();

// The dossier at its design size (About.dc.html), px, and the room kept
// above the dock.
const DOSSIER_W = 656;
/** The text column (title, bio panel, principles) beside it, px. */
const TEXT_W = 616;
const DOSSIER_H = 712;
const DOCK_ROOM = 110;

const NODES = [
  "left-[-4px] top-[-4px]",
  "right-[-4px] top-[-4px]",
  "bottom-[-4px] left-[-4px]",
  "bottom-[-4px] right-[-4px]",
];

// How long the dossier takes to come in (the reveal's slow transition) before
// the bio and the data rows start typing, ms.
const PORTRAIT_IN_MS = 1200;

/**
 * Scene 4 · WHO, CRT look (design/crt/.../About*.dc.html), in the order María
 * Sol asked (12 Nov): first the SUBJECT MSSE-01 dossier with the portrait
 * (a fade and a scanline sweeping down the photo), then, as soon as it is in,
 * the bio types itself in the code panel beside it while the dossier's data
 * rows type in too. Desktop: dossier left, title, bio panel and principles
 * right, side by side; the principles come in on their own stretch of the
 * pinned scroll. Phones: the dossier, then the bio panel, then the principles.
 */
export const About = () => {
  const ref = useRef<HTMLElement>(null);
  // 3 -> 4: Projects holds its last screen; About's sticky stage holds its first.
  useCrossfade(ref, "projects", false, -2);
  const step = useSectionStep(ref, STEPS);
  const progress = useSectionProgress(ref, true);
  const desktop = useMediaQuery("(min-width: 1024px)");
  // Reduced motion: no pin, everything shown (the hidden states are never armed).
  const still = useMediaQuery(REDUCED_MOTION_QUERY);
  const paced = desktop && !still;
  const reached = still || step >= 0;
  // The dossier comes in on arrival; the typing waits for it.
  const rightOn = reached;
  const [portraitIn, setPortraitIn] = useState(still);
  useEffect(() => {
    if (!rightOn || portraitIn) return undefined;
    const t = setTimeout(() => setPortraitIn(true), PORTRAIT_IN_MS);
    return () => clearTimeout(t);
  }, [rightOn, portraitIn]);
  const since = profile.stats[0];

  // Desktop: the title column and the dossier keep their places in the
  // 1440 x 900 frame and one scale, the window's width capped where the
  // height runs out (María Sol, 12 Nov), so the title keeps its proportion
  // to the dossier at every size.
  const { width, height, kw, kh } = useFrame();
  const k = clampScale(
    Math.min(kw, (height - 96 * kh - DOCK_ROOM) / DOSSIER_H, (width - 60 - 760 * kw) / TEXT_W),
  );
  // Dossier left (64), the text column right of it (760), side by side.
  const leftBox = desktop ? { ...at(760, 96), zoom: k, width: TEXT_W } : undefined;
  const rightBox = desktop ? { ...at(64, 96), zoom: k, width: DOSSIER_W } : undefined;

  return (
    <section
      ref={ref}
      id="about"
      data-testid="about-section"
      // The reveals' hidden states apply only once JS has armed them.
      data-armed={!still}
      // xf-overlap: the section crossfades (useSectionDissolve).
      className={`xf-overlap ${s.section}`}
    >
      <div className={s.stage}>
        <div aria-hidden="true" className="crt-grid absolute inset-0" />
        <div aria-hidden="true" className={`crt-bg-word font-michroma ${s.word}`}>
          HUMAN
        </div>

        <div className={s.leftCol} style={leftBox}>
          <div className={`${s.reveal} ${s.head}`} data-on={reached} data-xf="head">
            <span className="crt-pill self-start font-vt">04 // WHO</span>
            <h2
              className={`crt-glow m-0 font-michroma font-normal uppercase text-crt-title ${s.title}`}
            >
              The human behind the machine
            </h2>
          </div>

          <div className={s.left} data-xf="cards">
            {/* The bio types itself in, once (María Sol, 12 Nov): a fixed-height
                terminal panel; today's text, unchanged. */}
            <BioTerminal paragraphs={BIO} reduced={still} start={portraitIn} className={s.bio} />

            {/* Principles as three VT323 rows (SPEC §6). */}
            <div className={s.principles}>
              {manifesto.map((p, i) => (
                <article
                  key={p.num}
                  data-testid={`manifesto-chapter-${p.num}`}
                  className={`${s.reveal} ${s.slow} ${s.principle}`}
                  data-on={paced ? progress >= (PRINCIPLE_AT[i] ?? 1) : reached}
                >
                  <span className="crt-section-label">{p.num}</span>
                  <h3 className={s.principleTitle}>{p.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* The dossier: first in, on arrival. */}
        <div className={`${s.reveal} ${s.slow} ${s.right}`} data-on={rightOn} style={rightBox}>
          <div className={`crt-frame relative ${s.dossier}`}>
            {NODES.map((pos) => (
              <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
            ))}
            <div className={s.dossierHead}>
              <span className="crt-glow-label text-crt-title">SUBJECT MSSE-01</span>
              <span aria-hidden="true" className="crt-dossier__icon" />
            </div>
            <div className={s.subject}>
              <div className={s.portraitCell}>
                {/* A dark screen in both themes: the portrait is the same image. */}
                <div className={s.screen} data-sweep={rightOn && !still ? "true" : undefined}>
                  <img
                    src="/about/maria-sol-portrait.jpg"
                    alt="María Sol Gosende, portrait built from glowing digits"
                    className={s.portrait}
                    loading="lazy"
                    decoding="async"
                  />
                  <span
                    aria-hidden="true"
                    className={`${s.bracket} left-2.5 top-2.5 border-l-2 border-t-2`}
                  />
                  <span
                    aria-hidden="true"
                    className={`${s.bracket} bottom-2.5 right-2.5 border-b-2 border-r-2`}
                  />
                  <span
                    aria-hidden="true"
                    className="crt-scanlines crt-scanlines--media absolute inset-0"
                  />
                </div>
              </div>
              {since && (
                <div className={s.since} data-testid="about-stat-code" data-on={rightOn}>
                  <span className={s.sinceLabel}>{since.label}</span>
                  <span className={`font-michroma ${s.year}`}>{since.value}</span>
                </div>
              )}
            </div>
            <div className={s.rows}>
              {ROWS.map(([label, value]) => (
                <DataRow key={label} label={label}>
                  <TypeLine text={value} start={portraitIn} reduced={still} />
                </DataRow>
              ))}
            </div>
            <div className={s.signal}>
              <div className="crt-scope h-[84px] border border-[var(--crt-line-row)]">
                <svg
                  aria-hidden="true"
                  width="100%"
                  height="82"
                  viewBox="0 0 614 84"
                  preserveAspectRatio="none"
                  className="block"
                >
                  <path d={SIGNAL} className="crt-scope__wave" fill="none" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="mt-2 flex justify-between font-mono text-[11px] tracking-[0.08em] text-crt-dim">
                <span>SIGNAL · PIANO</span>
                <span>LOGICS SHARE PATTERNS</span>
              </div>
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="crt-scanlines pointer-events-none absolute inset-0" />
      </div>
    </section>
  );
};
