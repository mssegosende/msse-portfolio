/**
 * One chapter 2 card (01 HEAD, 02 HANDS, 03 TORSO). Glass on purpose: the
 * robot's arm showing through, blurred, is the intended look. No translate
 * utilities on the outer box: GSAP animates its `y` and would wipe them.
 * On phones its `bottom` is set by useCalloutsAboveDock.
 */
export const FeatureCard = ({ ref, feature: f, isMobile, theme }) => (
  <div
    ref={ref}
    data-testid={`feature-callout-${f.num}`}
    data-theme={theme}
    style={isMobile ? undefined : { top: f.top }}
    className={`absolute ${
      isMobile
        ? "callout-mobile left-4 right-4 w-auto"
        : `w-[clamp(20rem,26vw,28rem)] max-w-[46vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
    }`}
  >
    {isMobile ? (
      // Phones: number, part and title in one row to keep the card short.
      <div className="corner-frame cut-corner relative border border-ink/[0.13] bg-surface/[0.70] p-4 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="select-none font-display text-[3.25rem] font-light leading-[0.85] text-outline-grey">
            {f.num}
          </div>
          <div className="min-w-0">
            <span className="font-display text-[12px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo">
              {f.part}
            </span>
            <h3 className="mt-0.5 font-display text-xl font-light uppercase leading-tight tracking-[0.01em] text-ink">
              {f.title}
            </h3>
          </div>
        </div>
        <p className="mt-3 font-inter text-[14px] leading-[1.5] text-ink/[0.83]">{f.text}</p>
      </div>
    ) : (
      // Desktop: same one-row header, width proportional to the screen, sizes
      // via min(vh, vw) (height rules on laptops, width on portrait tablets).
      <div className="corner-frame cut-corner relative border border-ink/[0.13] bg-surface/70 p-[clamp(1rem,min(2.6vh,2.8vw),1.75rem)] backdrop-blur-md">
        <div className="flex items-center gap-[clamp(0.75rem,1.6vw,1.25rem)]">
          <div className="select-none font-display text-[clamp(2.75rem,min(7vh,6vw),4.5rem)] font-light leading-[0.85] text-outline-grey">
            {f.num}
          </div>
          <div className="min-w-0">
            <span className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo">
              {f.part}
            </span>
            <h3 className="mt-1 font-display text-[clamp(1.125rem,2.4vh,1.375rem)] font-light uppercase leading-tight tracking-[0.01em] text-ink">
              {f.title}
            </h3>
          </div>
        </div>
        <p className="mt-[clamp(0.625rem,1.6vh,1rem)] font-inter text-[clamp(13px,min(1.6vh,1.6vw),14.5px)] leading-[1.6] text-ink/[0.83]">
          {f.text}
        </p>
      </div>
    )}
  </div>
);
