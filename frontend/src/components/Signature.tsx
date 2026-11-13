import { useEffect, useRef, useState, type RefObject } from "react";
import { profile } from "@/data/portfolioData";
import { useActiveSection } from "@/hooks/useActiveSection";

/**
 * The floating signature, bottom-left, from scene 2 on (María Sol's review,
 * A8; three lines since 9 Nov): a copy of the scene 5 footer's left block,
 * same fonts, sizes and colours (Contact.module.css .brand / .credit, desktop):
 * MSSE:// on its own line, then © and the role on two. Desktop only, like the
 * section index. It hides while a card, the form or the dock is under it, or
 * the footer itself is on screen, and always while Projects is. Its left edge is the sections' (64px of
 * 1440: About's dossier, the titles; María Sol, 13 Nov).
 */
export const Signature = () => {
  const { section, id } = useActiveSection();
  const ref = useRef<HTMLDivElement>(null);
  const blocked = useBlocked(ref);
  // Never over Projects (María Sol, 13 Nov): its second row of cards reaches
  // the bottom-left corner at 1440x900 and the overlap check missed it.
  const shown = section >= 1 && id !== "projects" && !blocked;

  return (
    <div
      ref={ref}
      data-testid="signature"
      aria-hidden="true"
      // signature-halo (index.css): readable over the robot's shoulder in
      // scene 2, silver in dark (María Sol, 9 Nov), black in light.
      className={`signature-halo pointer-events-none fixed bottom-[26px] left-[4.44vw] z-40 hidden whitespace-nowrap transition-opacity duration-500 lg:block ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="msse-mark m-0 text-[13px] leading-[1.5] text-[#14181D] dark:text-white">
        {profile.shortMark}
      </p>
      {/* 10px: the footer's 8px margin plus its brand button's line box,
          measured. Its 80 % is the colour's alpha, as in the footer. */}
      <p className="m-0 mt-[10px] text-[12px] leading-[1.5] text-[#14181D]/80 dark:text-white/80">
        © {new Date().getFullYear()} {profile.name}
        <br />
        Software &amp; AI engineer
      </p>
    </div>
  );
};

// What the signature never sits on: any card (scene 2's, the projects'), the
// contact form, the dock (narrow desktop windows), and the footer, which hides
// it as soon as it is on screen.
const AVOID = 'article, form, [data-testid="navigation-dock"]';

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
