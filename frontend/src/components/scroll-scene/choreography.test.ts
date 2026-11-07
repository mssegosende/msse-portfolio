import { describe, expect, it } from "vitest";
import {
  SCENE1,
  SCENE2,
  XFADE_AT,
  XFADE_DURATION,
  cardIndexAt,
  giantHeadFraming,
  headLook,
  headSway,
  cursorAttention,
  heroFraming,
  phoneApproachFrom,
  snapStops,
  vwOf,
} from "./choreography";

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 790 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

describe("heroFraming", () => {
  it("frames phones the same with or without reduced motion, right of centre, and holds", () => {
    const phone = { width: 390, height: 844 };
    const moving = heroFraming(true, false, phone);
    expect(heroFraming(true, true, phone)).toEqual(moving);
    expect(moving.endY).toBe(moving.startY);
    expect(moving.heroDx).toBeGreaterThan(0);
  });

  it("frames the desktop robot the same way with or without reduced motion, and holds", () => {
    for (const viewport of VIEWPORTS) {
      const moving = heroFraming(false, false, viewport);
      expect(heroFraming(false, true, viewport)).toEqual(moving);
      expect(moving.endY).toBe(moving.startY);
    }
  });
});

describe("giantHeadFraming", () => {
  it("puts the desktop head right of centre, by the same share at any height", () => {
    const a = giantHeadFraming(false, { width: 1440, height: 900 });
    const b = giantHeadFraming(false, { width: 1920, height: 1080 });
    expect(parseFloat(a.x)).toBeGreaterThan(0);
    expect(a.scale).toBe(b.scale);
  });

  it("frames the phone head below the title, and approaches it from further back and right", () => {
    const viewport = { width: 390, height: 844 };
    const f = giantHeadFraming(true, viewport);
    expect(parseFloat(f.y)).toBeGreaterThan(0);
    const from = phoneApproachFrom(f, viewport);
    expect(from.scale).toBeLessThan(f.scale);
    expect(parseFloat(from.x)).toBeGreaterThan(parseFloat(f.x));
    expect(parseFloat(from.y)).toBeGreaterThan(parseFloat(f.y));
  });

  // Screen y of a model point n at framing f: (0.5 - scale * n + y / 100) * h.
  const crownAt = (f: { scale: number; y: string }, h: number) =>
    (0.5 - f.scale * 0.4437 + parseFloat(f.y) / 100) * h;

  it.each([
    [390, 844, 170],
    [430, 932, 170],
    [700, 1000, 130],
    [600, 1300, 130],
  ])("phone layout %ix%i: the crown just under the title, at any height (A9)", (w, h, title) => {
    const f = giantHeadFraming(true, { width: w, height: h }, title);
    expect(crownAt(f, h)).toBeCloseTo(title + 6, 0);
  });

  it("frames the desktop head as in 1440x900, scaled, on a window narrower than 16:10", () => {
    const ref = giantHeadFraming(false, { width: 1440, height: 900 });
    const tall = giantHeadFraming(false, { width: 900, height: 1000 });
    // The head's size on screen (scale x height) is 900/1440 of the reference.
    expect(tall.scale * 1000).toBeCloseTo(ref.scale * 900 * (900 / 1440), 5);
    // Its crown sits the same share of that size above the top.
    expect(crownAt(tall, 1000)).toBeCloseTo(crownAt(ref, 900) * (900 / 1440), 5);
  });
});

describe("snapStops", () => {
  it("stops on the hero, each card and the end, in order", () => {
    const stops = snapStops();
    expect(stops).toHaveLength(SCENE2.cards.length + 2);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
    expect([...stops].sort((a, b) => a - b)).toEqual(stops);
    SCENE2.cards.forEach((_, i) => expect(cardIndexAt(stops[i + 1]! * SCENE2.end)).toBe(i));
  });
});

describe("timeline", () => {
  it("runs scene 1's steps in order, before the crossfade", () => {
    const steps = [SCENE1.video, SCENE1.check, SCENE1.headline, SCENE1.scroll];
    expect([...steps].sort((a, b) => a - b)).toEqual(steps);
    expect(SCENE1.scroll).toBeLessThan(XFADE_AT);
  });

  it("shows the first card after the crossfade and the last one before the end", () => {
    expect(SCENE2.cards[0]).toBeGreaterThan(XFADE_AT + XFADE_DURATION);
    expect(SCENE2.cards[SCENE2.cards.length - 1]).toBeLessThan(SCENE2.end);
  });

  it("maps the scrubbed time to the card on screen", () => {
    expect(cardIndexAt(0)).toBe(-1);
    expect(cardIndexAt(SCENE2.cards[0]!)).toBe(0);
    expect(cardIndexAt(SCENE2.cards[1]! + 0.01)).toBe(1);
    expect(cardIndexAt(SCENE2.end)).toBe(2);
  });
});

describe("headSway", () => {
  it("caps the head at ±0.35 rad whatever the cursor does", () => {
    for (let t = 0; t < 60; t += 0.7) {
      const { x, y } = headSway(t, { x: 5, y: -5 });
      expect(Math.abs(x)).toBeLessThanOrEqual(0.35);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.35);
    }
  });
});

describe("headLook", () => {
  it("looks to one side and the other with the cursor idle, capped", () => {
    let min = 0;
    let max = 0;
    for (let t = 0; t < 42; t += 0.25) {
      const { x, y } = headLook(t, { x: 0, y: 0 }, 0);
      min = Math.min(min, y);
      max = Math.max(max, y);
      expect(Math.abs(x)).toBeLessThanOrEqual(0.5);
    }
    expect(max).toBeGreaterThan(0.3);
    expect(min).toBeLessThan(-0.25);
  });

  it("follows the cursor while it moves, whatever the look-around is doing", () => {
    const t = 7; // mid look to one side
    const { y } = headLook(t, { x: -0.5, y: 0 }, 1);
    expect(y).toBeLessThan(-0.2);
    expect(Math.abs(headLook(t, { x: 9, y: -9 }, 1).y)).toBeLessThanOrEqual(0.5);
  });

  it("fades the cursor's pull out after it stops", () => {
    expect(cursorAttention(0)).toBe(1);
    expect(cursorAttention(3500)).toBeCloseTo(0.5);
    expect(cursorAttention(10000)).toBe(0);
  });
});

describe("vwOf", () => {
  it("converts px from the centre into % of the viewport width", () => {
    expect(vwOf(2000)(-350)).toBe("-17.5%");
  });
});
