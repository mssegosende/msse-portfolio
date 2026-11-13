import { useEffect, useRef, useState, type RefObject } from "react";
import { TICK_MS } from "./scroll-scene/ascii";
import { BioTerminal, TypeLine } from "./BioTerminal";
import { profile, manifesto } from "../data/portfolioData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionProgress, useSectionStep } from "../hooks/useSectionStep";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { at, clampScale, useFrame } from "../hooks/useFrame";
import { DataRow } from "./crt/CrtPieces";
import s from "./About.module.css";
import { useCrossfade } from "@/hooks/useSectionDissolve";
import { useOwnsCenter } from "@/hooks/useOwnsCenter";

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

// SIGNAL · PIANO: the design's decaying wave (struck notes), running right
// to left like scene 2's oscilloscope (María Sol, 13 Nov), t in ms.
const signalPath = (t: number) => {
  const shift = t * 0.06;
  let d = "";
  for (let x = 0; x <= 614; x += 3) {
    const u = x + shift;
    const env = Math.exp(-((u % 154) / 60));
    const y = 42 + 30 * env * Math.sin(u * 0.22) + 6 * Math.sin(u * 0.05 + t * 0.0007);
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return d;
};

/** The piano scope, ticking like scene 2's (TICK_MS) while on screen; still with reduced motion. */
const PianoScope = ({ reduced }: { reduced: boolean }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    pathRef.current?.setAttribute("d", signalPath(0));
    if (reduced) return undefined;
    let onScreen = false;
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            onScreen = !!e?.isIntersecting;
          });
    if (boxRef.current) io?.observe(boxRef.current);
    const t0 = performance.now();
    const id = setInterval(() => {
      if (onScreen && !document.hidden)
        pathRef.current?.setAttribute("d", signalPath(performance.now() - t0));
    }, TICK_MS);
    return () => {
      clearInterval(id);
      io?.disconnect();
    };
  }, [reduced]);
  return (
    <div ref={boxRef} className="crt-scope h-[84px] border border-[var(--crt-line-row)]">
      <svg
        aria-hidden="true"
        width="100%"
        height="82"
        viewBox="0 0 614 84"
        preserveAspectRatio="none"
        className="block"
      >
        <path ref={pathRef} className="crt-scope__wave" fill="none" strokeWidth="1.6" />
      </svg>
    </div>
  );
};

/** Three thin bands of the portrait, offset sideways during a glitch. */
const GLITCH_SLICES = [
  { clipPath: "inset(22% 0 74% 0)", transform: "translateX(9px)" },
  { clipPath: "inset(47% 0 50% 0)", transform: "translateX(-11px)" },
  { clipPath: "inset(69% 0 27% 0)", transform: "translateX(6px)" },
];

/** True while the element is on screen (its loops pause off screen). */
const useOnScreen = (ref: RefObject<HTMLElement | null>) => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setOn(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
};

// The dossier at its design size (About.dc.html), px, and the room kept
// above the dock.
const DOSSIER_W = 656;
/** The text column (title, bio panel, principles) beside it, px. */
const TEXT_W = 616;
const DOSSIER_H = 712;
const DOCK_ROOM = 120;
/** Desktop: the dossier's and the title's top in the 1440 x 900 frame (María
 * Sol, 13 Nov: up from 96, fitted to the screen). */
const TOP = 44;

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
 * Sol asked (12 Nov): first the SUBJECT MSSE-095 dossier with the portrait
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
  const wordShown = useOwnsCenter(ref);
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
    Math.min(kw, (height - TOP * kh - DOCK_ROOM) / DOSSIER_H, (width - 60 - 760 * kw) / TEXT_W),
  );
  // Dossier left (64), the text column right of it (760), side by side.
  const leftBox = desktop ? { ...at(760, TOP), zoom: k, width: TEXT_W } : undefined;
  const rightBox = desktop ? { ...at(64, TOP), zoom: k, width: DOSSIER_W } : undefined;
  // The portrait's interference loops run only while it is on screen.
  const screenRef = useRef<HTMLDivElement>(null);
  const screenOn = useOnScreen(screenRef);

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
        <div
          aria-hidden="true"
          data-shown={wordShown}
          className={`crt-bg-word font-michroma ${s.word}`}
        >
          HUMAN
        </div>

        <div className={s.leftCol} style={leftBox}>
          <div className={`${s.reveal} ${s.head}`} data-on={reached} data-xf="head">
            <span className="crt-section-label self-start font-vt">04 // WHO</span>
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

            {/* Principles: three VT323 title rows (SPEC §6), each with its
                description under it again (María Sol, 13 Nov). */}
            <div className={s.principles}>
              {manifesto.map((p, i) => (
                <article
                  key={p.num}
                  data-testid={`manifesto-chapter-${p.num}`}
                  className={`${s.reveal} ${s.slow} ${s.principle}`}
                  data-on={paced ? progress >= (PRINCIPLE_AT[i] ?? 1) : reached}
                >
                  <div className={s.principleHead}>
                    <span className="crt-section-label">{p.num}</span>
                    <h3 className={s.principleTitle}>{p.title}</h3>
                  </div>
                  <p className={s.principleText}>{p.text}</p>
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
              <span className="crt-glow-label text-crt-title">SUBJECT MSSE-095</span>
              <span aria-hidden="true" className="crt-dossier__icon" />
            </div>
            <div className={s.subject}>
              <div className={s.portraitCell}>
                {/* A dark screen in both themes: the portrait is the same image. */}
                {/* Interference (María Sol, 13 Nov), so the face never looks
                    perfectly clean: scanlines, a soft bright bar sweeping up
                    and down, and short glitch slices every few seconds;
                    paused off screen. Reduced motion: the scanlines alone. */}
                <div
                  ref={screenRef}
                  className={s.screen}
                  data-sweep={rightOn && !still ? "true" : undefined}
                  data-live={screenOn && !still ? "true" : "false"}
                >
                  <img
                    src="/about/maria-sol-portrait.jpg"
                    alt="María Sol Gosende, portrait built from glowing digits"
                    className={s.portrait}
                    loading="lazy"
                    decoding="async"
                  />
                  {!still && (
                    <>
                      <span aria-hidden="true" className={s.glitch}>
                        {GLITCH_SLICES.map((style) => (
                          <span key={style.clipPath} className="absolute inset-0" style={style}>
                            <img
                              src="/about/maria-sol-portrait.jpg"
                              alt=""
                              className={s.portrait}
                            />
                          </span>
                        ))}
                      </span>
                      <span aria-hidden="true" className={s.bar} />
                    </>
                  )}
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
              <PianoScope reduced={still} />
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
