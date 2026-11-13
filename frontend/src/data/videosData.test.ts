import { describe, expect, it } from "vitest";
import { tourVideos, VIDEO_GROUPS } from "./videosData";

// The files under public/ (served at /), listed by Vite without loading them.
const PUBLIC = new Set(
  Object.keys(import.meta.glob(["/public/videos/*", "/public/intro/*"])).map((k) =>
    k.replace(/^\/public/, ""),
  ),
);

describe("the README tour", () => {
  it("has the 13 entries, in order, in María Sol's groups", () => {
    expect(tourVideos.map((v) => v.id)).toEqual(
      Array.from({ length: 13 }, (_, i) => String(i + 1).padStart(2, "0")),
    );
    const groupOf = (id: string) => tourVideos.find((v) => v.id === id)?.group;
    expect(["01", "02"].map(groupOf)).toEqual(["INTRO", "INTRO"]);
    expect(["03", "09"].map(groupOf)).toEqual(["SHIPPED", "SHIPPED"]);
    expect(["10", "11"].map(groupOf)).toEqual(["FROM MARCH TO NOW", "FROM MARCH TO NOW"]);
    expect(["12", "13"].map(groupOf)).toEqual(["THE SERIES", "THE SERIES"]);
    expect(new Set(tourVideos.map((v) => v.group))).toEqual(new Set(VIDEO_GROUPS));
  });

  it("points every entry at files that exist", () => {
    for (const v of tourVideos) {
      for (const url of [v.src, v.preview, v.poster, v.captions].filter(Boolean) as string[])
        expect(PUBLIC.has(url), `${v.id}: ${url}`).toBe(true);
    }
  });
});
