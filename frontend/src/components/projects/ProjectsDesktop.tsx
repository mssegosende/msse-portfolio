import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig, type Variants } from "framer-motion";
import {
  PROJECTS_INTRO,
  showcaseProjects as PROJECTS,
  type ShowcaseProject,
} from "@/data/projectsData";
import { SECTIONS } from "@/lib/sections";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SectionBackdrop } from "../SectionBackdrop";
import { Num } from "../Num";
import { GifPlayer } from "./GifPlayer";
import { CardText, ProjectFrame, ScrollText } from "./ProjectCard";
import s from "./projects.module.css";

const SECTION = SECTIONS.findIndex((x) => x.id === "projects");
const LAST_STEP = (SECTIONS[SECTION]?.steps ?? 4) - 1;
const N = PROJECTS.length;
const VISIBLE = 3; // folders on screen in the row

// The mock's layout (scene-3-projects-*.dc.html) at 1440 x 900: cards drawn in
// their own units and zoomed by 0.88. The whole card area scales with the
// viewport on top of that.
const MOCK_ZOOM = 0.88;
const AREA = { top: 232, width: 1038, height: 514 }; // on screen at 1440 x 900
const FEATURED = { top: 13, width: 1180, height: 540 }; // mock units
const ROW = { width: 375, height: 584, pitch: 402.27 }; // (330 + 24) / 0.88
// The section index (lib/sections) spaces the 4 steps evenly over the section
// and scrolls to top + k/4 of its height; >= 400vh keeps Ø3.4 inside the pin.
const SECTION_HEIGHT = "420vh";
const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];

/** min(vw / 1440, vh / 900), kept within reason. */
const useStageScale = () => {
  const read = () => Math.min(1.25, Math.max(0.6, Math.min(innerWidth / 1440, innerHeight / 900)));
  const [k, setK] = useState(read);
  useEffect(() => {
    const onResize = () => setK(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return k;
};

/** AnimatePresence `custom`: what the leaving cards should do. */
interface Leave {
  /** The next view is the featured card. */
  toFeatured: boolean;
  /** Row moved by an arrow: +1 next, -1 previous, 0 not a move. */
  dir: number;
}

const sink = (delay: number) => ({
  opacity: 0,
  y: -10,
  scale: 0.98,
  zIndex: 1,
  transition: { duration: 0.45, ease: "easeOut" as const, delay },
});

// The incoming featured card rises over the outgoing one, which then sinks away.
const featuredVariants: Variants = {
  hidden: { opacity: 0, y: 40, zIndex: 2 },
  show: { opacity: 1, y: 0, zIndex: 2, transition: { duration: 0.65, ease: EASE, delay: 0.15 } },
  gone: (c: Leave) => sink(c.toFeatured ? 0.4 : 0),
};

// Row cards sit at x = slot * pitch. A step adds one rising card; an arrow
// slides the row by one folder, the new one coming in from that side.
const rowVariants: Variants = {
  hidden: ({ slot, dir }: { slot: number; dir: number }) =>
    dir
      ? { opacity: 0, x: (dir > 0 ? VISIBLE : -1) * ROW.pitch, y: 0, zIndex: 2 }
      : { opacity: 0, x: slot * ROW.pitch, y: 40, zIndex: 2 },
  gone: (c: Leave) =>
    c.dir && !c.toFeatured
      ? {
          opacity: 0,
          x: (c.dir > 0 ? -1 : VISIBLE) * ROW.pitch,
          transition: { duration: 0.45, ease: EASE },
        }
      : sink(c.toFeatured ? 0.4 : 0),
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
    onClick={onPick}
    aria-label={`Show ${project.name} in the featured spot`}
    data-testid={`project-folder-${project.id}`}
  >
    <span className={s.folderBack} style={{ background: project.art }}>
      <video
        className={s.video}
        src={project.media}
        muted
        loop
        playsInline
        autoPlay={!reduced}
        preload="metadata"
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
 * Desktop scene 3: a pinned stage. Ø3.1 is the featured reel (each clip plays
 * and hands the spot to the next project, through all of them); Ø3.2–Ø3.4
 * fill a row of three folders, one per step. ‹ › move the row through the
 * projects one folder at a time, wrapping. Picking a folder sends that
 * project to the featured spot.
 */
export const ProjectsDesktop = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const k = useStageScale();
  const { section, step: sectionStep } = useActiveSection();
  // The reel only runs while the pinned stage is actually on screen.
  const stageRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), {
      threshold: 0.6,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const step = section < SECTION ? 0 : section > SECTION ? LAST_STEP : sectionStep;

  const [f, setF] = useState(0);
  // null: the default, which is paused only with reduced motion.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  // A folder pick holds until the visitor scrolls to another step.
  const [pickedAt, setPickedAt] = useState<number | null>(null);
  const picked = step > 0 && pickedAt === step;
  const showFeatured = step === 0 || picked;
  const view = showFeatured ? `featured-${step}` : "row";
  const [hoverView, setHoverView] = useState<string | null>(null);
  const hovered = hoverView === view;

  // The row: the first visible project (ring index) and the last arrow move,
  // which only counts for the step it was made on.
  const [offset, setOffset] = useState(1);
  const [move, setMove] = useState<{ dir: number; step: number } | null>(null);
  const dir = move && move.step === step ? move.dir : 0;
  const shift = (d: number) => {
    setOffset((o) => (o + d + N) % N);
    setMove({ dir: d, step });
  };

  const project = PROJECTS[f]!;
  const next = PROJECTS[(f + 1) % N]!;
  const advance = useCallback(() => setF((i) => (i + 1) % N), []);
  const playing = onScreen && showFeatured && !paused && !hovered;
  const row = showFeatured
    ? []
    : Array.from({ length: Math.min(step, VISIBLE) }, (_, slot) => {
        const ring = (offset + slot) % N;
        return { slot, ring, p: PROJECTS[ring]! };
      });
  const leave: Leave = { toFeatured: showFeatured, dir };

  const pick = (ring: number) => {
    setF(ring);
    setPickedAt(step);
  };

  return (
    <section
      id="projects"
      data-testid="projects-section"
      className="relative"
      style={{ height: SECTION_HEIGHT, background: "var(--bg-projects)" }}
    >
      <div
        ref={stageRef}
        className="sticky top-0 h-screen overflow-hidden"
        style={{ background: "var(--bg-projects)" }}
      >
        <SectionBackdrop scene="projects" />

        <div className="absolute left-14 top-[52px] z-[5]">
          <p className="section-pill">SELECTED WORK</p>
          <h2 className="section-title mt-4">Projects</h2>
        </div>
        <p
          className="absolute top-24 z-[5] m-0 max-w-[400px] font-inter text-[15px] leading-[1.6] text-[#252B31]"
          style={{ left: "44.45%" }}
        >
          {PROJECTS_INTRO}
        </p>

        <div
          className="absolute z-[7]"
          style={{
            left: "50%",
            top: AREA.top * k,
            width: AREA.width * k,
            height: AREA.height * k,
            marginLeft: (-AREA.width / 2) * k,
          }}
        >
          <MotionConfig reducedMotion="user">
            <div
              className="relative"
              style={{ zoom: MOCK_ZOOM * k, width: FEATURED.width, height: ROW.height }}
            >
              {picked && (
                <button
                  type="button"
                  className={s.back}
                  style={{ position: "absolute", left: 0, top: -41 }}
                  onClick={() => setPickedAt(null)}
                >
                  ← ALL PROJECTS
                </button>
              )}
              {!showFeatured && (
                <>
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
                </>
              )}
              <AnimatePresence custom={leave}>
                {showFeatured && (
                  <motion.article
                    key={`featured-${project.id}`}
                    variants={featuredVariants}
                    initial="hidden"
                    animate="show"
                    exit="gone"
                    className={`${s.frame} ${s.lg}`}
                    style={{ position: "absolute", left: 0, ...FEATURED }}
                    onMouseEnter={() => setHoverView(view)}
                    onMouseLeave={() => setHoverView(null)}
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
                )}
                {row.map(({ slot, ring, p }) => (
                  <motion.article
                    key={`row-${p.id}`}
                    variants={rowVariants}
                    custom={{ slot, dir }}
                    initial="hidden"
                    animate={{
                      opacity: 1,
                      x: slot * ROW.pitch,
                      y: 0,
                      zIndex: 2,
                      transition: dir
                        ? { duration: 0.45, ease: EASE }
                        : { duration: 0.65, ease: EASE, delay: 0.15 },
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
          </MotionConfig>
        </div>
      </div>
    </section>
  );
};
