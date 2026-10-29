/**
 * One chapter-2 callout card (01 HEAD, 02 HANDS, 03 TORSO). Glass on purpose:
 * the robot's arm showing through, grey and blurred, is the intended look.
 *
 * No translate utilities on the outer box: GSAP animates its `y` and would
 * wipe a Tailwind transform. On phones its `bottom` is set live by
 * placeCallouts (ScrollScene) so it sits above the dock.
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
        : `w-[27rem] max-w-[46vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
    }`}
  >
    {isMobile ? (
      // Celular: compacta. Numero, parte y titulo en UNA fila, texto a
      // 14px: ocupaba 43-72% de la pantalla (medido en WebKit,
      // Firefox, Brave y Edge, 402x874 a 375x553).
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
      // Escritorio: todo escala con el ALTO de la ventana (y con el
      // ancho en tablets verticales angostas, donde la tarjeta de 46vw
      // tiene mas renglones), con tope en el tamano de siempre. En el
      // cierre la 01 (top 6%) y la 03 (top 52%) van una arriba de la
      // otra: cada una tiene que medir menos de ~44% del alto. A tamano
      // fijo median 48-58% en una Mac (1440x900, o menos con la barra
      // de Safari): se pisaban y la 03 se cortaba abajo. Las lineas
      // salen de puntos fijos (from en portfolioData) que siguen
      // quedando dentro de la tarjeta.
      <div className="corner-frame cut-corner relative border border-ink/[0.13] bg-surface/70 p-[clamp(1.25rem,min(3.2vh,3.4vw),2.25rem)] pt-[clamp(1rem,min(2.4vh,2.5vw),1.5rem)] backdrop-blur-md">
        <div className="select-none font-display text-[clamp(3rem,min(8vh,8vw),7rem)] font-light leading-[0.85] text-outline-grey">
          {f.num}
        </div>
        <div className="mt-[clamp(0.75rem,min(2.6vh,2.6vw),1.75rem)] flex items-baseline gap-3">
          <span className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/[0.83] text-halo">
            {f.part}
          </span>
        </div>
        <h3 className="mt-2 font-display text-[clamp(1.25rem,2.7vh,1.5rem)] font-light uppercase tracking-[0.01em] text-ink">
          {f.title}
        </h3>
        <p className="mt-[clamp(0.5rem,1.6vh,1rem)] font-inter text-[clamp(13px,min(1.65vh,1.75vw),15px)] leading-[1.6] text-ink/[0.83]">
          {f.text}
        </p>
      </div>
    )}
  </div>
);
