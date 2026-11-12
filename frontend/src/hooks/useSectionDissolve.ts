import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// The page's sections in order (the hero holds scenes 1 and 2).
const ORDER = ["hero", "projects", "about", "contact"] as const;

// The scroll it takes, as the hero's scene 1 -> 2 crossfade does: about half
// a screen (XFADE_DURATION 0.16 of the pin's 2.5 timeline seconds over its
// ~780vh), scrubbed with the hero's scrub: 1 and ease: none.
const LEAVE = { start: "bottom 80%", end: "bottom 30%" };
const ENTER = { start: "top 80%", end: "top 30%" };

/**
 * Every section change after scene 2 plays the hero's scene 1 -> 2 crossfade
 * (María Sol, 12 Nov: THE transition of the site): the same GSAP tweens
 * scrubbed by ScrollTrigger, same scroll length, scrub and easing. The leaving
 * section fades out as its bottom rises; the entering one fades in whole as
 * its top comes up: frames and content together, never a border alone. No
 * blur, no mask. Both directions (scrubbed). Desktop only (phones keep their
 * plain scroll); reduced motion: none, every section shown whole.
 * Opacity on a section, never on the Spline canvas, no transform.
 */
export const useSectionDissolve = () => {
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      ORDER.forEach((id, i) => {
        const section = document.getElementById(id);
        if (!section) return;
        // The pinned hero scrolls as its pin spacer.
        const parent = section.parentElement;
        const trigger = parent?.classList.contains("pin-spacer") ? parent : section;
        if (ORDER[i + 1]) {
          gsap.fromTo(
            section,
            { opacity: 1 },
            {
              opacity: 0,
              ease: "none",
              immediateRender: false,
              scrollTrigger: { trigger, ...LEAVE, scrub: 1 },
            },
          );
        }
        if (i > 0) {
          gsap.fromTo(
            section,
            { opacity: 0 },
            {
              opacity: 1,
              ease: "none",
              immediateRender: false,
              scrollTrigger: { trigger, ...ENTER, scrub: 1 },
            },
          );
        }
      });
      ScrollTrigger.refresh();
    });
    return () => mm.revert();
  }, []);
};
