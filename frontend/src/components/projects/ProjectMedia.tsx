import type { CSSProperties, ReactNode } from "react";
import type { ShowcaseProject } from "@/data/projectsData";

// Three thin bands of the poster, offset sideways during the glitch.
const GLITCH_SLICES: { band: string; style: CSSProperties }[] = [
  { band: "a", style: { clipPath: "inset(18% 0 77% 0)", transform: "translateX(7px)" } },
  { band: "b", style: { clipPath: "inset(46% 0 51% 0)", transform: "translateX(-9px)" } },
  { band: "c", style: { clipPath: "inset(71% 0 26% 0)", transform: "translateX(5px)" } },
];

/**
 * A project's 16:10 media in the CRT look (SPEC §4): the clip (or its poster)
 * mapped through the theme's palette filter, inverted first for recordings of
 * the other theme's UI; crosshair corners, scanlines and, every few seconds,
 * a ~150 ms horizontal glitch: thin slices of the poster offset sideways (a
 * still layer: the clip itself is never duplicated). Reduced motion: no glitch.
 */
export const ProjectMedia = ({
  project,
  corner = 18,
  inset = 12,
  children,
  className = "",
}: {
  project: ShowcaseProject;
  /** Crosshair corner size and distance from the edges, px. */
  corner?: number;
  inset?: number;
  /** The <video>, or nothing for the poster alone. */
  children?: ReactNode;
  className?: string;
}) => {
  const inv = [
    project.invertDark ? "crt-inv-dark" : "",
    project.invertLight ? "crt-inv-light" : "",
  ].join(" ");
  // Each project glitches on its own beat.
  const beat = { animationDelay: `${(Number(project.num.split(".")[1] ?? 1) * 1.37) % 4}s` };
  return (
    <div className={`crt-media relative aspect-[16/10] overflow-hidden ${className}`}>
      {/* The filtered layer: what is drawn here is recoloured; the HUD marks
          above it keep their own ink. */}
      <div
        className={`crt-media-filter ${inv} absolute inset-0`}
        style={{ background: project.art }}
      >
        {/* The poster always stays under the clip: swapping one for the other
            on hover removed the element under the pointer mid-click, and the
            browser dropped the click. */}
        {project.poster && (
          <img
            src={project.poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {children}
        {project.poster && (
          <span aria-hidden="true" className="crt-glitch absolute inset-0" style={beat}>
            {GLITCH_SLICES.map((slice) => (
              <span key={slice.band} className="absolute inset-0" style={slice.style}>
                <img src={project.poster} alt="" className="h-full w-full object-cover" />
              </span>
            ))}
          </span>
        )}
      </div>
      <span aria-hidden="true" className="crt-scanlines crt-scanlines--media absolute inset-0" />
      <span
        aria-hidden="true"
        className="crt-media__corner absolute border-l-2 border-t-2"
        style={{ left: inset, top: inset, width: corner, height: corner }}
      />
      <span
        aria-hidden="true"
        className="crt-media__corner absolute border-b-2 border-r-2"
        style={{ right: inset, bottom: inset, width: corner, height: corner }}
      />
    </div>
  );
};
