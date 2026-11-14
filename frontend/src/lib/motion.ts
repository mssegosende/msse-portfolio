import type { Variants } from "framer-motion";
import { CAPTURE_QUERY } from "./capture";

/**
 * The still site: reduced motion, or capture mode (a full-page screenshot or a
 * print, lib/capture). No pin, no scrub, every scene stacked and shown whole.
 * The hidden starting states of the scroll reveals are set by JS (a data
 * attribute written on the first render), never by CSS alone, and never with
 * this on.
 */
export const REDUCED_MOTION_QUERY = `(prefers-reduced-motion: reduce), ${CAPTURE_QUERY}`;

// Shared entrance motion for the content sections (About, Projects,
// Capabilities, Contact).

// The one easing the site uses for entrances (a strong ease-out).
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Rise-and-fade variants. `custom` on each element is its position in the
// stagger; sections differ only in the stagger step and the duration.
export const fadeUpVariants = ({ stagger = 0.08, duration = 0.8 } = {}): Variants => ({
  hidden: { opacity: 0, y: 36 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * stagger, duration, ease: EASE_OUT },
  }),
});

// Props that play the variants once, when the element scrolls into view.
export const revealOnView = (margin = "-80px") => ({
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin },
});
