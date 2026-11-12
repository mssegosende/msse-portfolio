import {
  SCENE1,
  SCENE2,
  SCENE2_EXIT,
  SECTION_XF_VH,
  XFADE_AT,
} from "@/components/scroll-scene/choreography";

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
  { id: "projects", num: "3", label: "Projects", steps: 2 },
  { id: "about", num: "4", label: "About", steps: 3 },
  { id: "contact", num: "5", label: "Contact", steps: 3 },
];

/** In scroll offsets: where the section starts, where each step starts, where to scroll for each step. */
export interface SectionRange {
  start: number;
  stepAt: number[];
  targets: number[];
}

// The hero timeline's length in its own units (useHeroTimeline): scene 1's
// steps are Ø1.1-Ø1.3 and scene 2's cards Ø2.1-Ø2.3, both inside the pin.
// Desktop with motion adds scene 2's exit into Projects (the section
// crossfades are on: <html data-xf="on">).
const xfOn = () => document.documentElement.dataset.xf === "on";
const heroTlEnd = () => SCENE2.end + (xfOn() ? SCENE2_EXIT : 0);
/** The section crossfade's scroll, px (useSectionDissolve), or 0 when they are off. */
const xfSpan = () => (xfOn() ? (window.innerHeight * SECTION_XF_VH) / 100 : 0);
// A normal section counts as reached when its top passes this share of the viewport.
const PROBE = 0.4;

const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

const heroPin = () => {
  const hero = document.getElementById("hero");
  // Stacked (reduced motion): no pin; scene 1 and 2 are sections of their own.
  if (!hero || hero.dataset.stacked === "true") return null;
  const parent = hero.parentElement;
  const spacer = parent?.classList.contains("pin-spacer") ? parent : hero;
  const start = docTop(spacer);
  const len = Math.max(1, spacer.offsetHeight - window.innerHeight);
  return { start, at: (t: number) => start + (len * t) / heroTlEnd() };
};

const evenSteps = (from: number, to: number, n: number) =>
  Array.from({ length: n }, (_, k) => from + ((to - from) * k) / n);

/** Measure every section; null where its element isn't on the page. */
export const measureSections = (): (SectionRange | null)[] => {
  const vh = window.innerHeight;
  const maxScroll = document.documentElement.scrollHeight - vh;
  const pin = heroPin();
  return SECTIONS.map((s, i) => {
    if (s.id === "hero" && pin) {
      const stepAt = [pin.start, pin.at(SCENE1.check), pin.at(SCENE1.headline)];
      const targets = [SCENE1.video, SCENE1.check, SCENE1.headline].map((t) => pin.at(t + 0.08));
      return { start: pin.start, stepAt, targets };
    }
    if (s.id === "capabilities" && pin) {
      const stepAt = SCENE2.cards.map((t) => pin.at(t));
      const targets = SCENE2.cards.map((t) => pin.at(t + 0.08));
      return { start: pin.at(XFADE_AT), stepAt, targets };
    }
    const el = document.getElementById(s.id);
    if (!el) return null;
    // With the crossfades (desktop with motion), a section's top is where its
    // crossfade starts: it counts as reached halfway through (the leaving one
    // has faded by then) and arrives where the crossfade ends. A pinned
    // section is measured by its pin spacer (it moves while pinned).
    const span = xfSpan();
    const box = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
    const top = docTop(box) + span;
    const from = span ? top - span / 2 : top - vh * PROBE;
    const lead = top - from;
    // Scene 3 scrolls normally (no pin): Ø3.1 is the featured card, which the
    // layout centres on screen when the section top reaches the viewport top;
    // Ø3.2 centres the folder row. The step changes halfway between the two.
    const row = s.id === "projects" ? el.querySelector('[data-testid="projects-row"]') : null;
    if (row instanceof HTMLElement) {
      // The row's place in the section, wherever the pin has it now.
      const rowTop = top + row.getBoundingClientRect().top - el.getBoundingClientRect().top;
      const rowTarget = Math.min(maxScroll, rowTop + row.offsetHeight / 2 - vh / 2);
      const targets = [top, Math.max(top + 2, rowTarget)];
      return { start: from, stepAt: [from, (targets[0]! + targets[1]!) / 2], targets };
    }
    // The next section's crossfade covers this one's last screen and its own scroll.
    const last = i === SECTIONS.length - 1;
    let to = from + el.offsetHeight - (span && !last ? vh + span : 0);
    // The page can't scroll far enough for the last section's top to cross the
    // probe line for every step, so its steps end at the bottom of the page instead.
    if (last) to = Math.max(from + 1, Math.min(to, maxScroll));
    const stepAt = evenSteps(from, to, s.steps);
    // Each target stays inside its own step (the stretched steps can be short).
    // The section's own target is its arrival (a short last section's steps
    // can end before it, which would land mid-crossfade).
    const targets = [top, ...stepAt.slice(1).map((y) => y + lead)].map((y, k) =>
      k > 0 && k + 1 < stepAt.length ? Math.min(y, stepAt[k + 1]! - 2) : Math.min(y, maxScroll),
    );
    return { start: stepAt[0]!, stepAt, targets };
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
