import { describe, expect, it } from "vitest";
import {
  SCENE1,
  SCENE2,
  XFADE_AT,
  XFADE_DURATION,
  cardIndexAt,
  giantHeadFraming,
  headSway,
  heroFraming,
  vwOf,
} from "./choreography";

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 790 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

describe("heroFraming", () => {
  it("holds still with reduced motion on phones", () => {
    expect(heroFraming(true, true, VIEWPORTS[2]!)).toMatchObject({
      startScale: 1,
      startY: "2%",
      endY: "3%",
    });
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

  it("moves the rig, not the canvas, on phones", () => {
    const f = giantHeadFraming(true, { width: 390, height: 844 });
    expect(f.x).toBe("0%");
    expect(f.rx).toBeTypeOf("number");
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

describe("vwOf", () => {
  it("converts px from the centre into % of the viewport width", () => {
    expect(vwOf(2000)(-350)).toBe("-17.5%");
  });
});
