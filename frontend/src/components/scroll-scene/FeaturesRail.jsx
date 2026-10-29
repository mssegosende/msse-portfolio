import { systemFeatures } from "../../data/portfolioData";

/** Desktop progress rail (01 / 02 / 03); the timeline lights each number. */
export const FeaturesRail = ({ railRefs, theme }) => (
  <div
    data-testid="features-rail"
    data-theme={theme}
    className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-10"
  >
    {systemFeatures.map((f, i) => (
      <div key={f.num} className="flex flex-col items-center gap-3">
        <span
          ref={(el) => (railRefs.current[i] = el)}
          className="font-display text-[13px] tracking-[0.02em] text-ink opacity-[0.45]"
        >
          {f.num}
        </span>
        {i < systemFeatures.length - 1 && <span className="h-6 w-px bg-ink/20" />}
      </div>
    ))}
  </div>
);
