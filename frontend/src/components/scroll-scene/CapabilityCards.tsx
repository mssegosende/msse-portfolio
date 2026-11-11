import { useEffect, useRef, useState, type Ref } from "react";
import { capabilityCards } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";
import { Num } from "../Num";
import { CapabilityCard } from "./CapabilityCard";
import { CapabilityRow } from "./CapabilityRow";

const ROTATE_MS = 5000;

interface CapabilityCardsProps {
  ref?: Ref<HTMLDivElement>;
  /** The card the scroll is on: -1 before the first. */
  scrollIndex: number;
  /** Phones, past Ø2.3 with the dock shown: the cards rotate by themselves. */
  autoRotate: boolean;
  isMobile: boolean;
  theme: Theme;
  /** Desktop: where the title ends (capTitleFit), px from the top; the cards start below. */
  titleBottom?: number;
  /**
   * Phones, stacked hero (reduced motion, no pin): all the cards in normal
   * flow, the first in its usual place above the dock, the others below it.
   */
  stacked?: boolean;
}

/**
 * Scene 2's cards. Desktop: the vertical cards in a row (CapabilityRow).
 * Phones: one at a time, each new one rising over the previous, which fades;
 * after Ø2.3 they keep rotating every ~5 s, paused on touch, never with
 * reduced motion. The outer box is what the timeline fades.
 */
export const CapabilityCards = ({
  ref,
  scrollIndex,
  autoRotate,
  isMobile,
  theme,
  titleBottom = 180,
  stacked = false,
}: CapabilityCardsProps) =>
  isMobile && stacked ? (
    <StackedPhoneCards ref={ref} theme={theme} />
  ) : isMobile ? (
    <PhoneCards ref={ref} scrollIndex={scrollIndex} autoRotate={autoRotate} theme={theme} />
  ) : (
    <CapabilityRow ref={ref} scrollIndex={scrollIndex} theme={theme} titleBottom={titleBottom} />
  );

const PhoneCards = ({
  ref,
  scrollIndex,
  autoRotate,
  theme,
}: Omit<CapabilityCardsProps, "isMobile" | "titleBottom">) => {
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
      data-layout="phone"
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
      className="callout-mobile pointer-events-auto absolute left-4 right-4"
    >
      <div className="relative">
        {prevCard && (
          <div
            key={`sink-${prev}-${cur}`}
            className="cap-sink absolute inset-x-0 bottom-0"
            aria-hidden="true"
          >
            <CapabilityCard card={prevCard} theme={theme} isMobile />
          </div>
        )}
        {curCard && (
          <div key={`rise-${cur}`} className="cap-rise relative">
            <CapabilityCard card={curCard} theme={theme} isMobile />
          </div>
        )}
      </div>
      <StepCounter index={Math.max(0, cur)} theme={theme} />
    </div>
  );
};

/**
 * Phones, stacked: scene 2's first screen as the pin leaves it, a card above
 * the dock, then the other cards under it on the same ground, so every card
 * reads without the scroll sequence. Nothing moves.
 */
const StackedPhoneCards = ({ ref, theme }: { ref?: Ref<HTMLDivElement>; theme: Theme }) => {
  const [first, ...rest] = capabilityCards;
  return (
    <div
      ref={ref}
      data-testid="capability-cards"
      data-layout="phone-stacked"
      className="pointer-events-auto relative px-4"
    >
      {/* The pinned layout's 6rem above the bottom edge (.callout-mobile). */}
      <div className="flex min-h-[max(100vh,640px)] flex-col justify-end pb-24">
        {first && <CapabilityCard card={first} theme={theme} isMobile />}
      </div>
      <div className="-mt-12 flex flex-col gap-4 pb-24">
        {rest.map((card) => (
          <CapabilityCard key={card.num} card={card} theme={theme} isMobile />
        ))}
      </div>
    </div>
  );
};

// The counter sits on scene 2's ground, which follows the page theme: ink on
// the light ground, light on the dark one (AA 4.5:1 in both).
const COUNTER = {
  light: { text: "text-[#14181D]", on: "bg-[#14181D]", off: "bg-[rgba(20,24,29,0.3)]" },
  dark: { text: "text-[#E9EDF1]", on: "bg-[#E9EDF1]", off: "bg-[rgba(233,237,241,0.35)]" },
};

/** Phones: Ø2.x / Ø2.3 and one bar per card, under the card. */
const StepCounter = ({ index, theme }: { index: number; theme: Theme }) => {
  const c = COUNTER[theme];
  return (
    <div
      aria-hidden="true"
      data-testid="capability-counter"
      className={`mt-2.5 flex items-center justify-between px-0.5 font-mono text-[10px] tracking-[0.12em] ${c.text}`}
    >
      <span>
        <Num value={`2.${index + 1}`} className="font-semibold" />{" "}
        <span className="opacity-[0.85]">
          / <Num value={`2.${capabilityCards.length}`} />
        </span>
      </span>
      <span className="flex gap-1.5">
        {capabilityCards.map((card, i) => (
          <span key={card.num} className={`h-0.5 w-[18px] ${i === index ? c.on : c.off}`} />
        ))}
      </span>
    </div>
  );
};
