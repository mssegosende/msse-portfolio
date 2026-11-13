import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useState } from "react";
import { activeAt, measureSections, SECTIONS, type SectionId } from "@/lib/sections";
import { scrollToY } from "./useLenis";

/** Which section (and step) the visitor is in, updated on scroll. */
export const useActiveSection = () => {
  const [active, setActive] = useState({ section: 0, step: 0 });

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const next = activeAt(measureSections(), window.scrollY);
      setActive((cur) => (cur.section === next.section && cur.step === next.step ? cur : next));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // The first measure runs before the pins exist (the sections sit at their
    // unpinned tops, so at y = 0 Projects read as reached and the rail lit
    // 03). Every ScrollTrigger refresh rebuilds the pins: measure again then.
    ScrollTrigger.addEventListener("refresh", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ScrollTrigger.removeEventListener("refresh", schedule);
    };
  }, []);

  return { ...active, id: SECTIONS[active.section]!.id as SectionId };
};

/** Scroll to a section, or to one of its steps. */
export const goToSection = (section: number, step = 0): void => {
  const r = measureSections()[section];
  const y = r?.targets[step];
  if (y !== undefined) scrollToY(Math.max(0, y));
};
