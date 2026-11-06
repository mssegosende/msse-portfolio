import { describe, expect, it } from "vitest";
import { capabilityCards, profile } from "./portfolioData";

describe("hero content", () => {
  it("has three scene 2 cards, mind -> nerves -> body", () => {
    expect(capabilityCards.map((c) => c.part)).toEqual(["MIND", "NERVES", "BODY"]);
    expect(capabilityCards.map((c) => c.num)).toEqual(["1", "2", "3"]);
  });
});

describe("copy rules", () => {
  it("says since 2022, never a year count", () => {
    const text = JSON.stringify({ profile, capabilityCards });
    expect(text).not.toMatch(/\d\+\s*years/i);
    expect(text).toContain("2022");
  });
});
