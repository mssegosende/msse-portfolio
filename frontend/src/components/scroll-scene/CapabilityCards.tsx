import { useEffect, useRef, useState, type Ref } from "react";
import { capabilityCards } from "../../data/portfolioData";
import { at } from "../../hooks/useFrame";
import { CapabilityCard } from "./CapabilityCard";

interface CapabilityCardsProps {
  ref?: Ref<HTMLDivElement>;
  /** The step shown (0..2): the scroll's card, or the rail's pick when stacked. */
  active: number;
  /** A rail button: scroll to that card's beat, or (stacked) show it. */
  onPick: (index: number) => void;
  isMobile: boolean;
  /**
   * Phones, stacked hero (reduced motion, no pin): every card in normal flow
   * under the object.
   */
  stacked?: boolean;
  /** Desktop: the rail's and the card's scale (ScrollScene's fluid frame). */
  scale?: { rail: number; card: number };
  /** Desktop: the card's height at scale 1, px, as it changes (the body grows it). */
  onCardHeight?: (h: number) => void;
}

/** The Dossier at its design size (Main.dc.html), px: what the card scale fits. */
export const DOSSIER_W = 576;
export const DOSSIER_H = 700;
/** Desktop: the card's top in the 1440 x 900 frame (clear of the title and STATUS). */
export const DOSSIER_TOP = 100;

/** 01 MIND · 02 INTERFACE · 03 ENGINE (SPEC §3). */
const Rail = ({
  active,
  onPick,
  isMobile,
}: Pick<CapabilityCardsProps, "active" | "onPick" | "isMobile">) => (
  <div
    role="group"
    aria-label="Subsystems"
    data-testid="capability-rail"
    className={`flex justify-center ${isMobile ? "gap-2" : "gap-3.5"}`}
  >
    {capabilityCards.map((c, i) => (
      <button
        key={c.num}
        type="button"
        aria-pressed={i === active}
        onClick={() => onPick(i)}
        className={`crt-rail-btn min-h-11 font-vt ${
          isMobile
            ? "whitespace-nowrap px-[9px] py-1 text-[17px] tracking-[0.08em]"
            : "px-[18px] py-1.5 text-[22px] tracking-[0.12em]"
        }`}
      >
        {c.num.padStart(2, "0")} {c.part}
      </button>
    ))}
  </div>
);

/**
 * The card on screen rises over the previous one, which fades (the phones'
 * cap-rise / cap-sink, now on both layouts).
 */
const OneCard = ({ active, isMobile }: { active: number; isMobile: boolean }) => {
  const [cur, setCur] = useState(active);
  const [prev, setPrev] = useState<number | null>(null);
  if (active !== cur) {
    setPrev(cur);
    setCur(active);
  }
  const prevCard = prev !== null ? capabilityCards[prev] : undefined;
  const curCard = capabilityCards[cur];
  return (
    <div className="relative">
      {prevCard && (
        <div
          key={`sink-${prev}-${cur}`}
          className="cap-sink absolute inset-x-0 top-0"
          aria-hidden="true"
        >
          <CapabilityCard card={prevCard} isMobile={isMobile} />
        </div>
      )}
      {curCard && (
        <div key={`rise-${cur}`} className="cap-rise relative">
          <CapabilityCard card={curCard} isMobile={isMobile} />
        </div>
      )}
    </div>
  );
};

/**
 * Scene 2's cards and rail. Desktop: at their places in the 1440 x 900 frame,
 * each scaled to the window (ScrollScene), the rail under the ASCII object and
 * the card on the right.
 * Phones: the rail above one card, kept above the dock (useCalloutsAboveDock).
 * The outer box is what the timeline fades.
 */
export const CapabilityCards = ({
  ref,
  active,
  onPick,
  isMobile,
  stacked = false,
  scale = { rail: 1, card: 1 },
  onCardHeight,
}: CapabilityCardsProps) => {
  // Desktop: the card's natural height (its body is never clipped), so the
  // parent can scale it to fit above the dock. Phones: where the rail block
  // starts, so the ASCII object above it can size itself (--cap-top).
  const cardBox = useRef<HTMLDivElement>(null);
  const phoneBox = useRef<HTMLDivElement>(null);
  const cardScale = scale.card;
  useEffect(() => {
    const el = cardBox.current;
    if (!el || !onCardHeight) return undefined;
    const report = () => {
      const h = el.getBoundingClientRect().height / (cardScale || 1);
      if (h > 0) onCardHeight(Math.round(h));
    };
    report();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(report);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [onCardHeight, cardScale]);
  useEffect(() => {
    const el = phoneBox.current;
    const hero = el?.closest<HTMLElement>("#hero");
    if (!el || !hero) return undefined;
    // The rail and card block's top in the hero (the marker fills the block).
    const report = () =>
      hero.style.setProperty("--cap-top", `${el.parentElement?.offsetTop ?? 600}px`);
    report();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(report);
    ro?.observe(el);
    window.addEventListener("resize", report);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", report);
    };
  }, [isMobile, stacked]);
  const step = Math.max(0, Math.min(capabilityCards.length - 1, active));
  if (isMobile && stacked) {
    return (
      <div
        ref={ref}
        data-testid="capability-cards"
        data-layout="phone-stacked"
        className="pointer-events-auto relative flex flex-col gap-4 px-4 pb-24 pt-[440px]"
      >
        {capabilityCards.map((card) => (
          <CapabilityCard key={card.num} card={card} isMobile />
        ))}
      </div>
    );
  }
  if (isMobile) {
    return (
      <div
        ref={ref}
        data-testid="capability-cards"
        data-layout="phone"
        data-active={step}
        className="callout-mobile pointer-events-auto absolute left-4 right-4 flex flex-col gap-[18px]"
      >
        <span ref={phoneBox} aria-hidden="true" className="absolute inset-0 -z-10" />
        <Rail active={step} onPick={onPick} isMobile />
        <OneCard active={step} isMobile />
      </div>
    );
  }
  return (
    <div
      ref={ref}
      data-testid="capability-cards"
      data-layout="dossier"
      data-active={step}
      className="pointer-events-none absolute inset-0"
    >
      {/* Each at its place in the 1440 x 900 frame, scaled (ScrollScene). */}
      <div className="pointer-events-auto absolute" style={at(150, 776)}>
        <div className="w-[548px]" style={{ zoom: scale.rail }}>
          <Rail active={step} onPick={onPick} isMobile={false} />
        </div>
      </div>
      <div className="pointer-events-auto absolute" style={at(800, DOSSIER_TOP)}>
        <div ref={cardBox} style={{ zoom: scale.card }}>
          <OneCard active={step} isMobile={false} />
        </div>
      </div>
    </div>
  );
};
