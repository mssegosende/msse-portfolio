import { describe, expect, it } from "vitest";
import { RAMP, renderAscii, sdf, smoothstep, wavePath, type Shape } from "./ascii";

const frame = (step: Shape, extra: Partial<Parameters<typeof renderAscii>[0]> = {}) =>
  renderAscii({ cols: 76, rows: 40, t: 1000, prev: step, step, k: 1, glitch: false, ...extra });

describe("ascii renderer", () => {
  it("draws cols x rows characters from the ramp", () => {
    const lines = frame(0).split("\n");
    expect(lines).toHaveLength(40);
    lines.forEach((l) => expect(l).toHaveLength(76));
    expect([...frame(0)].every((ch) => ch === "\n" || RAMP.includes(ch))).toBe(true);
  });

  it("draws each shape differently, centred", () => {
    const shapes = ([0, 1, 2] as const).map((s) => frame(s));
    expect(new Set(shapes).size).toBe(3);
    // The centre of the sphere and the cube is solid; the torus has its hole.
    const centre = (txt: string) => txt.split("\n")[20]![38];
    expect(centre(shapes[0]!)).not.toBe(" ");
    expect(centre(shapes[2]!)).not.toBe(" ");
  });

  it("morphs: halfway is neither shape", () => {
    const mid = frame(2, { prev: 0, k: 0.5 });
    expect(mid).not.toBe(frame(0));
    expect(mid).not.toBe(frame(2));
  });

  it("is deterministic and only glitches when asked, on the beat", () => {
    expect(frame(1)).toBe(frame(1));
    const onBeat = { t: 3400 * 2 + 50 };
    expect(frame(1, { ...onBeat, glitch: false })).not.toBe(frame(1, { ...onBeat, glitch: true }));
    const offBeat = { t: 3400 * 2 + 1000 };
    expect(frame(1, { ...offBeat, glitch: true })).toBe(frame(1, { ...offBeat, glitch: false }));
  });

  it("has the design's distance fields", () => {
    expect(sdf(0, 0, 0, 0)).toBeCloseTo(-0.82);
    expect(sdf(0, 0.82, 0, 0)).toBeCloseTo(0);
    expect(sdf(2, 0, 0, 0)).toBeLessThan(0);
  });

  it("eases with smoothstep, clamped", () => {
    expect(smoothstep(-1)).toBe(0);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(2)).toBe(1);
  });

  it("draws the oscilloscope across its width", () => {
    const d = wavePath(0, 0, 536, 84);
    expect(d.startsWith("M0 ")).toBe(true);
    expect(d).toContain("L536 ");
  });

  it("gives the oscilloscope a live shape per object: it changes with time, not just slides", () => {
    // The same point of the screen differs between moments, and the three
    // shapes differ at the same moment.
    const at = (s: Shape, t: number) => wavePath(t, s, 536, 84);
    expect(at(0, 0)).not.toBe(at(0, 2000));
    expect(new Set([at(0, 500), at(1, 500), at(2, 500)]).size).toBe(3);
    // ENGINE is stepped: neighbouring samples often share a level.
    const ys = at(2, 800)
      .trim()
      .split(/[ML]/)
      .filter(Boolean)
      .map((p) => Number(p.trim().split(" ")[1]));
    const flat = ys.slice(1).filter((y, i) => y === ys[i]).length;
    expect(flat / ys.length).toBeGreaterThan(0.3);
    // The morph lands on the target shape.
    expect(wavePath(500, 2, 536, 84, 0, 1)).toBe(at(2, 500));
  });
});
