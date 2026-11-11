import { describe, expect, it } from "vitest";
import { pinPointToKeep } from "./keepPin";

const pin = { start: 0, end: 10_000 };

describe("pinPointToKeep", () => {
  it("leaves the scroll alone on a refresh no resize caused", () => {
    expect(pinPointToKeep({ resized: false, scrollY: 5_800, ...pin })).toBeNull();
  });

  it("keeps the point of the sequence across a resize refresh", () => {
    expect(pinPointToKeep({ resized: true, scrollY: 5_800, ...pin })).toBeCloseTo(0.58, 6);
  });

  it("reads the live scroll position, so a scroll just before the refresh wins", () => {
    // ScrollTrigger's cached progress may still be the top; the page is at 0.58.
    expect(pinPointToKeep({ resized: true, scrollY: 5_800, ...pin })).toBeCloseTo(0.58, 6);
  });

  it("does nothing at the top, at the end or outside the pin", () => {
    expect(pinPointToKeep({ resized: true, scrollY: 0, ...pin })).toBeNull();
    expect(pinPointToKeep({ resized: true, scrollY: 0.002, ...pin })).toBeNull();
    expect(pinPointToKeep({ resized: true, scrollY: 10_000, ...pin })).toBeNull();
    expect(pinPointToKeep({ resized: true, scrollY: 14_000, ...pin })).toBeNull();
    expect(pinPointToKeep({ resized: true, scrollY: 100, start: 0, end: 0 })).toBeNull();
  });
});
