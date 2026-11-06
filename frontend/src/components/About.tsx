import { useRef } from "react";
import { profile, manifesto } from "../data/portfolioData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionStep } from "../hooks/useSectionStep";
import { SectionBackdrop } from "./SectionBackdrop";
import { Num } from "./Num";
import s from "./About.module.css";

const STEPS = 3;

/**
 * Scene 4 · WHO (design/source/{desktop,mobile}/light/scene-4-about.dc.html).
 * Desktop: the section pins for three steps — Ø4.1 the text, Ø4.2 the story
 * (in place of the Ø4.1 text) + "since 2022", Ø4.3 the principles. Mobile: one column, all shown.
 */
export const About = () => {
  const ref = useRef<HTMLElement>(null);
  const step = useSectionStep(ref, STEPS);
  const desktop = useMediaQuery("(min-width: 1024px)");
  // Mobile shows everything once the section is reached.
  const on = (n: number) => step >= (desktop ? n : 0);
  const since = profile.stats[0];
  const shown = Math.max(step, 0) + 1;

  return (
    <section ref={ref} id="about" data-testid="about-section" className={s.section}>
      <div className={s.stage}>
        <SectionBackdrop scene="about" />

        <div className={s.left}>
          <div className={s.reveal} data-on={on(0)}>
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
          {/* Desktop: Ø4.2's story takes the place of Ø4.1's text (same spot,
              one at a time, so the longer copy clears the dock). Mobile: both. */}
          <div className={s.swap}>
            <div className={s.reveal} data-on={desktop ? step === 0 : on(0)}>
              {profile.bio.map((para, i) => (
                <p key={i} className={s.intro}>
                  {para}
                </p>
              ))}
            </div>
            <div className={`${s.reveal} ${s.piano}`} data-on={on(1)}>
              {profile.story.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        <div className={s.right}>
          {since && (
            <div className={`${s.reveal} ${s.since}`} data-on={on(1)} data-testid="about-stat-code">
              <div className={s.sinceLabel}>{since.label}</div>
              <div className={s.year}>{since.value}</div>
            </div>
          )}

          <div aria-hidden="true" className={`${s.reveal} ${s.accent}`} data-on={on(2)}>
            <span />
            <span />
          </div>

          <div className={s.principles}>
            {manifesto.map((p, i) => (
              <article
                key={p.num}
                data-testid={`manifesto-chapter-${p.num}`}
                className={`${s.reveal} ${s.principle}`}
                data-on={on(2)}
                style={{ transitionDelay: desktop && on(2) ? `${i * 0.15}s` : undefined }}
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
