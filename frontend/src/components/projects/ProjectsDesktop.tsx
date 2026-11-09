import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, MotionConfig, type Variants } from "framer-motion";
import {
  PROJECTS_INTRO,
  showcaseProjects as PROJECTS,
  type ShowcaseProject,
} from "@/data/projectsData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useProjectsInView } from "@/hooks/useProjectsInView";
import { scrollToY } from "@/hooks/useLenis";
import { SectionBackdrop } from "../SectionBackdrop";
import { Num } from "../Num";
import { seekToStart } from "./clip";
import { GifPlayer } from "./GifPlayer";
import { CardText, FitName, ProjectFrame, ScrollText } from "./ProjectCard";
import s from "./projects.module.css";

const N = PROJECTS.length;
const VISIBLE = 3; // folders on screen in the row
const OTHERS = N - 1; // the row's projects: all but the featured one

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
 * Where the title's letters end, in px from the section top: PROJECTS is all
 * caps, so its baseline (a zero-height probe sits on it), not its line box,
 * whose half-leading and descender space read as empty.
 */
const titleInkBottom = (head: HTMLElement) => {
  const title = head.querySelector("h2");
  if (!title) return null;
  const probe = document.createElement("span");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  title.appendChild(probe);
  const y = probe.getBoundingClientRect().top - head.getBoundingClientRect().top;
  probe.remove();
  return y;
};

/**
 * The layout, in px from the section top: the featured card centred between
 * the title block and the dock on the first screen, the folder row right
 * below it (it peeks over the dock on arrival). The title block ends where its
 * ink does (María Sol, 9 Nov: the mock's spot read too high, the line box's
 * centre too low; the ink's centre sits between them).
 */
const useLayout = (headRef: RefObject<HTMLDivElement | null>) => {
  const [layout, setLayout] = useState({ k: 1, featuredTop: 260, rowTop: 790, height: 1400 });
  useLayoutEffect(() => {
    const measure = () => {
      const k = stageScale();
      const u = MOCK_ZOOM * k; // one mock unit in px
      const head = headRef.current;
      const intro = head?.querySelector("p:not(.section-pill)") as HTMLElement | null;
      const ink = head ? titleInkBottom(head) : null;
      const headBottom =
        head && ink !== null
          ? Math.max(
              ink,
              intro ? intro.getBoundingClientRect().bottom - head.getBoundingClientRect().top : 0,
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

/**
 * A row card's folder: the clip's poster, played only while the visitor
 * hovers or focuses the card (never with reduced motion), so the featured
 * clip is the only one decoding the rest of the time.
 */
const Folder = ({
  project,
  onPick,
  active,
  onFocusChange,
}: {
  project: ShowcaseProject;
  onPick: () => void;
  active: boolean;
  onFocusChange: (on: boolean) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Nothing loads until the first hover: the poster stands in.
  const [armed, setArmed] = useState(false);
  if (active && !armed) setArmed(true);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) v.play().catch(() => {});
    else v.pause();
  }, [active]);

  return (
    <button
      type="button"
      className={s.folder}
      onClick={(e) => {
        e.stopPropagation(); // the card around it picks too
        onPick();
      }}
      // Keyboard focus only: a click focuses the button too, and the clicked
      // project is on its way to the featured spot.
      onFocus={(e) => onFocusChange(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => onFocusChange(false)}
      aria-label={`Show ${project.name} in the featured spot`}
      data-testid={`project-folder-${project.id}`}
    >
      <span className={s.folderBack} style={{ background: project.art }}>
        <video
          ref={videoRef}
          className={s.video}
          src={project.media}
          poster={project.poster}
          muted
          loop
          playsInline
          preload={armed ? "auto" : "none"}
          onLoadedMetadata={(e) => seekToStart(e.currentTarget, project.startAt)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </span>
      <span aria-hidden="true" className={s.folderEdge} />
      <span aria-hidden="true" className={s.folderFlap}>
        <span
          className={s.flapBlur}
          style={{
            background: project.poster
              ? `url(${project.poster}) center / cover no-repeat`
              : project.art,
          }}
        />
        <span className={s.flapTint} />
      </span>
      <span aria-hidden="true" className={s.folderLabel}>
        <FitName
          name={project.name}
          size={14}
          className={s.folderName}
          style={{ display: "block" }}
        />
        <span className={s.folderMeta} style={{ display: "block" }}>
          <Num value={project.num} /> · GIF
        </span>
      </span>
    </button>
  );
};

/**
 * Desktop scene 3, a normal scrolling section (no pin; scroll never moves the
 * cards): the featured reel on top (each clip plays and hands the spot to the
 * next project, through all of them) and the folder row right below: the
 * other five projects (never the featured one), three at a time, with ‹ › to
 * move through them, wrapping. Picking a folder sends that project up to the
 * featured spot, and the one it replaces joins the row.
 */
export const ProjectsDesktop = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const { k, featuredTop, rowTop, height } = useLayout(headRef);
  useProjectsInView(sectionRef);
  // The row card under the pointer or holding the focus: its folder clip plays.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

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

  // The row: the other five projects, never the featured one, in reel order
  // from the one after it. `offset` is the first one shown (‹ › move it, and
  // it stays put while the featured changes, so the row moves on with the
  // reel); `dir` is the last move's direction.
  const [offset, setOffset] = useState(0);
  const [dir, setDir] = useState(1);
  const shift = (d: number) => {
    setDir(d);
    setOffset((o) => (o + d + OTHERS) % OTHERS);
  };

  const project = PROJECTS[f]!;
  const next = PROJECTS[(f + 1) % N]!;
  const advance = useCallback(() => {
    setDir(1);
    setF((i) => (i + 1) % N);
  }, []);
  const playing = onScreen && !paused && !hovered;
  const row = Array.from({ length: VISIBLE }, (_, slot) => {
    const ring = (f + 1 + ((offset + slot) % OTHERS)) % N;
    return { slot, ring, p: PROJECTS[ring]! };
  });

  const pick = (ring: number) => {
    setDir(1);
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

      <div ref={headRef} className="dissolve-in absolute inset-x-0 top-0 z-[5]">
        {/* One title block: the intro sits a fixed 64px after the title (the
            mock's x = 640 at 1440), so it stays with it at any width. */}
        <div className="absolute left-14 top-[52px] flex items-start gap-16">
          <div className="flex-none">
            <p className="section-pill">SELECTED WORK</p>
            <h2 className="section-title mt-4">Projects</h2>
          </div>
          <p className="m-0 mt-11 max-w-[400px] font-inter text-[15px] leading-[1.6] text-[#252B31] dark:text-[#E9EDF1]">
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
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId((h) => (h === p.id ? null : h))}
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
                    <Folder
                      project={p}
                      onPick={() => pick(ring)}
                      active={!reduced && (hoverId === p.id || focusId === p.id)}
                      onFocusChange={(on) => setFocusId((f) => (on ? p.id : f === p.id ? null : f))}
                    />
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
