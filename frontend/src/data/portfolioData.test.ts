import { afterEach, describe, expect, it, vi } from "vitest";
import { capabilityCards, getProjects, layoutSpans, profile, projects } from "./portfolioData";

// Rows on the 12-column grid must fill exactly, with no half-empty row.
const fillsRows = (spans: number[]) => {
  let row = 0;
  for (const span of spans) {
    row += span;
    if (row > 12) return false;
    if (row === 12) row = 0;
  }
  return row === 0;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("layoutSpans", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i + 1))("fills every row for %i cards", (n) => {
    const spans = layoutSpans(n);
    expect(spans).toHaveLength(n);
    expect(fillsRows(spans)).toBe(true);
  });

  it("is empty for no cards", () => {
    expect(layoutSpans(0)).toEqual([]);
  });
});

describe("getProjects", () => {
  it("shows every project, drafts included, in development", () => {
    vi.stubEnv("PROD", false);
    expect(getProjects()).toEqual(projects);
  });

  it("drops drafts in production and re-lays out the rest", () => {
    vi.stubEnv("PROD", true);
    const visible = getProjects();
    expect(visible.some((p) => p.draft)).toBe(false);
    expect(visible).toHaveLength(projects.filter((p) => !p.draft).length);
    const spans = visible.map((p) => Number(p.span.replace("md:col-span-", "")));
    expect(fillsRows(spans)).toBe(true);
  });
});

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
