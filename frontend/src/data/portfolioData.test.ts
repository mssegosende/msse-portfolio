import { describe, expect, it } from "vitest";
import { capabilityCards, profile } from "./portfolioData";

describe("hero content", () => {
  it("has three scene 2 cards, mind -> interface -> engine (the CRT design order)", () => {
    expect(capabilityCards.map((c) => c.part)).toEqual(["MIND", "INTERFACE", "ENGINE"]);
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

describe("scene 2 dossier rows", () => {
  it("has the approved FUNCTION and SHIPPED IN lists", () => {
    expect(capabilityCards.map((c) => [c.title, c.function, c.shippedIn])).toEqual([
      ["AI ENGINEERING", "AGENTS · RAG · EVALS", "BLAZE · POLARIS · LYNX"],
      ["FRONTEND", "MOTION · 3D · EDITORS", "BLAZE · MARVEL · ETHOS"],
      ["BACKEND", "APIS · CONTRACTS · DATA", "ETHOS · POLARIS · THIS SITE"],
    ]);
  });
});
