import { useEffect, useRef, useState, type RefObject } from "react";
import { profile } from "@/data/portfolioData";
import { useActiveSection } from "@/hooks/useActiveSection";

/**
 * The floating signature, bottom-left, from scene 2 on (María Sol's review,
 * A8): the scene 5 footer's text on one line. Desktop only, like the section
 * index, in the page ink like the dock. It wraps before it reaches the dock,
 * sits below scene 2's cards, and hides while a card or the form is under it,
 * or the footer itself is on screen.
 */
export const Signature = () => {
  const { section } = useActiveSection();
  const ref = useRef<HTMLParagraphElement>(null);
  const blocked = useBlocked(ref);
  const shown = section >= 1 && !blocked;

  return (
    <p
      ref={ref}
      data-testid="signature"
      aria-hidden="true"
      className={`pointer-events-none fixed bottom-[26px] left-9 z-40 m-0 hidden max-w-[calc(50vw-380px)] text-[11px] leading-[1.5] text-ink/80 transition-opacity duration-500 lg:block ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* It wraps between the parts, never inside one. */}
      <span className="whitespace-nowrap">
        <span className="font-michroma tracking-[0.16em]">{profile.shortMark}</span> ·
      </span>{" "}
      <span className="whitespace-nowrap">
        © {new Date().getFullYear()} {profile.name} ·
      </span>{" "}
      <span className="whitespace-nowrap">Software &amp; AI engineer</span>
    </p>
  );
};

// What the signature never sits on: any card (scene 2's, the projects'), the
// contact form, and the footer, which hides it as soon as it is on screen.
const AVOID = "article, form";

const overlaps = (a: DOMRect, b: DOMRect) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const useBlocked = (ref: RefObject<HTMLElement | null>) => {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = ref.current;
      // Hidden (phones): nothing to place. offsetParent is always null when fixed.
      const box = el?.getBoundingClientRect();
      if (!box?.width) return;
      const footer = document.querySelector('[data-testid="footer"]')?.getBoundingClientRect();
      const next =
        (!!footer && footer.top < window.innerHeight) ||
        [...document.querySelectorAll(AVOID)].some((n) => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && overlaps(box, r) && getComputedStyle(n).visibility !== "hidden";
        });
      setBlocked(next);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref]);
  return blocked;
};
