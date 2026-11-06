import { describe, expect, it } from "vitest";
import {
  BEATS,
  GAZE,
  XFADE_AT,
  chapterTwoFramings,
  closeAt,
  connectorAnchors,
  heroFraming,
  vwOf,
  type Framing,
} from "./choreography";

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 790 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
// Where the features title ends at the desktop sizes (top-12 plus its text).
const HEAD_BOTTOM_PX = 163;

// The native canvas fraction at the frame's bottom edge.
const bottomEdge = ({ scale, y }: Framing) => 0.5 + (0.5 - parseFloat(y) / 100) / scale;
const DESKTOP_WAIST = 0.709;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

describe("chapterTwoFramings", () => {
  it.each(VIEWPORTS)("keeps the waist out of frame at $width x $height", (viewport) => {
    const { steps } = chapterTwoFramings(false, viewport, HEAD_BOTTOM_PX);
    // On every beat and in between, sampled the way the timeline interpolates.
    for (let i = 0; i < steps.length - 1; i++) {
      const a = steps[i]!;
      const b = steps[i + 1]!;
      for (let f = 0; f <= 1; f += 0.05) {
        const between = {
          scale: lerp(a.scale, b.scale, f),
          x: "0%",
          y: `${lerp(parseFloat(a.y), parseFloat(b.y), f)}%`,
        };
        expect(bottomEdge(between)).toBeLessThan(DESKTOP_WAIST);
      }
    }
  });

  it("has six steps, starting from the story's head shot as the second", () => {
    for (const isMobile of [false, true]) {
      const { steps, story } = chapterTwoFramings(isMobile, VIEWPORTS[2]!, HEAD_BOTTOM_PX);
      expect(steps).toHaveLength(6);
      expect(steps[1]).toBe(story);
    }
  });

  it("moves the rig, not the canvas, on phones", () => {
    const { steps } = chapterTwoFramings(true, { width: 390, height: 844 }, HEAD_BOTTOM_PX);
    for (const step of steps) {
      expect(step.x).toBe("0%");
      expect(step.rx).toBeTypeOf("number");
    }
  });
});

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

describe("vwOf", () => {
  it("converts px from the centre into % of the viewport width", () => {
    expect(vwOf(2000)(-350)).toBe("-17.5%");
  });
});

describe("gaze and anchors", () => {
  it("caps every gaze pose at ±0.35 rad", () => {
    for (const { x, y } of Object.values(GAZE)) {
      expect(Math.abs(x)).toBeLessThanOrEqual(0.35);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.35);
    }
  });

  it("re-anchors cards 02 and 03 for the desktop close only", () => {
    expect(connectorAnchors(false).map((a) => !!a.close)).toEqual([false, true, true]);
    expect(connectorAnchors(true).every((a) => !a.close)).toBe(true);
  });

  it("returns fresh anchors each time", () => {
    const first = connectorAnchors(false);
    first[0]!.fromX = 42;
    expect(connectorAnchors(false)[0]!.fromX).toBe(0);
  });
});

describe("beats", () => {
  it("spaces the steps evenly and lands each card after its step, after the crossfade", () => {
    BEATS.forEach(({ at, cardAt }, i) => {
      expect(at).toBeGreaterThan(XFADE_AT);
      expect(cardAt).toBeGreaterThan(at);
      if (i > 0) expect(at - BEATS[i - 1]!.at).toBeCloseTo(0.6);
    });
  });

  it("closes after the last card has landed", () => {
    const lastCard = BEATS[BEATS.length - 1]!.cardAt;
    expect(closeAt(true)).toBeGreaterThan(lastCard);
    expect(closeAt(false)).toBeGreaterThan(lastCard);
  });
});
