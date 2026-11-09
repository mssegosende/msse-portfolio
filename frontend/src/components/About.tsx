import { useLayoutEffect, useRef, useState } from "react";
import { profile, manifesto } from "../data/portfolioData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionProgress, useSectionStep } from "../hooks/useSectionStep";
import { SectionBackdrop } from "./SectionBackdrop";
import { Num } from "./Num";
import s from "./About.module.css";

const STEPS = 3;

// Desktop reveal, on the section's progress (700vh, pinned for six screens).
// The four paragraphs one by one, then "since 2022" and each principle on its
// own stretch of scroll, ~0.7 screen each (María Sol, 9 Nov: they came one
// right after another, with no time to read); then about 1.3 screens of hold
// before Contact. The index's thirds: Ø4.1 the paragraphs, Ø4.2 2022 and
// principles 1-2, Ø4.3 principle 3 and the hold.
const PARA_AT = [0, 0.1, 0.2, 0.3];
const SINCE_AT = 0.42;
const PRINCIPLE_AT = [0.52, 0.62, 0.72];

const PARAGRAPHS = [
  ...profile.bio.map((text) => ({ text, kind: "bio" as const })),
  ...profile.story.map((text) => ({ text, kind: "story" as const })),
];

/**
 * Scene 4 · WHO (design/source/{desktop,mobile}/light/scene-4-about.dc.html).
 * Desktop: the section pins while its four paragraphs appear one by one in a
 * single column and stay; when they no longer fit, the earlier ones slide up
 * and dim. Only after the fourth does the right column come in ("since 2022",
 * then each principle on its own scroll), with the text still there. Mobile:
 * one column, all shown.
 */
export const About = () => {
  const ref = useRef<HTMLElement>(null);
  const step = useSectionStep(ref, STEPS);
  const progress = useSectionProgress(ref);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const reached = step >= 0;
  const shownParas = desktop ? PARA_AT.filter((at) => progress >= at).length : reached ? 4 : 0;
  const rightOn = desktop ? progress >= SINCE_AT : reached;
  const since = profile.stats[0];
  const shown = Math.max(step, 0) + 1;

  // Desktop: how far the paragraphs slide up so the newest one shows whole.
  const windowRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const [lift, setLift] = useState(0);
  useLayoutEffect(() => {
    const win = windowRef.current;
    const stack = stackRef.current;
    if (!desktop || !win || !stack) {
      setLift(0);
      return undefined;
    }
    const measure = () => setLift(Math.max(0, Math.ceil(stack.scrollHeight - win.clientHeight)));
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(win);
    ro?.observe(stack);
    return () => ro?.disconnect();
  }, [desktop, shownParas]);

  return (
    <section ref={ref} id="about" data-testid="about-section" className={s.section}>
      <div className={s.stage}>
        <SectionBackdrop scene="about" />

        <div className={s.left}>
          <div className={s.reveal} data-on={reached}>
            <p className="section-pill">
              <span className="lg:hidden">
                <Num value="4" /> ·&nbsp;
              </span>
              WHO
            </p>
            <h2 className={`section-title ${s.title}`}>
              The human
              <br />
              behind the <br className="md:hidden" />
              machine
            </h2>
          </div>
          <div
            ref={windowRef}
            className={s.textWindow}
            data-lifted={desktop && lift > 0}
            data-testid="about-text"
          >
            <div
              ref={stackRef}
              className={s.textStack}
              style={desktop ? { transform: `translateY(${-lift}px)` } : undefined}
            >
              {PARAGRAPHS.map((p, i) => (
                <p
                  key={i}
                  className={`${s.reveal} ${s.para} ${p.kind === "bio" ? s.intro : s.story}`}
                  data-on={i < shownParas}
                  data-dim={desktop && lift > 0 && i < shownParas - 1}
                  data-testid={`about-paragraph-${i + 1}`}
                >
                  {p.text}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Nothing here shows until the fourth paragraph is out. */}
        <div className={s.right}>
          {since && (
            <div
              className={`${s.reveal} ${s.slow} ${s.since}`}
              data-on={rightOn}
              data-testid="about-stat-code"
            >
              <div className={s.sinceLabel}>{since.label}</div>
              <div className={s.year}>{since.value}</div>
            </div>
          )}

          <div aria-hidden="true" className={`${s.reveal} ${s.accent}`} data-on={rightOn}>
            <span />
            <span />
          </div>

          <div className={s.principles}>
            {manifesto.map((p, i) => (
              <article
                key={p.num}
                data-testid={`manifesto-chapter-${p.num}`}
                className={`${s.reveal} ${s.slow} ${s.principle}`}
                data-on={desktop ? progress >= (PRINCIPLE_AT[i] ?? 1) : reached}
              >
                <Num value={p.num} className={s.principleNum} />
                <div>
                  <h3 className={s.principleTitle}>{p.title}</h3>
                  <p className={s.principleText}>{p.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile step counter: Ø4.x / Ø4.3 and three bars. */}
        <div className={s.counter} aria-hidden="true">
          <span>
            <b>Ø4.{shown}</b> <span className={s.counterTotal}>/ Ø4.{STEPS}</span>
          </span>
          <span className={s.bars}>
            {Array.from({ length: STEPS }, (_, k) => (
              <span key={k} data-on={k < shown} />
            ))}
          </span>
        </div>
      </div>
    </section>
  );
};
