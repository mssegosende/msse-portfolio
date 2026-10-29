import { afterEach, describe, expect, it, vi } from "vitest";
import { getProjects, layoutSpans, projects, story, systemFeatures } from "./portfolioData";

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

// ScrollScene's timeline is built for this exact content.
describe("hero content", () => {
  it("has three system features with connector origins inside their cards", () => {
    expect(systemFeatures.map((f) => f.num)).toEqual(["01", "02", "03"]);
    for (const { lineFrom } of systemFeatures) {
      expect(lineFrom.x).toBeGreaterThanOrEqual(0);
      expect(lineFrom.x).toBeLessThanOrEqual(1);
      expect(lineFrom.y).toBeGreaterThanOrEqual(0);
      expect(lineFrom.y).toBeLessThanOrEqual(1);
    }
  });

  it("has two story paragraphs", () => {
    expect(story).toHaveLength(2);
  });
});
