import { systemFeatures } from "../../data/portfolioData";

/**
 * Desktop only: one connector per card, from a point inside the card
 * (`lineFrom`) to the body part it names, plus the dot on that body part.
 * ScrollScene sets each line's start from its card's box (measureLineOrigins)
 * and grows the line by moving its far end; the dots are re-projected against
 * the live camera every frame (applyPull).
 */
export const FeatureConnectors = ({ lineRefs, dotRefs, theme }) => (
  <>
    {systemFeatures.map((f, i) => (
      <svg
        key={`line-${f.num}`}
        data-testid={`feature-line-${f.num}`}
        data-theme={theme}
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line
          ref={(el) => (lineRefs.current[i] = el)}
          stroke="rgb(var(--ink) / 0.45)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    ))}
    {systemFeatures.map((f, i) => (
      <span
        key={`dot-${f.num}`}
        ref={(el) => (dotRefs.current[i] = el)}
        style={{ left: `${f.to.x}%`, top: `${f.to.y}%` }}
        data-theme={theme}
        className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
      />
    ))}
  </>
);
