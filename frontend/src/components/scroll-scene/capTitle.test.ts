import { describe, expect, it } from "vitest";
import { CAP_TITLE_SIZE, CAP_TITLE_WIDTHS, capTitleFit } from "./capTitle";

// The head's left edge as capTitleFit places it, minus the title's left and gap.
const room = (w: number, h: number) => w / 2 - 0.08 * h - 28 - 56;

describe("capTitleFit", () => {
  it.each([
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1080],
    [2560, 1440],
  ])("keeps every line of the title clear of the head at %ix%i", (w, h) => {
    const fit = capTitleFit(w, h);
    const k = fit.size / CAP_TITLE_SIZE;
    const widest = fit.lines === 1 ? CAP_TITLE_WIDTHS.full : CAP_TITLE_WIDTHS.first;
    expect(widest * k).toBeLessThanOrEqual(room(w, h) + 0.5);
  });

  it("keeps the mock's one line and size where the head leaves room", () => {
    expect(capTitleFit(3840, 1080)).toEqual({ lines: 1, size: CAP_TITLE_SIZE, bottom: 180 });
  });

  it("breaks before shrinking, and the cards start below the second line", () => {
    const fit = capTitleFit(2560, 1440);
    expect(fit).toEqual({ lines: 2, size: CAP_TITLE_SIZE, bottom: 180 + CAP_TITLE_SIZE });
    const small = capTitleFit(1440, 900);
    expect(small.lines).toBe(2);
    expect(small.size).toBeLessThan(CAP_TITLE_SIZE);
    expect(small.bottom).toBe(Math.ceil(180 - CAP_TITLE_SIZE + 2 * small.size));
  });
});
