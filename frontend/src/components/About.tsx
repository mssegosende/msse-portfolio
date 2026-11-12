import { useLayoutEffect, useRef, useState } from "react";
import { profile, manifesto } from "../data/portfolioData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionProgress, useSectionStep } from "../hooks/useSectionStep";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { DataRow } from "./crt/CrtPieces";
import s from "./About.module.css";

const STEPS = 3;

// Desktop reveal, on the section's progress (700vh, pinned for six screens).
// The four paragraphs one by one, then the dossier ("since 2022") and each
// principle on its own stretch of scroll, ~0.7 screen each (María Sol, 9 Nov);
// then about 1.3 screens of hold before Contact. The index's thirds: Ø4.1 the
// paragraphs, Ø4.2 the dossier and principles 1-2, Ø4.3 principle 3 and the hold.
const PARA_AT = [0, 0.1, 0.2, 0.3];
const SINCE_AT = 0.42;
const PRINCIPLE_AT = [0.52, 0.62, 0.72];

const PARAGRAPHS = [
  ...profile.bio.map((text) => ({ text, kind: "bio" as const })),
  ...profile.story.map((text) => ({ text, kind: "story" as const })),
];

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

const NODES = [
  "left-[-4px] top-[-4px]",
  "right-[-4px] top-[-4px]",
  "bottom-[-4px] left-[-4px]",
  "bottom-[-4px] right-[-4px]",
];

/**
 * Scene 4 · WHO, CRT look (design/crt/.../About*.dc.html). Desktop: the
 * section pins while the bio's four paragraphs appear one by one in the left
 * column (today's text, unchanged); then the SUBJECT MSSE-01 dossier comes in
 * on the right and each principle row under the text. Mobile: one column,
 * the dossier first, all shown.
 */
export const About = () => {
  const ref = useRef<HTMLElement>(null);
  const step = useSectionStep(ref, STEPS);
  const progress = useSectionProgress(ref);
  const desktop = useMediaQuery("(min-width: 1024px)");
  // Reduced motion: no pin, everything shown (the hidden states are never armed).
  const still = useMediaQuery(REDUCED_MOTION_QUERY);
  const paced = desktop && !still;
  const reached = still || step >= 0;
  const shownParas = still
    ? PARAGRAPHS.length
    : desktop
      ? PARA_AT.filter((at) => progress >= at).length
      : reached
        ? 4
        : 0;
  const rightOn = paced ? progress >= SINCE_AT : reached;
  const since = profile.stats[0];

  // Desktop: how far the paragraphs slide up so the newest one shows whole.
  const windowRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [lift, setLift] = useState(0);
  useLayoutEffect(() => {
    const win = windowRef.current;
    const stack = stackRef.current;
    if (!paced || !win || !stack) {
      setLift(0);
      return undefined;
    }
    const measure = () => setLift(Math.max(0, Math.ceil(stack.scrollHeight - win.clientHeight)));
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(win);
    ro?.observe(stack);
    return () => ro?.disconnect();
  }, [paced, shownParas]);

  return (
    <section
      ref={ref}
      id="about"
      data-testid="about-section"
      // The reveals' hidden states apply only once JS has armed them.
      data-armed={!still}
      className={s.section}
    >
      <div className={s.stage}>
        <div aria-hidden="true" className="crt-grid absolute inset-0" />
        <div aria-hidden="true" className={`crt-bg-word font-michroma ${s.word}`}>
          HUMAN
        </div>

        <div className={`${s.reveal} ${s.head}`} data-on={reached}>
          <span className="crt-pill self-start font-vt">04 // WHO</span>
          <h2
            className={`crt-glow m-0 font-michroma font-normal uppercase text-crt-title ${s.title}`}
          >
            The human behind the machine
          </h2>
        </div>

        <div className={s.left}>
          <div
            ref={windowRef}
            className={s.textWindow}
            data-lifted={desktop && lift > 0}
            data-testid="about-text"
          >
            <div
              ref={stackRef}
              className={s.textStack}
              style={paced ? { transform: `translateY(${-lift}px)` } : undefined}
            >
              {PARAGRAPHS.map((p, i) => (
                <p
                  key={i}
                  className={`${s.reveal} ${s.para}`}
                  data-on={i < shownParas}
                  data-dim={paced && lift > 0 && i < shownParas - 1}
                  data-testid={`about-paragraph-${i + 1}`}
                >
                  {p.text}
                </p>
              ))}
            </div>
          </div>

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

        {/* The dossier: nothing here shows until the fourth paragraph is out. */}
        <div className={`${s.reveal} ${s.slow} ${s.right}`} data-on={rightOn}>
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
                <div className={s.screen}>
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
                  {value}
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
