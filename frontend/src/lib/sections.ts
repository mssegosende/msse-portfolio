import { BEATS } from "@/components/scroll-scene/choreography";

export type SectionId = "hero" | "capabilities" | "projects" | "about" | "contact";

export interface IndexSection {
  id: SectionId;
  /** Plain number; rendered with the slashed zero (Ø1). */
  num: string;
  label: string;
  steps: number;
}

/** The five sections, in page order (design/HANDOFF.md, "Section index"). */
export const SECTIONS: IndexSection[] = [
  { id: "hero", num: "1", label: "Hero", steps: 3 },
  { id: "capabilities", num: "2", label: "Capabilities", steps: 3 },
  { id: "projects", num: "3", label: "Projects", steps: 4 },
  { id: "about", num: "4", label: "About", steps: 3 },
  { id: "contact", num: "5", label: "Contact", steps: 3 },
];

/** In scroll offsets: where the section starts, where each step starts, where to scroll for each step. */
export interface SectionRange {
  start: number;
  stepAt: number[];
  targets: number[];
}

// The hero timeline's length in its own units (useHeroTimeline): the chapter
// 2 cards are its last three beats, so they are Ø2.1-Ø2.3.
// TODO(P2): read these from the new timeline instead.
const HERO_TL_END = 3.45;
// A normal section counts as reached when its top passes this share of the viewport.
const PROBE = 0.4;

const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

const heroPin = () => {
  const hero = document.getElementById("hero");
  if (!hero) return null;
  const parent = hero.parentElement;
  const spacer = parent?.classList.contains("pin-spacer") ? parent : hero;
  const start = docTop(spacer);
  const len = Math.max(1, spacer.offsetHeight - window.innerHeight);
  return { start, at: (t: number) => start + (len * t) / HERO_TL_END };
};

const evenSteps = (from: number, to: number, n: number) =>
  Array.from({ length: n }, (_, k) => from + ((to - from) * k) / n);

/** Measure every section; null where its element isn't on the page. */
export const measureSections = (): (SectionRange | null)[] => {
  const vh = window.innerHeight;
  const pin = heroPin();
  const capStart = BEATS[0]?.at ?? 1.1;
  return SECTIONS.map((s) => {
    if (s.id === "hero") {
      if (!pin) return null;
      const stepAt = evenSteps(pin.start, pin.at(capStart), s.steps);
      return { start: pin.start, stepAt, targets: [0, ...stepAt.slice(1)] };
    }
    if (s.id === "capabilities" && pin) {
      const stepAt = BEATS.map((b) => pin.at(b.at));
      return { start: stepAt[0]!, stepAt, targets: BEATS.map((b) => pin.at(b.cardAt + 0.1)) };
    }
    const el = document.getElementById(s.id);
    if (!el) return null;
    const top = docTop(el);
    const stepAt = evenSteps(top - vh * PROBE, top - vh * PROBE + el.offsetHeight, s.steps);
    return {
      start: stepAt[0]!,
      stepAt,
      targets: [top, ...stepAt.slice(1).map((y) => y + vh * PROBE)],
    };
  });
};

/** The active section and step for a scroll offset. */
export const activeAt = (ranges: (SectionRange | null)[], y: number) => {
  let section = 0;
  ranges.forEach((r, i) => {
    if (r && y >= r.start - 1) section = i;
  });
  const r = ranges[section];
  let step = 0;
  r?.stepAt.forEach((at, k) => {
    if (y >= at - 1) step = k;
  });
  return { section, step };
};
