import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Ref } from "react";
import { capabilityCards } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";
import { Num } from "../Num";
import { CapabilityCard, CapabilityCardWide, WIDE_CARD_W } from "./CapabilityCard";

// Desktop, one card at a time (design/HANDOFF.md): 324 x 463 at 1440 x 900,
// 110px from the left, centred between the title and the dock. Other sizes
// scale the whole card, never its fonts alone. CARD_SCALE: María Sol's review
// shrank the card to 85 % of the mock, frame and type together.
const CARD_W = 324;
const CARD_H = 463;
const CARD_SCALE = 0.85;
const LEFT = 110;
const DOCK_CLEAR = 100;
const ROTATE_MS = 5000;

/** `titleBottom`: where the title ends (capTitleFit), the mock's 180 for one line. */
const fitCard = (w: number, h: number, titleBottom: number) => {
  const s =
    CARD_SCALE *
    Math.min(
      1.25,
      Math.max(0.72, Math.min(h / 900, w / 1440, (h - titleBottom - DOCK_CLEAR) / CARD_H)),
    );
  const free = h - titleBottom - DOCK_CLEAR - CARD_H * s;
  return { s, left: LEFT * Math.min(1, w / 1440), top: titleBottom + Math.max(0, free / 2) };
};

// Desktop, the three together (María Sol's review, A7): horizontal cards
// stacked beside the head, each step (Ø2.1-Ø2.3) revealing the next. Only on
// windows at least STACK_MIN_H tall where every card shows at least
// STACK_MIN_LINES of its text; the rest scrolls inside the card with the
// project cards' fade. Shorter windows (e.g. 1280 x 720) keep one card at a
// time. The stack scales as a whole: where the 4 lines don't fit at its
// usual scale (1440 x 900, under the two-line title), it shrinks just enough,
// down to STACK_MIN_SCALE, frame and type together.
const STACK_DOCK_CLEAR = 88;
const STACK_GAP = 14;
const STACK_MIN_H = 900;
const STACK_MIN_LINES = 4;
const STACK_MIN_SCALE = 0.8;

/** `minH`: the card height (card px) that shows STACK_MIN_LINES, once measured. */
const fitStack = (w: number, h: number, titleBottom: number, minH?: number) => {
  const free = h - titleBottom - STACK_DOCK_CLEAR;
  let s = 0.9 * Math.min(1.22, w / 1440, Math.max(h / 900, 0.9));
  if (minH) s = Math.min(s, Math.max(STACK_MIN_SCALE, free / (3 * minH + 2 * STACK_GAP)));
  return {
    s,
    free,
    /** The tallest each card can be, in card px (before the scale). */
    roomH: (free / s - 2 * STACK_GAP) / 3,
    left: LEFT * Math.min(1, w / 1440),
  };
};

const useViewport = (enabled: boolean) => {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    if (!enabled) return undefined;
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [enabled]);
  return size;
};

interface Need {
  /** Card height (card px) that shows every card's whole text. */
  full: number;
  /** Card height that shows STACK_MIN_LINES of every card's text. */
  min: number;
}

/**
 * The heights (card px) a horizontal card needs: the card minus the text
 * box, plus the text (whole, or its first lines). The text's width is fixed
 * in card px, so this doesn't change with the window, only with the fonts.
 */
const measureNeed = (root: HTMLElement): Need | null => {
  let full = 0;
  let min = 0;
  root.querySelectorAll("article").forEach((article) => {
    const p = article.querySelector("p");
    const box = p?.parentElement?.parentElement;
    if (!p || !box) return;
    const chrome = article.offsetHeight - box.clientHeight;
    const line = parseFloat(getComputedStyle(p).lineHeight) || 21.7;
    full = Math.max(full, chrome + p.offsetHeight);
    min = Math.max(min, chrome + Math.min(p.offsetHeight, STACK_MIN_LINES * line));
  });
  return full > 0 ? { full: Math.ceil(full), min: Math.ceil(min) } : null;
};

interface CapabilityCardsProps {
  ref?: Ref<HTMLDivElement>;
  /** The card the scroll is on: -1 before the first. */
  scrollIndex: number;
  /** Past Ø2.3 with the dock shown: one-at-a-time cards rotate by themselves. */
  autoRotate: boolean;
  isMobile: boolean;
  theme: Theme;
  /** Desktop: where the title ends (capTitleFit), px from the top; the cards start below. */
  titleBottom?: number;
}

/**
 * Scene 2's cards. Desktop on a tall enough window: the three stacked, each
 * step revealing the next. Otherwise (and on phones) one at a time: each new
 * one rises over the previous, which fades; after Ø2.3 they keep rotating
 * every ~5 s, paused on hover or touch, and never with reduced motion.
 * The outer box stays the same element in every mode: the timeline fades it.
 */
export const CapabilityCards = ({
  ref,
  scrollIndex,
  autoRotate,
  isMobile,
  theme,
  titleBottom = 180,
}: CapabilityCardsProps) => {
  const { w, h } = useViewport(!isMobile);
  // The card heights the stack needs; null until measured (the stack renders
  // once, before paint, to measure it).
  const [need, setNeed] = useState<Need | null>(null);
  const stack = fitStack(w, h, titleBottom, need?.min);
  // Half a px of slack: at the shrunk scale the room equals the need exactly.
  const stacked = !isMobile && h >= STACK_MIN_H && (need === null || stack.roomH + 0.5 >= need.min);

  const own = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (el: HTMLDivElement | null) => {
      own.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  useLayoutEffect(() => {
    if (!stacked || !own.current) return;
    const n = measureNeed(own.current);
    if (n && (n.full !== need?.full || n.min !== need?.min)) setNeed(n);
  }, [stacked, need]);
  // Web fonts change the wrap: measure again once they are in.
  useEffect(() => {
    if (isMobile) return;
    let live = true;
    void document.fonts?.ready.then(() => live && setNeed(null));
    return () => {
      live = false;
    };
  }, [isMobile]);

  const [rotated, setRotated] = useState<number | null>(null);
  const paused = useRef(false);
  const rotates = autoRotate && !stacked;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!rotates || reduce) return undefined;
    const id = setInterval(() => {
      if (!paused.current) setRotated((r) => ((r ?? scrollIndex) + 1) % capabilityCards.length);
    }, ROTATE_MS);
    return () => {
      clearInterval(id);
      setRotated(null);
    };
  }, [rotates, scrollIndex]);

  const shown = rotates && rotated !== null ? rotated : scrollIndex;

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

  // Whole text where it fits; otherwise all the room there is, text scrolling.
  const cardH = need ? Math.min(need.full, stack.roomH) : stack.roomH;
  const one = fitCard(w, h, titleBottom);

  return (
    <div
      ref={setRefs}
      data-testid="capability-cards"
      data-layout={isMobile ? "phone" : stacked ? "stack" : "single"}
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
      className={`pointer-events-auto absolute ${
        isMobile ? "callout-mobile left-4 right-4" : "origin-top-left"
      } ${stacked ? "flex flex-col" : ""}`}
      style={
        isMobile
          ? undefined
          : stacked
            ? {
                left: stack.left,
                top:
                  titleBottom +
                  Math.max(0, (stack.free - (3 * cardH + 2 * STACK_GAP) * stack.s) / 2),
                width: WIDE_CARD_W,
                gap: STACK_GAP,
                transform: `scale(${stack.s})`,
              }
            : {
                left: one.left,
                top: one.top,
                width: CARD_W,
                height: CARD_H,
                transform: `scale(${one.s})`,
              }
      }
    >
      {stacked ? (
        capabilityCards.map((c, i) => {
          const on = i <= scrollIndex;
          return (
            <div
              key={c.num}
              className={on ? "cap-rise" : "opacity-0"}
              style={{ height: cardH }}
              aria-hidden={on ? undefined : true}
              inert={!on}
            >
              <CapabilityCardWide card={c} theme={theme} />
            </div>
          );
        })
      ) : (
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
      )}
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
