import { useEffect, useRef, type RefObject } from "react";
import { capabilityCards } from "../../data/portfolioData";
import { MORPH_MS, renderAscii, smoothstep, TICK_MS, type Shape } from "./ascii";
import { Crosshair } from "../crt/CrtPieces";

// The object's size in characters (SPEC §3): desktop 76 x 40 at 12px, phones
// 46 x 26 at 9px.
const GRID = { desktop: { cols: 76, rows: 40 }, phone: { cols: 46, rows: 26 } };
// Reduced motion: one still frame per step, at this point of the rotation.
const STILL_T = 1600;

/**
 * True while the object can be seen: on screen, the tab visible, and its
 * layer faded in (the hero timeline fades layer 2 at the crossfade; before
 * it the layer sits at opacity 0, and nothing should tick).
 */
const useShowing = (el: RefObject<HTMLElement | null>) => {
  const showing = useRef(false);
  useEffect(() => {
    const node = el.current;
    if (!node) return undefined;
    let onScreen = true;
    const layer = node.closest<HTMLElement>("[data-scene2-layer]");
    const update = () => {
      const faded = layer ? parseFloat(layer.style.opacity || "1") < 0.02 : false;
      showing.current = onScreen && !document.hidden && !faded;
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([e]) => {
            onScreen = !!e?.isIntersecting;
            update();
          });
    io?.observe(node);
    document.addEventListener("visibilitychange", update);
    // The layer's opacity changes with the scroll (GSAP writes it inline).
    const mo = layer ? new MutationObserver(update) : null;
    mo?.observe(layer!, { attributes: true, attributeFilter: ["style"] });
    update();
    return () => {
      io?.disconnect();
      mo?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [el]);
  return showing;
};

/**
 * Scene 2's ASCII object inside crosshair corners: text, not WebGL (SPEC §3).
 * The step follows the scene 2 timeline's card (not a timer); between steps it
 * morphs for 900 ms. ~14 fps while showing; reduced motion: a still frame per
 * step, no rotation, no glitch, no scan line.
 */
export const AsciiObject = ({
  step,
  isMobile,
  reduced,
}: {
  step: Shape;
  isMobile: boolean;
  reduced: boolean;
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const showing = useShowing(boxRef);
  const { cols, rows } = isMobile ? GRID.phone : GRID.desktop;
  // The morph: from `from` to `to`, started at `at` (ms, performance.now()).
  const morph = useRef({ from: step, to: step, at: -Infinity });

  useEffect(() => {
    const m = morph.current;
    if (step === m.to) return;
    const now = performance.now();
    // Mid-morph, start from the shape it was heading to.
    morph.current = { from: m.to, to: step, at: now };
  }, [step]);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return undefined;
    const t0 = performance.now();
    const draw = (t: number, k: number) => {
      const m = morph.current;
      pre.textContent = renderAscii({
        cols,
        rows,
        t,
        prev: m.from,
        step: m.to,
        k,
        glitch: !reduced,
      });
    };
    if (reduced) {
      // A still per step: redraw only when the step changes.
      let last: Shape | null = null;
      const id = setInterval(() => {
        if (morph.current.to !== last) {
          last = morph.current.to;
          morph.current = { ...morph.current, from: last };
          draw(STILL_T, 1);
        }
      }, 200);
      draw(STILL_T, 1);
      return () => clearInterval(id);
    }
    const height = isMobile ? pre.offsetHeight || rows * 9 : rows * 12;
    const tick = () => {
      if (!showing.current) return;
      const now = performance.now();
      const t = now - t0;
      const m = morph.current;
      const k = smoothstep((now - m.at) / MORPH_MS);
      draw(t, k);
      if (scanRef.current) scanRef.current.style.transform = `translateY(${(t * 0.11) % height}px)`;
    };
    draw(0, 1);
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [cols, rows, isMobile, reduced, showing]);

  const card = capabilityCards[step];
  const num = card?.num.padStart(2, "0") ?? "01";
  const tag = "absolute whitespace-nowrap font-mono text-crt-node crt-glow-label";

  return (
    <div ref={boxRef} className={isMobile ? "relative" : "absolute h-[480px] w-[548px]"}>
      <pre
        ref={preRef}
        aria-label={`ASCII render of subsystem ${num}, ${card?.part ?? ""}: a ${card?.shape.toLowerCase() ?? ""}`}
        className={`crt-ascii m-0 whitespace-pre font-mono tracking-normal ${
          isMobile ? "crt-ascii--phone" : "text-[12px] leading-[12px]"
        }`}
      />
      {!reduced && (
        <div
          ref={scanRef}
          aria-hidden="true"
          className="crt-ascii-scan absolute inset-x-0 top-0 h-0.5 will-change-transform"
        />
      )}
      {isMobile ? (
        <>
          <Crosshair size={30} thickness={3} offset={-18} />
          {/* Above the box on phones: below it is the rail. */}
          <span className={`${tag} -top-6 right-0 text-[11px]`}>[msse.{num}]</span>
        </>
      ) : (
        <>
          <Crosshair size={56} thickness={4} offset={-28} />
          <span className={`${tag} -top-[58px] left-[30px] text-[14px]`}>[core.sys]</span>
          <span className={`${tag} -bottom-[58px] right-[30px] text-[14px]`}>
            [msse.{num} · {card?.shape}]
          </span>
          <span aria-hidden="true" className="absolute -right-1.5 -top-16 flex gap-2.5">
            <span className="crt-ascii-dot" />
            <span className="crt-ascii-dot" />
          </span>
          <span aria-hidden="true" className="absolute -bottom-[62px] -left-1.5 flex gap-2">
            <span className="crt-ascii-ring" />
            <span className="crt-ascii-ring" />
            <span className="crt-ascii-ring" />
          </span>
        </>
      )}
    </div>
  );
};
