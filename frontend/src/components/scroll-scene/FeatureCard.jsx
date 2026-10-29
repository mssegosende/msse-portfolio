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
        : `w-[clamp(20rem,26vw,28rem)] max-w-[46vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
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
      // Escritorio: numero, parte y titulo en UNA fila, como en celular, y
      // ancho proporcional (26vw, entre 20 y 28rem). Con el numero de 7rem
      // apilado arriba y 27rem fijos, cada tarjeta ocupaba 39-42% del alto
      // en una Mac (1470x830 con la barra de Safari) y las tres tapaban casi
      // todo alrededor del robot. Tamanos con min(vh, vw): el alto manda en
      // notebooks, el ancho en tablets verticales. Cada linea sale de un punto
      // relativo a su tarjeta (lineFrom en portfolioData), asi que sigue
      // adentro con cualquier tamano.
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
