import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SECTION_XF_VH } from "@/components/scroll-scene/choreography";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { whoosh } from "@/lib/sound";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scene 1 -> 2, as shares of its crossfade (useHeroTimeline: the HUD leaves at
 * XFADE_AT over 0.06, the grounds and robots cross over 0.16, the title rises
 * at +0.12 over 0.08, the first card comes at +0.3), out of its 0.36 seconds.
 * Every section change replays these (María Sol, 12 Nov).
 */
export const XF = {
  /** The leaving section's title and labels: gone first, fast. */
  headOut: 0.17,
  /** The leaving section fades to the ground; the entering one comes in over it. */
  out: 0.44,
  in: 0.44,
  /** The entering title rises 16px. */
  headAt: 0.33,
  headDur: 0.23,
  /** The entering cards come last, rising 40px. */
  cardsAt: 0.78,
  cardsDur: 0.22,
};

/** Where the crossfades play: desktop, with motion. Phones and reduced motion scroll plainly. */
export const XF_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/** The crossfade's scroll, px: the 1 -> 2 one (~112% of the viewport height). */
const span = () => (window.innerHeight * SECTION_XF_VH) / 100;

const parts = (el: Element | null, role: "head" | "cards") =>
  el ? Array.from(el.querySelectorAll<HTMLElement>(`[data-xf="${role}"]`)) : [];

// <html data-xf="on"> (the sections' overlap, index.css; the section index's
// targets, lib/sections) while any crossfade is built.
let built = 0;
const claim = () => {
  if (built++ > 0) return;
  const root = document.documentElement;
  root.dataset.xf = "on";
  root.style.setProperty("--xf-vh", String(SECTION_XF_VH));
};
const release = () => {
  if (--built > 0) return;
  const root = document.documentElement;
  delete root.dataset.xf;
  root.style.removeProperty("--xf-vh");
};

// One refresh for the sections built in the same commit: the overlap margins
// they turn on move everything below them.
let refreshing = 0;
const refreshSoon = () => {
  cancelAnimationFrame(refreshing);
  refreshing = requestAnimationFrame(() => ScrollTrigger.refresh());
};

/**
 * The scene 1 -> 2 crossfade into this section (María Sol, 12 Nov: THE
 * transition of the site), in place: nothing scrolls while it plays. The
 * leaving section holds its last screen (the hero its pin, Projects a sticky
 * last screen, About its sticky stage) and this one is pulled up over it
 * (margin -(100vh + span), index.css) and held at the top (pinned, or its own
 * sticky stage) for the same scroll. Over it, scrubbed like the hero (scrub 1,
 * ease none): the leaving title and labels go first, the leaving section fades
 * to the ground as this one comes in with its main visual, then this title
 * rises, and its cards come last. The hero's own exit is in its timeline
 * (useHeroTimeline), on the same shares. Opacity and transforms on DOM boxes,
 * never the canvas.
 *
 * Built by the section itself, in a layout effect: React tears the pin down
 * before it removes the section (built from a global media-query listener, a
 * layout swap at 1024px removed a pinned section from under its pin spacer
 * and the page went blank).
 */
export const useCrossfade = (
  ref: RefObject<HTMLElement | null>,
  /** The section before (its id), or null after the hero. */
  from: string | null,
  /** Pin this section for the crossfade (About holds in its own sticky stage). */
  pin: boolean,
  /** Refresh after the hero's pin and the sections above. */
  priority: number,
) => {
  const on = useMediaQuery(XF_QUERY);
  useLayoutEffect(() => {
    const into = ref.current;
    if (!on || !into) return undefined;
    claim();
    const out = from ? document.getElementById(from) : null;
    // Written only when it flips: onUpdate runs every scroll frame and
    // onRefresh on every refresh (a resize drag refreshes ~150 times), and a
    // style write each time slowed the resize enough to fail its e2e.
    let through: boolean | null = null;
    const clickThrough = (progress: number) => {
      const next = progress < XF.in / 2;
      if (next === through) return;
      through = next;
      into.style.pointerEvents = next ? "none" : "";
    };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: into,
          start: "top top",
          end: () => `+=${span()}`,
          scrub: 1,
          pin: pin ? into : false,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: priority,
          // A soft whoosh as the crossfade begins, either way (when sound is on).
          onToggle: (self) => {
            if (self.isActive) whoosh();
          },
          // Clicks go to the section on screen: pulled up over the leaving
          // one, this section ignores the pointer until it is half in (as
          // the section index counts it). Invisible, About took the clicks
          // meant for the LIVE links of Projects' second row.
          onRefresh: (self) => clickThrough(self.progress),
          onUpdate: (self) => clickThrough(self.progress),
        },
      });
      if (out) {
        // The leaving side fades the children of what its own entrance
        // faded in (the section, its title): two scrubbed timelines never
        // drive the same element, so neither resets the other.
        const head = parts(out, "head").flatMap((el) => Array.from(el.children));
        if (head.length)
          tl.fromTo(
            head,
            { opacity: 1 },
            { opacity: 0, duration: XF.headOut, immediateRender: false },
            0,
          );
        tl.fromTo(
          Array.from(out.children),
          { opacity: 1 },
          { opacity: 0, duration: XF.out, immediateRender: false },
          0,
        );
      }
      tl.fromTo(into, { opacity: 0 }, { opacity: 1, duration: XF.in }, 0);
      const head = parts(into, "head");
      if (head.length)
        tl.fromTo(
          head,
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: XF.headDur, ease: "power1.out" },
          XF.headAt,
        );
      const cards = parts(into, "cards");
      if (cards.length)
        tl.fromTo(
          cards,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: XF.cardsDur, ease: "power1.out" },
          XF.cardsAt,
        );
      tl.to({}, { duration: Math.max(0, 1 - tl.duration()) });
    });
    refreshSoon();
    return () => {
      ctx.revert();
      into.style.pointerEvents = "";
      release();
      refreshSoon();
    };
  }, [on, ref, from, pin, priority]);
};
