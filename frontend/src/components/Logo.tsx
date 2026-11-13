import { profile } from "@/data/portfolioData";
import {
  BRACKET_STROKE,
  BRACKETS,
  CROSSHAIR,
  CROSSHAIR_OPACITY,
  CROSSHAIR_STROKE,
  MARK_VIEWBOX,
  S_PATH,
} from "./logoMark";

interface LogoProps {
  /** "mark": the bracketed S alone; "lockup": the mark and MSSE:// beside it. */
  variant?: "mark" | "lockup";
  /** The mark's size in CSS px (it is square). */
  size?: number;
  /** The wordmark's font size in CSS px (lockup only). */
  textSize?: number;
  className?: string;
  "data-testid"?: string;
}

// Below ~100px the design's strokes (1.6 and 1 of 120 units) would be under a
// pixel and blur away; they keep a floor of 1.25px (brackets) and 1px
// (crosshair), like the site's own HUD lines. At the design's size they are
// its own proportions.
const strokes = (size: number) => {
  const unit = 120 / size; // viewBox units per CSS px
  return {
    bracket: Math.max(BRACKET_STROKE, 1.25 * unit),
    crosshair: Math.max(CROSSHAIR_STROKE, unit),
  };
};

/** The bracketed S, in the current theme's --crt-* colours. */
export const LogoMark = ({ size = 40, className }: { size?: number; className?: string }) => {
  const w = strokes(size);
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      data-testid="logo-mark"
    >
      <path
        d={CROSSHAIR}
        fill="none"
        style={{
          stroke: "var(--crt-phosphor)",
          strokeOpacity: CROSSHAIR_OPACITY,
          strokeWidth: w.crosshair,
        }}
      />
      <path
        d={BRACKETS}
        fill="none"
        style={{ stroke: "var(--crt-text)", strokeWidth: w.bracket }}
      />
      <path d={S_PATH} style={{ fill: "var(--crt-core)" }} />
    </svg>
  );
};

/**
 * The MSSE logo: the mark alone, or the lockup (mark + MSSE:// in Michroma,
 * "://" in --crt-phosphor). Follows the theme through the --crt-* tokens.
 * Static: no animation of its own.
 */
export const Logo = ({
  variant = "lockup",
  size = 40,
  textSize = 16,
  className = "",
  "data-testid": testId = "logo",
}: LogoProps) => {
  const name = profile.shortMark.replace(/:\/\/$/, "");
  return (
    <span
      role="img"
      aria-label={profile.shortMark}
      data-testid={testId}
      className={`inline-flex items-center ${className}`}
      style={{ gap: Math.round(size * 0.22) }}
    >
      <LogoMark size={size} />
      {variant === "lockup" && (
        <span
          aria-hidden="true"
          className="msse-mark leading-none text-crt-title"
          style={{ fontSize: textSize }}
        >
          {name}
          <span className="text-crt-phosphor">://</span>
        </span>
      )}
    </span>
  );
};
