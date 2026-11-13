import { describe, expect, it } from "vitest";
import { tourVideos, VIDEO_GROUPS } from "./videosData";

// The files under public/ (served at /), listed by Vite without loading them.
const PUBLIC = new Set(
  Object.keys(import.meta.glob(["/public/videos/*", "/public/intro/*"])).map((k) =>
    k.replace(/^\/public/, ""),
  ),
);

describe("the README tour", () => {
  it("has the README's sections, in order, in María Sol's groups", () => {
    expect(tourVideos.map((v) => `${v.id} ${v.title}`)).toEqual([
      "01 Hello",
      "02 Tech stack",
      "03 Polaris",
      "04 Alphecca",
      "05 Ethos",
      "06 Built, not deployed yet",
      "07 March to June",
      "08 July to November",
      "09 The series, on the shelf",
      "10 Thank you",
    ]);
    expect(tourVideos.map((v) => v.group)).toEqual([
      "INTRO",
      "INTRO",
      "SHIPPED",
      "SHIPPED",
      "SHIPPED",
      "SHIPPED",
      "FROM MARCH TO NOW",
      "FROM MARCH TO NOW",
      "THE SERIES",
      "THE SERIES",
    ]);
    expect(new Set(tourVideos.map((v) => v.group))).toEqual(new Set(VIDEO_GROUPS));
  });

  it("shows a project only with its narrated video, never as a placeholder", () => {
    const projects = ["polaris", "alphecca", "ethos", "lynx", "marvel", "blaze"];
    for (const v of tourVideos)
      if (projects.some((p) => v.title.toLowerCase().includes(p)))
        expect(v.src, v.title).toMatch(/^\/videos\//);
  });

  it("points every entry at files that exist", () => {
    for (const v of tourVideos) {
      for (const url of [v.src, v.preview, v.poster, v.captions].filter(Boolean) as string[])
        expect(PUBLIC.has(url), `${v.id}: ${url}`).toBe(true);
    }
  });
});
