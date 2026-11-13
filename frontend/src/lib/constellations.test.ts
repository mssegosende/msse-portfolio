import { describe, expect, it } from "vitest";
import { CONSTELLATIONS } from "@/data/constellations";
import { HOLD_MS, project, signalFrame, stillFrame, TYPE_MS } from "./constellations";

describe("SIGNAL's constellations", () => {
  it("are exactly the six, in María Sol's order; never Alphard", () => {
    expect(CONSTELLATIONS.map((c) => c.signal)).toEqual([
      "POLARIS",
      "ALPHECCA",
      "LYNX",
      "HELVETIOS",
      "LARAWAG",
      "ARCTURUS",
    ]);
    expect(CONSTELLATIONS.map((c) => c.con)).toEqual(["UMi", "CrB", "Lyn", "Peg", "Sco", "Boo"]);
    expect(JSON.stringify(CONSTELLATIONS)).not.toMatch(/alphard/i);
  });

  it("have catalogue data for every star the figure uses, and the named star", () => {
    for (const c of CONSTELLATIONS) {
      const hips = new Set(c.stars.map((s) => s.hip));
      for (const line of c.lines)
        for (const hip of line) expect(hips.has(hip), `${c.con} ${hip}`).toBe(true);
      expect(hips.has(c.named), c.con).toBe(true);
    }
    // Spot checks against the catalogue (J2000): Polaris, Arcturus, 51 Pegasi.
    const star = (hip: number) =>
      CONSTELLATIONS.flatMap((c) => c.stars).find((s) => s.hip === hip)!;
    expect(star(11767).dec).toBeCloseTo(89.26, 1);
    expect(star(69673).ra).toBeCloseTo(14.261, 2);
    expect(star(113357).dec).toBeCloseTo(20.77, 1);
  });

  it("project as the sky looks: north up, east to the left, inside the box", () => {
    const boo = CONSTELLATIONS.find((c) => c.con === "Boo")!;
    const { stars } = project(boo, 420, 120, 10);
    for (const s of stars) {
      expect(s.x).toBeGreaterThanOrEqual(9.99);
      expect(s.x).toBeLessThanOrEqual(410.01);
      expect(s.y).toBeGreaterThanOrEqual(9.99);
      expect(s.y).toBeLessThanOrEqual(110.01);
    }
    const at = (hip: number) => stars.find((s) => s.hip === hip)!;
    // Arcturus (dec +19) lies south of Izar (eps Boo, +27): lower on screen.
    expect(at(69673).y).toBeGreaterThan(at(72105).y);
    // The named star is drawn larger.
    expect(at(69673).named).toBe(true);
    expect(at(69673).r).toBeGreaterThan(at(72105).r);
  });

  it("type the name, then the stars one by one, then the lines, hold, erase, next", () => {
    const c = CONSTELLATIONS[0]!;
    expect(signalFrame(CONSTELLATIONS, 0)).toMatchObject({ index: 0, typed: 0, stars: 0 });
    expect(signalFrame(CONSTELLATIONS, TYPE_MS * 3 + 1).typed).toBe(3);
    const typed = c.signal.length * TYPE_MS;
    expect(signalFrame(CONSTELLATIONS, typed + 1)).toMatchObject({
      typed: 7,
      stars: 1,
      segments: 0,
    });
    // Further on: every star, then lines growing, never fewer stars.
    let last = 0;
    for (let t = typed; t < typed + 4000; t += 50) {
      const f = signalFrame(CONSTELLATIONS, t);
      if (f.index !== 0) break;
      expect(f.stars).toBeGreaterThanOrEqual(last);
      last = f.stars;
    }
    // Long enough and it moves on to ALPHECCA.
    let t = 0;
    while (signalFrame(CONSTELLATIONS, t).index === 0) t += 100;
    expect(signalFrame(CONSTELLATIONS, t).index).toBe(1);
    expect(t).toBeGreaterThan(typed + HOLD_MS);
  });

  it("still (reduced motion): POLARIS, whole", () => {
    const f = stillFrame(CONSTELLATIONS);
    expect(CONSTELLATIONS[f.index]!.signal).toBe("POLARIS");
    expect(f.stars).toBe(CONSTELLATIONS[0]!.stars.length);
    expect(f.opacity).toBe(1);
  });
});

describe("between two stars", () => {
  it("rests on the bare SIGNAL: for a beat, nothing drawn", async () => {
    const { GAP_MS } = await import("./constellations");
    let t = 0;
    while (signalFrame(CONSTELLATIONS, t).index === 0) t += 10;
    const gap = signalFrame(CONSTELLATIONS, t - GAP_MS / 2);
    expect(gap).toMatchObject({ index: 0, typed: 0, stars: 0, segments: 0, opacity: 0 });
  });
});
