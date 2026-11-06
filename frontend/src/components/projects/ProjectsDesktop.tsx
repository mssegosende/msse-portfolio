import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, MotionConfig, type Variants } from "framer-motion";
import {
  PROJECTS_INTRO,
  showcaseProjects as PROJECTS,
  type ShowcaseProject,
} from "@/data/projectsData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { scrollToY } from "@/hooks/useLenis";
import { SectionBackdrop } from "../SectionBackdrop";
import { Num } from "../Num";
import { seekToStart } from "./clip";
import { GifPlayer } from "./GifPlayer";
import { CardText, ProjectFrame, ScrollText } from "./ProjectCard";
import s from "./projects.module.css";

const N = PROJECTS.length;
const VISIBLE = 3; // folders on screen in the row

// The mock's layout (scene-3-projects-*.dc.html) at 1440 x 900: cards drawn in
// their own units and zoomed by 0.88. The whole card area scales with the
// viewport on top of that.
const MOCK_ZOOM = 0.88;
const FEATURED = { width: 1180, height: 540 }; // mock units
const ROW = { width: 375, height: 584, pitch: 402.27 }; // (330 + 24) / 0.88
// Mock units: featured card to folder row, and below the row.
const ROW_GAP = 64;
const BOTTOM = 120;
const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

/** min(vw / 1440, vh / 900), kept within reason. */
const stageScale = () =>
  Math.min(1.25, Math.max(0.6, Math.min(innerWidth / 1440, innerHeight / 900)));

/** Top of the floating dock, on screen (the bottom of the free space). */
const dockTop = () => {
  const dock = document.querySelector("[data-dock-slot]");
  const top = dock?.getBoundingClientRect().top;
  return top && top > innerHeight / 2 ? top : innerHeight - 88;
};

/**
 * The layout, in px from the section top: the featured card centred between
 * the title block and the dock on the first screen, the folder row right
 * below it (it peeks over the dock on arrival).
 */
const useLayout = (headRef: RefObject<HTMLDivElement | null>) => {
  const [layout, setLayout] = useState({ k: 1, featuredTop: 260, rowTop: 790, height: 1400 });
  useLayoutEffect(() => {
    const measure = () => {
      const k = stageScale();
      const u = MOCK_ZOOM * k; // one mock unit in px
      const head = headRef.current;
      const headBottom = head
        ? Math.max(
            ...[...head.children].map((c) => {
              const el = c as HTMLElement;
              return el.offsetTop + el.offsetHeight;
            }),
          )
        : 170;
      const free = dockTop() - headBottom;
      const featuredTop = Math.round(headBottom + Math.max(24, (free - FEATURED.height * u) / 2));
      const rowTop = Math.round(featuredTop + (FEATURED.height + ROW_GAP) * u);
      const height = Math.round(rowTop + (ROW.height + BOTTOM) * u);
      setLayout((cur) =>
        cur.k === k &&
        cur.featuredTop === featuredTop &&
        cur.rowTop === rowTop &&
        cur.height === height
          ? cur
          : { k, featuredTop, rowTop, height },
      );
    };
    measure();
    window.addEventListener("resize", measure);
    void document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [headRef]);
  return layout;
};

// The incoming featured card rises over the outgoing one, which then sinks away.
const featuredVariants: Variants = {
  hidden: { opacity: 0, y: 40, zIndex: 2 },
  show: { opacity: 1, y: 0, zIndex: 2, transition: { duration: 0.65, ease: EASE, delay: 0.15 } },
  gone: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    zIndex: 1,
    transition: { duration: 0.45, ease: "easeOut", delay: 0.4 },
  },
};

// Row cards sit at x = slot * pitch. An arrow slides the row by one folder,
// the new one coming in from that side (custom: +1 next, -1 previous).
const rowVariants: Variants = {
  hidden: (dir: number) => ({ opacity: 0, x: (dir > 0 ? VISIBLE : -1) * ROW.pitch }),
  gone: (dir: number) => ({
    opacity: 0,
    x: (dir > 0 ? -1 : VISIBLE) * ROW.pitch,
    transition: { duration: 0.45, ease: EASE },
  }),
};

const Folder = ({
  project,
  onPick,
  reduced,
}: {
  project: ShowcaseProject;
  onPick: () => void;
  reduced: boolean;
}) => (
  <button
    type="button"
    className={s.folder}
    onClick={(e) => {
      e.stopPropagation(); // the card around it picks too
      onPick();
    }}
    aria-label={`Show ${project.name} in the featured spot`}
    data-testid={`project-folder-${project.id}`}
  >
    <span className={s.folderBack} style={{ background: project.art }}>
      <video
        className={s.video}
        src={project.media}
        poster={project.poster}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="metadata"
        onLoadedMetadata={(e) => seekToStart(e.currentTarget, project.startAt)}
        aria-hidden="true"
        tabIndex={-1}
      />
    </span>
    <span aria-hidden="true" className={s.folderEdge} />
    <span aria-hidden="true" className={s.folderFlap} />
    <span aria-hidden="true" className={s.folderLabel}>
      <span className={s.folderName} style={{ display: "block" }}>
        {project.name}
      </span>
      <span className={s.folderMeta} style={{ display: "block" }}>
        <Num value={project.num} /> · GIF
      </span>
    </span>
  </button>
);

/**
 * Desktop scene 3, a normal scrolling section (no pin; scroll never moves the
 * cards): the featured reel on top (each clip plays and hands the spot to the
 * next project, through all of them) and the folder row right below, three
 * folders with ‹ › to move through the projects one at a time, wrapping.
 * Picking a folder sends that project up to the featured spot.
 */
export const ProjectsDesktop = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const { k, featuredTop, rowTop, height } = useLayout(headRef);

  // The reel only runs while the featured card is mostly on screen.
  const featuredRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = featuredRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), {
      threshold: 0.6,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [f, setF] = useState(0);
  // null: the default, which is paused only with reduced motion.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const [hovered, setHovered] = useState(false);

  // The row: the first visible project (ring index) and the last arrow's direction.
  const [offset, setOffset] = useState(1);
  const [dir, setDir] = useState(1);
  const shift = (d: number) => {
    setDir(d);
    setOffset((o) => (o + d + N) % N);
  };

  const project = PROJECTS[f]!;
  const next = PROJECTS[(f + 1) % N]!;
  const advance = useCallback(() => setF((i) => (i + 1) % N), []);
  const playing = onScreen && !paused && !hovered;
  const row = Array.from({ length: VISIBLE }, (_, slot) => {
    const ring = (offset + slot) % N;
    return { slot, ring, p: PROJECTS[ring]! };
  });

  const pick = (ring: number) => {
    setF(ring);
    // Bring the featured card into view: the section as it first arrives.
    const el = sectionRef.current;
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
  };

  const area = {
    position: "absolute" as const,
    left: "50%",
    width: FEATURED.width * MOCK_ZOOM * k,
    marginLeft: (-FEATURED.width / 2) * MOCK_ZOOM * k,
    zIndex: 7,
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-testid="projects-section"
      className="relative overflow-hidden"
      style={{ height, background: "var(--bg-projects)" }}
    >
      <SectionBackdrop scene="projects" />

      <div ref={headRef} className="absolute inset-x-0 top-0 z-[5]">
        {/* One title block: the intro sits a fixed 64px after the title (the
            mock's x = 640 at 1440), so it stays with it at any width. */}
        <div className="absolute left-14 top-[52px] flex items-start gap-16">
          <div className="flex-none">
            <p className="section-pill">SELECTED WORK</p>
            <h2 className="section-title mt-4">Projects</h2>
          </div>
          <p className="m-0 mt-11 max-w-[400px] font-inter text-[15px] leading-[1.6] text-[#252B31] dark:text-[#C9D0D7]">
            {PROJECTS_INTRO}
          </p>
        </div>
      </div>

      <MotionConfig reducedMotion="user">
        <div
          ref={featuredRef}
          style={{ ...area, top: featuredTop, height: FEATURED.height * MOCK_ZOOM * k }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div
            className="relative"
            style={{ zoom: MOCK_ZOOM * k, width: FEATURED.width, height: FEATURED.height }}
          >
            <AnimatePresence initial={false}>
              <motion.article
                key={`featured-${project.id}`}
                variants={featuredVariants}
                initial="hidden"
                animate="show"
                exit="gone"
                className={`${s.frame} ${s.lg}`}
                style={{ position: "absolute", left: 0, top: 0, ...FEATURED }}
                aria-label={`Featured project: ${project.name}`}
                data-testid="project-featured"
              >
                <ProjectFrame
                  project={project}
                  contentStyle={{
                    height: "calc(100% - 28px)",
                    boxSizing: "border-box",
                    padding: "36px 40px 64px",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.2fr)",
                    gridTemplateRows: "minmax(0, 1fr)",
                    gap: 40,
                    alignItems: "center",
                  }}
                >
                  <ScrollText style={{ maxHeight: "100%" }}>
                    <CardText project={project} format="featured" />
                  </ScrollText>
                  <div>
                    <GifPlayer
                      key={project.id}
                      project={project}
                      nextName={next.name}
                      playing={playing}
                      paused={paused}
                      onToggle={() => setUserPaused(!paused)}
                      onEnded={reduced ? undefined : advance}
                    />
                  </div>
                </ProjectFrame>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        <div
          style={{ ...area, top: rowTop, height: ROW.height * MOCK_ZOOM * k }}
          role="group"
          aria-label="All projects"
          data-testid="projects-row"
        >
          <div
            className="relative"
            style={{ zoom: MOCK_ZOOM * k, width: FEATURED.width, height: ROW.height }}
          >
            <button
              type="button"
              className={s.arrow}
              style={{ left: -66 }}
              onClick={() => shift(-1)}
              aria-label="Previous project"
              data-testid="projects-row-prev"
            >
              ‹
            </button>
            <button
              type="button"
              className={s.arrow}
              style={{ left: FEATURED.width + 16 }}
              onClick={() => shift(1)}
              aria-label="Next project"
              data-testid="projects-row-next"
            >
              ›
            </button>
            <AnimatePresence initial={false} custom={dir}>
              {row.map(({ slot, ring, p }) => (
                <motion.article
                  key={`row-${p.id}`}
                  custom={dir}
                  variants={rowVariants}
                  initial="hidden"
                  animate={{
                    opacity: 1,
                    x: slot * ROW.pitch,
                    transition: { duration: 0.45, ease: EASE },
                  }}
                  exit="gone"
                  className={`${s.frame} ${s.lg} cursor-pointer`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: ROW.width,
                    height: ROW.height,
                  }}
                  onClick={() => pick(ring)}
                  data-testid={`project-card-${p.id}`}
                >
                  <ProjectFrame
                    project={p}
                    contentStyle={{
                      height: "calc(100% - 28px)",
                      boxSizing: "border-box",
                      padding: "20px 20px 60px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Folder project={p} onPick={() => pick(ring)} reduced={reduced} />
                    <ScrollText style={{ flex: "1 1 auto", minHeight: 0 }}>
                      <CardText project={p} format="row" tagsTop={16} />
                    </ScrollText>
                  </ProjectFrame>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    </section>
  );
};
