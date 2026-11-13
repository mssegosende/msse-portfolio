import { useCallback, useEffect, useRef, useState } from "react";
import {
  PROJECTS_INTRO,
  projectLinks,
  showcaseProjects as PROJECTS,
  type ShowcaseProject,
} from "@/data/projectsData";
import { profile } from "@/data/portfolioData";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useNearView } from "@/hooks/useNearView";
import { useProjectsInView } from "@/hooks/useProjectsInView";
import { clampScale, useFrame } from "@/hooks/useFrame";
import { scrollToY } from "@/hooks/useLenis";
import { Num } from "../Num";
import { TerminalWindow } from "../crt/CrtPieces";
import { seekToStart } from "./clip";
import { GifPlayer } from "./GifPlayer";
import { FitName, ScrollText } from "./ProjectCard";
import { ProjectMedia } from "./ProjectMedia";
import { useCrossfade } from "@/hooks/useSectionDissolve";
import { useOwnsCenter } from "@/hooks/useOwnsCenter";

const N = PROJECTS.length;
/** The head and the featured card at zoom 1, px (measured at 1440). */
const FIRST_SCREEN = 800;
/** Under the content: the dock's height and its gap. */
const DOCK_ROOM = 96;

const NODES = [
  "left-[-4px] top-[-4px]",
  "right-[-4px] top-[-4px]",
  "bottom-[-4px] left-[-4px]",
  "bottom-[-4px] right-[-4px]",
];
const Nodes = () => (
  <>
    {NODES.map((pos) => (
      <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
    ))}
  </>
);

/** LIVE > (and CODE > if it is ever shown): only the links a project has. */
export const ProjectLinks = ({ project }: { project: ShowcaseProject }) => {
  const links = projectLinks(project);
  if (!links.length) return null;
  return (
    <div className="flex border-t border-crt-line">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${project.name}: ${l.label} (opens in a new tab)`}
          data-testid={`project-${l.label.toLowerCase()}-link-${project.id}`}
          className="crt-link flex min-h-11 flex-1 items-center justify-center font-vt text-[20px] uppercase tracking-[0.14em]"
        >
          {l.label} &gt;
        </a>
      ))}
    </div>
  );
};

/** Ø3.x and, where the copy gives one, the status (IN PROGRESS). */
const CardHead = ({
  project,
  featured = false,
}: {
  project: ShowcaseProject;
  featured?: boolean;
}) => (
  <div
    className={`flex items-center justify-between border-b border-crt-line font-vt tracking-[0.12em] ${
      featured ? "h-12 px-[22px] text-[22px]" : "h-[42px] px-4 text-[20px]"
    }`}
  >
    <span className="text-[var(--crt-row-value)]">
      <Num value={project.num} />
    </span>
    {featured ? (
      <span className="text-crt-dim">FEATURED</span>
    ) : (
      project.status && (
        <span className="crt-status flex items-center gap-1.5 uppercase">
          <span aria-hidden="true" className="crt-status__dot" />
          {project.status}
        </span>
      )
    )}
  </div>
);

const Chips = ({ tags }: { tags: string[] }) => (
  <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Stack">
    {tags.map((t) => (
      <li key={t} className="crt-chip">
        {t}
      </li>
    ))}
  </ul>
);

/**
 * A grid card's media: the poster, and the clip only while the visitor hovers
 * or focuses the card (never with reduced motion), so the featured clip is the
 * only one decoding the rest of the time. A click sends the project up.
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
      className="block w-full text-left"
      onClick={(e) => {
        e.stopPropagation(); // the card around it picks too
        onPick();
      }}
      // Keyboard focus only: a click focuses the button too.
      onFocus={(e) => onFocusChange(e.currentTarget.matches(":focus-visible"))}
      onBlur={() => onFocusChange(false)}
      aria-label={`Show ${project.name} in the featured spot`}
      data-testid={`project-folder-${project.id}`}
    >
      <ProjectMedia project={project} className="border border-[var(--crt-line-row)]">
        {armed ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={project.media}
            poster={project.poster}
            muted
            loop
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => seekToStart(e.currentTarget, project.startAt)}
            aria-hidden="true"
            tabIndex={-1}
          />
        ) : undefined}
      </ProjectMedia>
    </button>
  );
};

/** The section head: label, PROJECTS, intro (Projects.dc.html). */
export const ProjectsHead = ({ isMobile }: { isMobile: boolean }) => (
  <div className={`relative flex flex-col ${isMobile ? "gap-3" : "max-w-[760px] gap-4"}`}>
    {/* Plain VT323, no box, as scene 2's label (María Sol, 13 Nov). */}
    <span
      className={`crt-section-label self-start font-vt tracking-[0.14em] ${
        isMobile ? "text-[18px]" : "text-[22px]"
      }`}
    >
      03 // SELECTED WORK
    </span>
    <h2
      className={`crt-glow m-0 font-michroma font-normal uppercase tracking-[0.04em] text-crt-title ${
        isMobile ? "text-[40px]" : "text-[72px]"
      }`}
    >
      Projects
    </h2>
    <p
      className={`m-0 text-crt-text-2 ${isMobile ? "text-[15px] leading-[1.55]" : "text-[17px] leading-[1.6]"}`}
    >
      {PROJECTS_INTRO}
    </p>
  </div>
);

/** The terminal tile: msse@core: ~/projects, linking to GitHub. */
const TerminalTile = () => (
  <TerminalWindow title="msse@core: ~/projects" className="crt-term--tile flex flex-col">
    <div className="flex flex-1 flex-col gap-1.5 px-[18px] py-[22px] font-mono text-[14px] leading-[1.7] text-crt-text-2">
      <div>
        <span className="crt-prompt">$</span>{" "}
        <span className="text-[var(--crt-row-value)]">ls ~/projects</span>
      </div>
      <div>blaze/ alphecca/ polaris/</div>
      <div>lynx/ ethos/ marvel-characters/</div>
      <div className="mt-3">
        <span className="crt-prompt">$</span>{" "}
        <span className="text-[var(--crt-row-value)]">open github</span>
      </div>
      <div>the cheat-sheet series and the rest live there.</div>
      <div>
        <span className="crt-prompt">$</span> <span aria-hidden="true" className="crt-cursor" />
      </div>
    </div>
    <a
      href={profile.socials.github}
      target="_blank"
      rel="noopener noreferrer"
      className="crt-link flex min-h-12 items-center justify-center border-t border-crt-line font-vt text-[20px] tracking-[0.14em]"
    >
      GITHUB · MSSEGOSENDE &gt;
    </a>
  </TerminalWindow>
);

/**
 * Desktop scene 3 (Projects.dc.html): the featured card (media left, info
 * right), then the grid of the other five and the terminal tile. The featured
 * clip plays and hands the spot to the next project, through all of them;
 * picking a card sends that project up, and the one it replaces joins the grid.
 */
export const ProjectsDesktop = () => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sectionRef = useRef<HTMLElement>(null);
  const wordShown = useOwnsCenter(sectionRef);
  useProjectsInView(sectionRef);
  // Scene 2 -> 3: Projects comes in over scene 2's exit, pinned at the top.
  useCrossfade(sectionRef, null, true, -1);
  // The section is the 1440-wide design scaled to the window's width (María
  // Sol, 12 Nov: the cards keep their share of the frame, type and all).
  // Capped by the height so the head and the featured card fit the first
  // screen, above the dock (María Sol, 13 Nov).
  const { kw, height } = useFrame();
  const zoom = clampScale(Math.min(kw, (height - DOCK_ROOM) / FIRST_SCREEN), 0.7, 2);
  // The content's height, for its sticky last screen.
  const holdRef = useRef<HTMLDivElement>(null);
  const [holdH, setHoldH] = useState(900);
  useEffect(() => {
    const el = holdRef.current;
    if (!el) return undefined;
    const measure = () => setHoldH(el.offsetHeight);
    measure();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
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
  // The clip loads only once the card is a screen away (the poster until then).
  const near = useNearView(featuredRef);

  const [f, setF] = useState(0);
  // null: the default, which is paused only with reduced motion.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduced;
  const [hovered, setHovered] = useState(false);

  const project = PROJECTS[f]!;
  const next = PROJECTS[(f + 1) % N]!;
  const advance = useCallback(() => setF((i) => (i + 1) % N), []);
  // One project clip at a time: while a grid card plays its clip (hover or
  // keyboard focus), the reel rests. Two decoding together held projects at
  // 30 fps once the featured card stayed in view under the grid (R116).
  const gridClip = !reduced && (hoverId !== null || focusId !== null);
  const playing = onScreen && !paused && !hovered && !gridClip;
  // The grid: the other five, in reel order from the one after the featured.
  const grid = Array.from({ length: N - 1 }, (_, k) => (f + 1 + k) % N);

  const pick = (ring: number) => {
    setF(ring);
    // Bring the featured card into view.
    const el = featuredRef.current;
    if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY - 96);
  };

  return (
    <section
      ref={sectionRef}
      id="projects"
      data-testid="projects-section"
      // xf-overlap: the section crossfades (useSectionDissolve).
      // overflow-x-clip, not hidden: the last screen is sticky.
      className="xf-overlap relative overflow-x-clip bg-crt-bg"
    >
      <div aria-hidden="true" className="crt-grid absolute inset-0" />
      <div
        aria-hidden="true"
        data-shown={wordShown}
        className="crt-bg-word absolute -right-5 top-10 font-michroma leading-none"
        style={{ fontSize: 260 * zoom }}
      >
        WORK
      </div>

      {/* The content holds its last screen for the crossfade into About
          (sticky at its own bottom; the xf-tail after it gives it the room).
          --xf-pin: once its own pin is over, the section is drawn a pin's
          length lower than its box (GSAP's translate), and sticky works on
          the box. */}
      <div
        ref={holdRef}
        className="sticky"
        style={{ top: `calc(100vh - ${holdH}px - var(--xf-pin, 0px))` }}
      >
        <div
          className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-16 pb-[112px] pt-11"
          style={{ zoom }}
        >
          <div data-xf="head">
            <ProjectsHead isMobile={false} />
          </div>

          <div
            ref={featuredRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <article
              key={project.id}
              aria-label={`Featured project: ${project.name}`}
              data-testid="project-featured"
              className="crt-frame crt-fade-in relative grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
            >
              <Nodes />
              <div className="border-r border-crt-line p-5">
                <GifPlayer
                  project={project}
                  nextName={next.name}
                  playing={playing}
                  paused={paused}
                  onToggle={() => setUserPaused(!paused)}
                  onEnded={reduced ? undefined : advance}
                  preload={near ? "auto" : "none"}
                />
              </div>
              {/* The info column takes the media's height; longer copy scrolls. */}
              <div className="relative min-h-0">
                <div className="absolute inset-0 flex flex-col">
                  <CardHead project={project} featured />
                  <div className="flex min-h-0 flex-1 flex-col gap-3 px-[22px] pb-[22px] pt-[26px]">
                    <FitName
                      as="h3"
                      name={project.name}
                      size={48}
                      className="crt-name m-0 font-michroma font-normal uppercase leading-[1.1] tracking-[0.04em]"
                    />
                    <div className="font-vt text-[20px] uppercase tracking-[0.12em] text-crt-dim">
                      {project.subtitle}
                    </div>
                    <ScrollText style={{ flex: "1 1 auto", minHeight: 0, marginTop: 6 }}>
                      {project.paragraphs.map((p) => (
                        <p
                          key={p.slice(0, 32)}
                          className="m-0 mb-3 text-[15px] leading-[1.6] text-crt-text-2"
                        >
                          {p}
                        </p>
                      ))}
                    </ScrollText>
                  </div>
                  <div className="border-t border-[var(--crt-line-row)] px-[22px] pb-5 pt-3.5">
                    <Chips tags={project.tags} />
                  </div>
                  <ProjectLinks project={project} />
                </div>
              </div>
            </article>
          </div>

          <div
            role="group"
            aria-label="All projects"
            data-testid="projects-row"
            data-xf="cards"
            className="grid grid-cols-3 gap-8"
          >
            {grid.map((ring) => {
              const p = PROJECTS[ring]!;
              return (
                <article
                  key={p.id}
                  className="crt-frame relative flex cursor-pointer flex-col"
                  onClick={() => pick(ring)}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId((h) => (h === p.id ? null : h))}
                  data-testid={`project-card-${p.id}`}
                >
                  <Nodes />
                  <CardHead project={p} />
                  <div className="px-3.5 pt-3.5">
                    <Folder
                      project={p}
                      onPick={() => pick(ring)}
                      active={!reduced && (hoverId === p.id || focusId === p.id)}
                      onFocusChange={(on) =>
                        setFocusId((cur) => (on ? p.id : cur === p.id ? null : cur))
                      }
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-4 pt-[18px]">
                    <FitName
                      as="h3"
                      name={p.name}
                      size={22}
                      className="crt-name crt-name--sm m-0 font-michroma font-normal uppercase tracking-[0.04em]"
                    />
                    <div className="font-vt text-[18px] uppercase tracking-[0.1em] text-crt-dim">
                      {p.subtitle}
                    </div>
                    <ScrollText style={{ maxHeight: 132, marginTop: 4 }}>
                      {p.paragraphs.map((t) => (
                        <p
                          key={t.slice(0, 32)}
                          className="m-0 mb-2.5 text-[14px] leading-[1.55] text-crt-text-2"
                        >
                          {t}
                        </p>
                      ))}
                    </ScrollText>
                  </div>
                  <div className="px-4 py-3.5">
                    <Chips tags={p.tags} />
                  </div>
                  <ProjectLinks project={p} />
                </article>
              );
            })}
            <TerminalTile />
          </div>
        </div>
      </div>
      {/* The room the sticky content holds in (a box: sticky stops at the
          section's content edge, so padding would give it none). */}
      <div aria-hidden="true" className="xf-tail" />
      <div aria-hidden="true" className="crt-scanlines absolute inset-0" />
    </section>
  );
};
