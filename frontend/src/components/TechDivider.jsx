export const TechDivider = ({ left, right }) => (
  <div
    data-testid={`tech-divider-${left.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    className="flex items-center gap-4 bg-black px-4 py-2 sm:px-8 md:px-12 lg:px-20"
  >
    <span className="shrink-0 font-pixel text-[9px] uppercase tracking-[0.3em] text-[#555]">
      {left}
    </span>
    <div className="relative h-px flex-1 bg-[#222]">
      <div className="tick-marks absolute inset-x-0 -top-[3px] h-[7px]" />
    </div>
    <span className="shrink-0 font-pixel text-[9px] uppercase tracking-[0.3em] text-[#555]">
      {right}
    </span>
  </div>
);
