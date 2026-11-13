import { describe, expect, it } from "vitest";
import { breath, ecg, peaksBetween, pleth } from "./ecg";

describe("ecg", () => {
  it("beats 63-75 times a minute, each with a sharp R spike", () => {
    const peaks = peaksBetween(0, 60000);
    expect(peaks.length).toBeGreaterThanOrEqual(63);
    expect(peaks.length).toBeLessThanOrEqual(75);
    for (const p of peaks.slice(0, 10)) {
      expect(ecg(p)).toBeGreaterThan(0.8);
      // Sharp: 30 ms away it has fallen well below the peak.
      expect(ecg(p + 30)).toBeLessThan(ecg(p) * 0.5);
    }
  });

  it("varies beat to beat", () => {
    const peaks = peaksBetween(0, 10000);
    const gaps = peaks.slice(1).map((p, i) => Math.round(p - peaks[i]!));
    expect(new Set(gaps).size).toBeGreaterThan(3);
    const heights = peaks.map((p) => ecg(p).toFixed(3));
    expect(new Set(heights).size).toBeGreaterThan(3);
  });
});

describe("Contact's monitors", () => {
  it("pulse: smooth, one wave per heartbeat, never a spike", () => {
    // Continuous: over 2 ms it never moves more than a smooth upstroke would.
    let maxStep = 0;
    for (let t = 1000; t < 11000; t += 2)
      maxStep = Math.max(maxStep, Math.abs(pleth(t + 2) - pleth(t)));
    expect(maxStep).toBeLessThan(0.03);
    const peaks = peaksBetween(1000, 11000).length;
    let waves = 0;
    for (let t = 1000; t < 11000; t += 10) if (pleth(t) > 0.7 && pleth(t - 10) <= 0.7) waves++;
    expect(Math.abs(waves - peaks)).toBeLessThanOrEqual(1);
  });

  it("breathing: 12-16 breaths a minute, smooth", () => {
    let breaths = 0;
    for (let t = 0; t < 60000; t += 20) if (breath(t) > 0.5 && breath(t - 20) <= 0.5) breaths++;
    expect(breaths).toBeGreaterThanOrEqual(12);
    expect(breaths).toBeLessThanOrEqual(16);
  });
});
