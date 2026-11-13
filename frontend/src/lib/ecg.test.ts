import { describe, expect, it } from "vitest";
import { ecg, peaksBetween } from "./ecg";

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
