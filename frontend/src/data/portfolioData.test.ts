import { describe, expect, it } from "vitest";
import { INTRO_VIDEO } from "./introVideo";
import { capabilityCards, manifesto, profile, projectBacklog, systemCheck } from "./portfolioData";
import { PROJECTS_INTRO, showcaseProjects } from "./projectsData";

describe("hero content", () => {
  it("has three scene 2 cards, mind -> interface -> engine (the CRT design order)", () => {
    expect(capabilityCards.map((c) => c.part)).toEqual(["MIND", "INTERFACE", "ENGINE"]);
    expect(capabilityCards.map((c) => c.num)).toEqual(["1", "2", "3"]);
  });
});

describe("copy rules", () => {
  it("ships no email address: the contact destination lives only in the server's env", () => {
    const text = JSON.stringify({
      profile,
      systemCheck,
      manifesto,
      capabilityCards,
      projectBacklog,
      showcaseProjects,
    });
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(profile).not.toHaveProperty("email");
  });

  it("says since 2022, never a year count", () => {
    const text = JSON.stringify({ profile, capabilityCards });
    expect(text).not.toMatch(/\d\+\s*years/i);
    expect(text).toContain("2022");
  });

  it("has no contractions (María Sol, 13 Nov: professional, never can't or don't)", () => {
    const text = JSON.stringify({
      profile,
      systemCheck,
      manifesto,
      capabilityCards,
      projectBacklog,
      INTRO_VIDEO,
      PROJECTS_INTRO,
      showcaseProjects,
    });
    expect(text).not.toMatch(
      /n't\b|\b(I'm|I'll|I've|I'd)\b|\b(it|that|what|here|there|let)'s\b|'(re|ve|ll)\b/i,
    );
  });

  it("counts the projects in scene 3's intro", () => {
    expect(showcaseProjects).toHaveLength(6);
    expect(PROJECTS_INTRO).toMatch(/^Six projects\. One protocol: /);
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
