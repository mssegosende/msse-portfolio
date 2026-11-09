import { useCallback, useEffect, useRef, useState } from "react";
import { PROJECTS_INTRO, showcaseProjects as PROJECTS } from "@/data/projectsData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNearView } from "@/hooks/useNearView";
import { useProjectsInView } from "@/hooks/useProjectsInView";
import { SectionBackdrop } from "../SectionBackdrop";
import { Num } from "../Num";
import { GifPlayer } from "./GifPlayer";
import { CardText, ProjectFrame, ScrollText } from "./ProjectCard";
import s from "./projects.module.css";

const GAP = 12;
const EDGE = 16; // the track's left padding (scroll-padding)

/**
 * Phone scene 3: one project at a time in the featured format (clip on top,
 * text below), the next one peeking from the right. It advances when the clip
 * ends or on swipe; with reduced motion it only moves on swipe.
 */
export const ProjectsCarousel = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sectionRef = useRef<HTMLElement>(null);
  useProjectsInView(sectionRef);
  const trackRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [inView, setInView] = useState(false);
  // The clips load only once the carousel is a screen away (posters until then).
  const near = useNearView(trackRef);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(!!e?.isIntersecting), {
      threshold: 0.5,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const i = Math.round(el.scrollLeft / (first.offsetWidth + GAP));
    setIdx(Math.max(0, Math.min(PROJECTS.length - 1, i)));
  };

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      const slide = el?.children[i] as HTMLElement | undefined;
      if (!el || !slide) return;
      el.scrollTo({ left: slide.offsetLeft - EDGE, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );
  const advance = useCallback(() => goTo((idx + 1) % PROJECTS.length), [goTo, idx]);

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-testid="projects-section"
      className="relative overflow-hidden pb-28 pt-[26px]"
      style={{ background: "var(--bg-projects)" }}
    >
      <SectionBackdrop scene="projects" />
      <div className="relative z-[5] px-[18px]">
        <p className="section-pill" style={{ padding: "7px 14px", fontSize: 10 }}>
          <Num value="3" />
          &nbsp;· SELECTED WORK
        </p>
        <h2 className="section-title mt-3">Projects</h2>
        <p className="mt-3 font-inter text-[13.5px] leading-[1.55] text-[#252B31] dark:text-[#E9EDF1]">
          {PROJECTS_INTRO}
        </p>
      </div>

      <div
        ref={trackRef}
        className={`${s.carousel} relative z-[7] mt-6`}
        onScroll={onScroll}
        role="region"
        aria-roledescription="carousel"
        aria-label="Projects"
        tabIndex={0}
        data-testid="projects-carousel"
      >
        {PROJECTS.map((p, i) => {
          const next = PROJECTS[(i + 1) % PROJECTS.length]!;
          return (
            <article
              key={p.id}
              className={`${s.frame} ${s.sm} ${s.slide}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${PROJECTS.length}: ${p.name}`}
              data-testid={`project-card-${p.id}`}
            >
              <ProjectFrame
                project={p}
                contentStyle={{
                  height: "calc(100% - 28px)",
                  boxSizing: "border-box",
                  padding: "18px 12px 52px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <GifPlayer
                  compact
                  project={p}
                  nextName={next.name}
                  playing={i === idx && inView && !paused}
                  preload={i === idx && near ? "auto" : "none"}
                  paused={paused}
                  onToggle={() => setUserPaused(!paused)}
                  onEnded={reduced ? undefined : advance}
                />
                <ScrollText style={{ flex: "1 1 auto", minHeight: 0 }}>
                  <CardText project={p} format="phone" tagsTop={16} />
                </ScrollText>
              </ProjectFrame>
            </article>
          );
        })}
      </div>

      <div className="relative z-[6] mx-[18px] flex items-center justify-between font-mono text-[10px] tracking-[0.12em] text-[#14181D] dark:text-[#E9EDF1]">
        <span aria-live="polite">
          <span className="font-semibold">
            <Num value={PROJECTS[idx]!.num} />
          </span>{" "}
          {/* 0.7, not the mock's 0.55: AA 4.5:1 on the light ground too. */}
          <span className="opacity-70">
            / <Num value={PROJECTS[PROJECTS.length - 1]!.num} />
          </span>
        </span>
        <span className={s.dots} aria-hidden="true">
          {PROJECTS.map((p, i) => (
            <span key={p.id} className={`${s.dot} ${i === idx ? s.dotOn : ""}`} />
          ))}
        </span>
        <button
          type="button"
          onClick={advance}
          className="-mr-2 min-h-11 px-2 tracking-[0.12em]"
          aria-label="Next project"
        >
          SWIPE →
        </button>
      </div>
    </section>
  );
};
