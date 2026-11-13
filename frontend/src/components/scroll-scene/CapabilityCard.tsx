import { useEffect, useRef } from "react";
import type { CapabilityCard as Card } from "../../data/portfolioData";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DataRow } from "../crt/CrtPieces";
import { TICK_MS, wavePath, type Shape } from "./ascii";
import { AsciiObject } from "./AsciiObject";

// Option A "Dossier" (design/crt/msse-crt-redesign/design-source/Main.dc.html
// and Mobile.dc.html): a frame with nodes, SUBSYSTEM header, the boxed
// number beside part / title / body, data rows, and an oscilloscope.
// Colours are the page theme's --crt-* tokens.

const NODES_DESKTOP = [
  "left-[-4px] top-[-4px]",
  "right-[-4px] top-[-4px]",
  "bottom-[-4px] left-[-4px]",
  "bottom-[-4px] right-[-4px]",
  // Where the dividers meet the frame and each other.
  "left-[-4px] top-[49px]",
  "right-[-4px] top-[49px]",
  "left-[177px] top-[49px]",
];
const NODES_PHONE = NODES_DESKTOP.slice(0, 4);

const WAVE_W = 536;
const WAVE_H = 84;

/** The oscilloscope: a moving wave and the frame counter (still with reduced motion). */
const Scope = ({ step, part }: { step: Shape; part: string }) => {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const pathRef = useRef<SVGPathElement>(null);
  const frameRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const draw = (t: number) => {
      pathRef.current?.setAttribute("d", wavePath(t, step, WAVE_W, WAVE_H));
      if (frameRef.current)
        frameRef.current.textContent = String(Math.floor(t / TICK_MS)).padStart(6, "0");
    };
    draw(0);
    if (reduced) return undefined;
    let onScreen = false;
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            onScreen = !!e?.isIntersecting;
          });
    if (boxRef.current) io?.observe(boxRef.current);
    const t0 = performance.now();
    // On screen is not enough: before the first card the cards sit hidden
    // (visibility / opacity) inside the pinned hero, and drawing then cost
    // scene 1 frames (perf/crt-phase3.json).
    const shown = () =>
      boxRef.current?.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) ??
      true;
    const id = setInterval(() => {
      if (onScreen && !document.hidden && shown()) draw(performance.now() - t0);
    }, TICK_MS);
    return () => {
      clearInterval(id);
      io?.disconnect();
    };
  }, [step, reduced]);
  return (
    <div ref={boxRef} className="px-5 pb-3.5 pt-4">
      <div className="crt-scope h-[84px] border border-[var(--crt-line-row)]">
        <svg
          aria-hidden="true"
          width="100%"
          height="82"
          viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
          preserveAspectRatio="none"
          className="block"
        >
          <path ref={pathRef} className="crt-scope__wave" fill="none" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] tracking-[0.08em] text-crt-dim">
        <span>SIG · {part}</span>
        <span>
          FRAME <span ref={frameRef}>000000</span>
        </span>
        <span>LINK · MSSE://{part}</span>
      </div>
    </div>
  );
};

const Chips = ({ chips }: { chips: string[] }) => (
  <ul className="m-0 flex list-none flex-wrap justify-end gap-1.5 p-0">
    {chips.map((c) => (
      <li key={c} className="crt-chip">
        {c}
      </li>
    ))}
  </ul>
);

/**
 * One scene 2 card, the Dossier. Desktop: 576 wide in the 1440 x 900 stage.
 * Phones: full width, one at a time, the ASCII object behind the body.
 */
export const CapabilityCard = ({ card, isMobile }: { card: Card; isMobile: boolean }) => {
  const step = (Number(card.num) - 1) as Shape;
  const num = card.num.padStart(2, "0");
  const nodes = isMobile ? NODES_PHONE : NODES_DESKTOP;
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  return (
    <article
      data-testid={`capability-card-${card.num}`}
      aria-label={`Subsystem ${num}: ${card.title}`}
      className={`crt-frame crt-dossier relative ${isMobile ? "w-full" : "w-[576px]"}`}
    >
      {nodes.map((pos) => (
        <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
      ))}
      {isMobile ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-crt-line px-4 py-3.5">
            <div>
              <div className="font-vt text-[17px] tracking-[0.2em] text-crt-dim">{card.small}</div>
              <h3 className="crt-dossier__title m-0 mt-1 font-michroma text-[17px] font-normal tracking-[0.04em]">
                {card.title}
              </h3>
            </div>
            <span className="crt-dossier__num font-michroma text-[44px] leading-none">{num}</span>
          </div>
          <div className="relative overflow-hidden border-b border-[var(--crt-line-row)] px-4 py-3">
            {/* The ASCII object behind the body, faint (María Sol, 13 Nov:
                beside the title it took the rail's room). */}
            <AsciiObject step={step} isMobile reduced={reduced} backdrop />
            {/* The whole body, always (María Sol, 12 Nov): never clipped. */}
            <p className="relative m-0 text-[14px] leading-[1.5] text-crt-text-2">{card.text}</p>
          </div>
          <div className="crt-dossier__rows--phone">
            <DataRow label="FUNCTION">{card.function}</DataRow>
            <DataRow label="SHIPPED IN">{card.shippedIn}</DataRow>
          </div>
          <div className="px-4 py-3">
            <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
              {card.chips.map((c) => (
                <li key={c} className="crt-chip">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-[52px] items-center justify-between border-b border-crt-line px-5">
            <span className="crt-glow-label font-vt text-[28px] tracking-[0.1em] text-[var(--crt-row-value)]">
              SUBSYSTEM {num}
            </span>
            <span aria-hidden="true" className="crt-dossier__icon" />
          </div>
          <div className="relative grid grid-cols-[180px_minmax(0,1fr)] border-b border-crt-line">
            {/* Where this row's divider meets the box's: follows the row's height. */}
            <span aria-hidden="true" className="crt-node -bottom-1 left-[177px]" />
            <div className="relative flex min-h-[180px] items-center justify-center border-r border-crt-line">
              <span
                aria-hidden="true"
                className="crt-dossier__bracket left-4 top-4 border-l border-t"
              />
              <span
                aria-hidden="true"
                className="crt-dossier__bracket right-4 top-4 border-r border-t"
              />
              <span
                aria-hidden="true"
                className="crt-dossier__bracket bottom-4 left-4 border-b border-l"
              />
              <span
                aria-hidden="true"
                className="crt-dossier__bracket bottom-4 right-4 border-b border-r"
              />
              <span className="crt-dossier__num font-michroma text-[72px] leading-none">{num}</span>
            </div>
            <div className="flex min-h-[180px] flex-col justify-center gap-2.5 px-6 py-[22px]">
              <div className="font-vt text-[20px] tracking-[0.22em] text-crt-dim">{card.small}</div>
              <h3 className="crt-dossier__title m-0 font-michroma text-[23px] font-normal tracking-[0.05em]">
                {card.title}
              </h3>
              {/* The whole body, always (María Sol, 12 Nov): the card grows to
                  fit it, and ScrollScene scales the card to the room there is. */}
              <p className="m-0 text-[14px] leading-[1.55] text-crt-text-2">{card.text}</p>
            </div>
          </div>
          <DataRow label="FUNCTION">{card.function}</DataRow>
          <DataRow label="SHIPPED IN">{card.shippedIn}</DataRow>
          <div className="crt-row py-2">
            <span className="crt-row__label">STACK</span>
            <Chips chips={card.chips} />
          </div>
          <Scope step={step} part={card.part} />
        </>
      )}
    </article>
  );
};
