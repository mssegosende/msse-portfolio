import { useMemo } from "react";
import { CONSTELLATIONS } from "@/data/constellations";
import { project, type SignalFrame } from "@/lib/constellations";

// The box the figures are fitted to (the SIGNAL scope's own proportions,
// MonitorTrace's 420 x 120), with room around them.
const W = 420;
const H = 120;
const PAD = 8;

/**
 * SIGNAL's constellation, drawn behind its trace (María Sol, 13 Nov): the
 * frame's stars appear one by one as small dots, then dotted lines join them
 * in the stick figure's order; the named star a little larger and brighter.
 * In --crt-phosphor at a low opacity: a background, never over the reading.
 */
export const ConstellationSky = ({ frame }: { frame: SignalFrame }) => {
  const c = CONSTELLATIONS[frame.index]!;
  const { stars, segments } = useMemo(() => project(c, W, H, PAD), [c]);
  const at = useMemo(() => new Map(stars.map((s) => [s.hip, s])), [stars]);
  const shown = new Set(stars.slice(0, frame.stars).map((s) => s.hip));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-testid="signal-sky"
      data-constellation={c.con}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.75 * frame.opacity }}
    >
      {segments.slice(0, frame.segments).map(([a, b]) => {
        const p = at.get(a)!;
        const q = at.get(b)!;
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="var(--crt-phosphor)"
            strokeWidth={1}
            strokeDasharray="2.5 3"
            opacity={0.6}
          />
        );
      })}
      {stars
        .filter((s) => shown.has(s.hip))
        .map((s) => (
          <circle
            key={s.hip}
            data-named={s.named || undefined}
            cx={s.x}
            cy={s.y}
            r={(s.named ? s.r * 1.5 : s.r) + 0.4}
            fill="var(--crt-phosphor)"
            opacity={s.named ? 1 : 0.75}
          />
        ))}
    </svg>
  );
};
