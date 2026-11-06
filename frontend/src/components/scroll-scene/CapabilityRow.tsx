import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from "react";
import { capabilityCards } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";
import { CapabilityCard } from "./CapabilityCard";
import { CARD_H, CARD_W, ROW_CONTROLS, fitRow, rowOffset } from "./capRow";
import s from "./CapabilityRow.module.css";

/** Room around the cards inside the row's mask: the rise (40px) and the drop shadow. */
const PAD_T = 48;
const PAD_B = 140;
/** Past the head's line, for the shadow only (the mask ends at the line when a card waits there). */
const PAD_R = 90;
/** A drag this long (px) moves the row one card. */
const DRAG_STEP = 40;

const INK = { light: "text-[#14181D]", dark: "text-[#E9EDF1]" };

const useViewport = () => {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
};

interface CapabilityRowProps {
  ref?: Ref<HTMLDivElement>;
  /** The card the scroll is on: -1 before the first. */
  scrollIndex: number;
  theme: Theme;
  /** Where the title ends (capTitleFit), px from the top. */
  titleBottom: number;
}

/**
 * Desktop scene 2 (María Sol's review): the vertical cards in one row under
 * the title, each step (Ø2.1-Ø2.3) bringing the next in from the left, and
 * the cards stay. Where the next one doesn't fit before the head, the row
 * slides left and the earliest card fades out at the left edge. Then the row
 * is a carousel: drag or swipe it, use the arrow keys (from a card's text or
 * the controls) or the ‹ › controls to bring the hidden cards back. It only
 * moves on the scroll or the visitor's own gesture, and with reduced motion
 * it moves without sliding.
 */
export const CapabilityRow = ({ ref, scrollIndex, theme, titleBottom }: CapabilityRowProps) => {
  const count = capabilityCards.length;
  const { w, h } = useViewport();
  const row = fitRow(w, h, titleBottom, count);
  const step = row.cardW + row.gap;

  const revealed = Math.max(0, Math.min(count, scrollIndex + 1));
  const carousel = revealed > row.fit;
  // The last card fully in the row: the newest, unless the visitor went back.
  const newest = Math.max(0, revealed - 1);
  const oldest = Math.max(0, Math.min(row.fit, revealed) - 1);
  const [chosen, setChosen] = useState<number | null>(null);
  // A new card (or one going away on the way back) puts the row on the newest.
  const [seen, setSeen] = useState(revealed);
  if (seen !== revealed) {
    setSeen(revealed);
    setChosen(null);
  }
  const last = Math.max(oldest, Math.min(newest, chosen ?? newest));
  const go = (d: number) => setChosen(Math.max(oldest, Math.min(newest, last + d)));

  // Dragging: the row follows the pointer, then settles one card over.
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const [dx, setDx] = useState(0);
  const maxOffset = rowOffset(row, newest);
  const offset = Math.max(0, Math.min(maxOffset, rowOffset(row, last) - dx));

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!carousel || (e.pointerType === "mouse" && e.button !== 0)) return;
    drag.current = { x: e.clientX, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const delta = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(delta) < 6) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDx(delta);
  };
  const onPointerEnd = () => {
    if (drag.current?.moved) {
      if (dx <= -DRAG_STEP) go(1);
      else if (dx >= DRAG_STEP) go(-1);
    }
    drag.current = null;
    setDx(0);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!carousel || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    go(e.key === "ArrowLeft" ? -1 : 1);
  };

  // Which revealed cards are off the row, and the fades over them.
  const windowW = row.left + row.room + PAD_R;
  const place = capabilityCards.map((_, i) => {
    const x = i * step - offset;
    if (i >= revealed) return "waiting" as const;
    if (x < -0.5) return "left" as const;
    if (x + row.cardW > row.room + 0.5) return "right" as const;
    return "in" as const;
  });
  const lastLeft = place.lastIndexOf("left");
  const firstRight = place.indexOf("right");
  const fadeL = lastLeft < 0 ? 0 : row.left + Math.max(0, lastLeft * step + row.cardW - offset);
  const fadeRB = firstRight < 0 ? 0 : PAD_R;
  const fadeRA =
    firstRight < 0
      ? 0
      : Math.max(fadeRB, windowW - (row.left + firstRight * step - row.gap - offset));

  return (
    <div
      ref={ref}
      data-testid="capability-cards"
      data-layout="row"
      data-fit={row.fit}
      className={`pointer-events-none absolute inset-0 ${INK[theme]}`}
      onKeyDown={onKeyDown}
    >
      <div
        data-testid="capability-row"
        data-dragging={dx !== 0 ? "true" : undefined}
        role={carousel ? "region" : undefined}
        aria-roledescription={carousel ? "carousel" : undefined}
        aria-label={carousel ? "Capabilities" : undefined}
        className={s.window}
        style={
          {
            top: row.top - PAD_T,
            width: windowW,
            height: PAD_T + row.cardH + PAD_B,
            "--fade-l": `${fadeL}px`,
            "--fade-r-a": `${fadeRA}px`,
            "--fade-r-b": `${fadeRB}px`,
          } as CSSProperties
        }
      >
        <div
          className={`${s.track} pointer-events-auto`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          data-carousel={carousel ? "true" : undefined}
          style={{
            left: row.left,
            top: PAD_T,
            width: count * step - row.gap,
            height: row.cardH,
            transform: `translateX(${-offset}px)`,
          }}
        >
          {capabilityCards.map((c, i) => {
            const at = place[i];
            const off = at !== "in";
            return (
              <div
                key={c.num}
                className={s.slot}
                data-place={at}
                aria-hidden={off ? true : undefined}
                inert={off}
                style={{ left: i * step, width: row.cardW, height: row.cardH }}
              >
                <div
                  className="origin-top-left"
                  style={{ width: CARD_W, height: CARD_H, transform: `scale(${row.s})` }}
                >
                  <div className={at === "waiting" ? "opacity-0" : "cap-rise"}>
                    <CapabilityCard card={c} theme={theme} isMobile={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {carousel && (
        <div
          data-testid="capability-controls"
          className={s.controls}
          style={{ left: row.left, top: row.top + row.cardH + ROW_CONTROLS - 32 }}
        >
          <button
            type="button"
            className={s.control}
            aria-label="Previous capability"
            disabled={last <= oldest}
            onClick={() => go(-1)}
          >
            ‹
          </button>
          <button
            type="button"
            className={s.control}
            aria-label="Next capability"
            disabled={last >= newest}
            onClick={() => go(1)}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
