import { describe, expect, it } from "vitest";
import { capHeadClear, capTitleFit } from "./capTitle";
import { fitRow, rowOffset } from "./capRow";

const SIZES: [number, number, number][] = [
  [1280, 720, 2],
  [1440, 900, 2],
  [1920, 1080, 2],
  [2560, 1080, 3],
  [2560, 1440, 3],
];

describe("fitRow", () => {
  it.each(SIZES)("%ix%i fits %i cards before the head", (w, h, fit) => {
    const row = fitRow(w, h, capTitleFit(w, h).bottom, 3);
    expect(row.fit).toBe(fit);
    // The cards that fit end before the head.
    expect(
      row.left + rowOffset(row, fit - 1) + fit * row.cardW + (fit - 1) * row.gap,
    ).toBeLessThanOrEqual(capHeadClear(w, h) + 0.01);
    // The row and its controls stay above the dock.
    expect(row.top + row.cardH + (fit < 3 ? 46 : 0)).toBeLessThanOrEqual(h - 100 + 0.01);
  });

  it("slides only as far as the newest card needs", () => {
    const row = fitRow(1440, 900, capTitleFit(1440, 900).bottom, 3);
    expect(rowOffset(row, 1)).toBe(0);
    const off = rowOffset(row, 2);
    expect(off).toBeGreaterThan(0);
    expect(row.left + 3 * row.cardW + 2 * row.gap - off).toBeCloseTo(row.left + row.room, 5);
  });
});
