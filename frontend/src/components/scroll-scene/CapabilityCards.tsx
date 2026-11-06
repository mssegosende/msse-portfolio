import { useEffect, useRef, useState, type Ref } from "react";
import { capabilityCards } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";
import { Num } from "../Num";
import { CapabilityCard } from "./CapabilityCard";

// Desktop placement at 1440 x 900 (design/HANDOFF.md): 324 x 463, 110px from
// the left, centred between the title and the dock. Other sizes scale the
// whole card, never its fonts alone. CARD_SCALE: María Sol's review shrank the
// card to 85 % of the mock, frame and type together.
const CARD_W = 324;
const CARD_H = 463;
const CARD_SCALE = 0.85;
const LEFT = 110;
const TITLE_BOTTOM = 180;
const DOCK_CLEAR = 100;
const ROTATE_MS = 5000;

const fitCard = (w: number, h: number) => {
  const s =
    CARD_SCALE *
    Math.min(
      1.25,
      Math.max(0.72, Math.min(h / 900, w / 1440, (h - TITLE_BOTTOM - DOCK_CLEAR) / CARD_H)),
    );
  const free = h - TITLE_BOTTOM - DOCK_CLEAR - CARD_H * s;
  return { s, left: LEFT * Math.min(1, w / 1440), top: TITLE_BOTTOM + Math.max(0, free / 2) };
};

const useCardFit = (enabled: boolean) => {
  const [fit, setFit] = useState(() => fitCard(window.innerWidth, window.innerHeight));
  useEffect(() => {
    if (!enabled) return undefined;
    const onResize = () => setFit(fitCard(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled]);
  return fit;
};

interface CapabilityCardsProps {
  ref?: Ref<HTMLDivElement>;
  /** The card the scroll is on: -1 before the first. */
  scrollIndex: number;
  /** Past Ø2.3 with the dock shown: the cards rotate by themselves. */
  autoRotate: boolean;
  isMobile: boolean;
  theme: Theme;
}

/**
 * Scene 2's cards, one at a time: each new one rises over the previous, which
 * fades. After Ø2.3 they keep rotating every ~5 s, paused on hover or touch,
 * and never with reduced motion.
 */
export const CapabilityCards = ({
  ref,
  scrollIndex,
  autoRotate,
  isMobile,
  theme,
}: CapabilityCardsProps) => {
  const fit = useCardFit(!isMobile);
  const [rotated, setRotated] = useState<number | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!autoRotate || reduce) return undefined;
    const id = setInterval(() => {
      if (!paused.current) setRotated((r) => ((r ?? scrollIndex) + 1) % capabilityCards.length);
    }, ROTATE_MS);
    return () => {
      clearInterval(id);
      setRotated(null);
    };
  }, [autoRotate, scrollIndex]);

  const shown = autoRotate && rotated !== null ? rotated : scrollIndex;

  // The previous card stays mounted while it fades under the new one.
  const [cur, setCur] = useState(shown);
  const [prev, setPrev] = useState<number | null>(null);
  if (shown !== cur) {
    setPrev(cur);
    setCur(shown);
  }

  const card = (i: number) => capabilityCards[i];
  const prevCard = prev !== null && prev >= 0 ? card(prev) : undefined;
  const curCard = cur >= 0 ? card(cur) : undefined;

  return (
    <div
      ref={ref}
      data-testid="capability-cards"
      onPointerEnter={() => {
        paused.current = true;
      }}
      onPointerLeave={() => {
        paused.current = false;
      }}
      onPointerDown={() => {
        paused.current = true;
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== "mouse") paused.current = false;
      }}
      onPointerCancel={(e) => {
        if (e.pointerType !== "mouse") paused.current = false;
      }}
      className={`pointer-events-auto absolute ${isMobile ? "callout-mobile left-4 right-4" : "origin-top-left"}`}
      style={
        isMobile
          ? undefined
          : {
              left: fit.left,
              top: fit.top,
              width: CARD_W,
              height: CARD_H,
              transform: `scale(${fit.s})`,
            }
      }
    >
      <div className={isMobile ? "relative" : "absolute inset-0"}>
        {prevCard && (
          <div
            key={`sink-${prev}-${cur}`}
            className="cap-sink absolute inset-x-0 bottom-0"
            aria-hidden="true"
          >
            <CapabilityCard card={prevCard} theme={theme} isMobile={isMobile} />
          </div>
        )}
        {curCard && (
          <div
            key={`rise-${cur}`}
            className={`cap-rise ${isMobile ? "relative" : "absolute inset-0"}`}
          >
            <CapabilityCard card={curCard} theme={theme} isMobile={isMobile} />
          </div>
        )}
      </div>
      {isMobile && <StepCounter index={Math.max(0, cur)} />}
    </div>
  );
};

/** Phones: Ø2.x / Ø2.3 and one bar per card, under the card. */
const StepCounter = ({ index }: { index: number }) => (
  <div
    aria-hidden="true"
    data-testid="capability-counter"
    className="mt-2.5 flex items-center justify-between px-0.5 font-mono text-[10px] tracking-[0.12em] text-[#14181D]"
  >
    <span>
      <Num value={`2.${index + 1}`} className="font-semibold" />{" "}
      <span className="opacity-[0.55]">
        / <Num value={`2.${capabilityCards.length}`} />
      </span>
    </span>
    <span className="flex gap-1.5">
      {capabilityCards.map((c, i) => (
        <span
          key={c.num}
          className={`h-0.5 w-[18px] ${i === index ? "bg-[#14181D]" : "bg-[rgba(20,24,29,0.3)]"}`}
        />
      ))}
    </span>
  </div>
);
