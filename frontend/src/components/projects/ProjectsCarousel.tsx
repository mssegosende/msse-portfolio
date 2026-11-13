import { useCallback, useEffect, useRef, useState } from "react";
import { bakedMedia, showcaseProjects as PROJECTS } from "@/data/projectsData";
import { useTheme } from "@/hooks/useTheme";
import { useOwnsCenter } from "@/hooks/useOwnsCenter";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNearView } from "@/hooks/useNearView";
import { useProjectsInView } from "@/hooks/useProjectsInView";
import { Num } from "../Num";
import { GifPlayer } from "./GifPlayer";
import { FitName, ScrollText } from "./ProjectCard";
import { ProjectLinks, ProjectsHead } from "./ProjectsDesktop";
import s from "./projects.module.css";

const GAP = 14;
const EDGE = 20; // the track's left padding (scroll-padding)

const NODES = [
  "left-[-4px] top-[-4px]",
  "right-[-4px] top-[-4px]",
  "bottom-[-4px] left-[-4px]",
  "bottom-[-4px] right-[-4px]",
];

/**
 * Phone scene 3 (ProjectsM.dc.html): a scroll-snap carousel, one card per
 * swipe, the next one peeking from the right. The clip on screen plays and,
 * when it ends, the carousel moves on; with reduced motion only on swipe.
 */
export const ProjectsCarousel = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dark = useTheme().theme === "dark";
  const sectionRef = useRef<HTMLElement>(null);
  const wordShown = useOwnsCenter(sectionRef);
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
  const total = String(PROJECTS.length).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-testid="projects-section"
      className="relative overflow-hidden bg-crt-bg pb-28 pt-14"
    >
      <div aria-hidden="true" className="crt-grid absolute inset-0" />
      <div
        aria-hidden="true"
        data-shown={wordShown}
        className="crt-bg-word absolute -right-[30px] top-10 font-michroma text-[110px] leading-none"
      >
        WORK
      </div>
      <div className="relative px-5">
        <ProjectsHead isMobile />
      </div>

      <div
        ref={trackRef}
        className={`${s.carousel} crt-carousel relative mt-7`}
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
              className="crt-frame crt-slide relative flex flex-col"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${PROJECTS.length}: ${p.name}`}
              data-testid={`project-card-${p.id}`}
            >
              {NODES.map((pos) => (
                <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
              ))}
              <div className="flex h-10 items-center justify-between border-b border-crt-line px-3.5 font-vt text-[19px] tracking-[0.12em]">
                <span className="text-[var(--crt-row-value)]">
                  <Num value={p.num} />
                </span>
                {(i === 0 || p.status) && (
                  <span className="crt-status flex items-center gap-1.5 uppercase">
                    <span aria-hidden="true" className="crt-status__dot" />
                    {i === 0 ? "FEATURED" : p.status}
                  </span>
                )}
              </div>
              <div className="px-3 pt-3">
                <GifPlayer
                  compact
                  project={p}
                  nextName={next.name}
                  playing={i === idx && inView && !paused}
                  preload={i === idx && near ? "auto" : "none"}
                  paused={paused}
                  onToggle={() => setUserPaused(!paused)}
                  onEnded={reduced ? undefined : advance}
                  // The phosphor / ink look baked in (María Sol, 13 Nov:
                  // the live filter left the clips in full colour on phones).
                  baked={bakedMedia(p, dark)}
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-3.5 pt-4">
                <FitName
                  as="h3"
                  name={p.name}
                  size={19}
                  className="crt-name crt-name--sm m-0 font-michroma font-normal uppercase tracking-[0.04em]"
                />
                <div className="font-vt text-[17px] uppercase tracking-[0.08em] text-crt-dim">
                  {p.subtitle}
                </div>
                <ScrollText style={{ flex: "1 1 auto", minHeight: 0, marginTop: 4 }}>
                  {p.paragraphs.map((t) => (
                    <p
                      key={t.slice(0, 32)}
                      className="m-0 mb-2.5 text-[14px] leading-[1.5] text-crt-text-2"
                    >
                      {t}
                    </p>
                  ))}
                </ScrollText>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 px-3.5 py-3" aria-label="Stack">
                {p.tags.map((t) => (
                  <li key={t} className="crt-chip crt-chip--sm">
                    {t}
                  </li>
                ))}
              </ul>
              <ProjectLinks project={p} />
            </article>
          );
        })}
      </div>

      <div className="relative mx-5 mt-[18px] flex items-center justify-between">
        <span className="flex gap-1.5" aria-hidden="true">
          {PROJECTS.map((p, i) => (
            <span key={p.id} className={`crt-pager ${i === idx ? "crt-pager--on" : ""}`} />
          ))}
        </span>
        <button
          type="button"
          onClick={advance}
          className="crt-skip -mr-2 min-h-11 px-2 font-vt text-[18px] tracking-[0.12em]"
          aria-label="Next project"
        >
          <span aria-live="polite">
            {String(idx + 1).padStart(2, "0")} / {total}
          </span>{" "}
          · SWIPE &gt;
        </button>
      </div>
      <div aria-hidden="true" className="crt-scanlines absolute inset-0" />
    </section>
  );
};
