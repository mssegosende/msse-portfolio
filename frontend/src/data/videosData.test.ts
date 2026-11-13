import { describe, expect, it } from "vitest";
import { tourVideos, VIDEO_GROUPS } from "./videosData";

// The files under public/ (served at /), listed by Vite without loading them.
const PUBLIC = new Set(
  Object.keys(import.meta.glob(["/public/videos/*", "/public/intro/*"])).map((k) =>
    k.replace(/^\/public/, ""),
  ),
);

describe("the README tour", () => {
  it("has the README's sections, in order, in María Sol's groups, and no projects", () => {
    expect(tourVideos.map((v) => `${v.id} ${v.title}`)).toEqual([
      "01 Hello",
      "02 Tech stack",
      "03 Built, not deployed yet",
      "04 March to June",
      "05 July to November",
      "06 The series, on the shelf",
      "07 Thank you",
    ]);
    expect(tourVideos.map((v) => v.group)).toEqual([
      "INTRO",
      "INTRO",
      "SHIPPED",
      "FROM MARCH TO NOW",
      "FROM MARCH TO NOW",
      "THE SERIES",
      "THE SERIES",
    ]);
    expect(new Set(tourVideos.map((v) => v.group))).toEqual(new Set(VIDEO_GROUPS));
    // The projects have their own cards in Projects, never a channel here.
    const titles = tourVideos.map((v) => v.title.toLowerCase()).join(" ");
    for (const name of ["polaris", "alphecca", "ethos", "lynx", "marvel", "blaze"])
      expect(titles).not.toContain(name);
  });

  it("points every entry at files that exist", () => {
    for (const v of tourVideos) {
      for (const url of [v.src, v.preview, v.poster, v.captions].filter(Boolean) as string[])
        expect(PUBLIC.has(url), `${v.id}: ${url}`).toBe(true);
    }
  });
});
