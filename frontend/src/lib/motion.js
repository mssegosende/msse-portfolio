// Shared entrance motion for the content sections (About, Projects,
// Capabilities, Contact).

// The one easing the site uses for entrances (a strong ease-out).
export const EASE_OUT = [0.16, 1, 0.3, 1];

// Rise-and-fade variants. `custom` on each element is its position in the
// stagger; sections differ only in the stagger step and the duration.
export const fadeUpVariants = ({ stagger = 0.08, duration = 0.8 } = {}) => ({
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
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

// Hero headline: each line slides up out of its mask.
export const heroLineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { delay: 0.2 + i * 0.18, duration: 1, ease: EASE_OUT },
  }),
};

// Hero UI (brand, status, subtitle): a short rise after the headline.
export const heroUiFade = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.7 + i * 0.15, duration: 0.8, ease: EASE_OUT },
  }),
};
