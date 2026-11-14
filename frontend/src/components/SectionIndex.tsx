import { Fragment } from "react";
import { SECTIONS } from "@/lib/sections";
import { goToSection, useActiveSection } from "@/hooks/useActiveSection";
import { clampScale, useFrame } from "@/hooks/useFrame";

/**
 * The five sections down the right edge, 01 · 02 · 03 · 04 · 05 (María Sol,
 * 12 Nov), in the style of Hero.dc.html's rail: boxed squares joined by short
 * lines, VT323, the active one lit. The same place on every section; a click
 * scrolls to the section and the active one follows the scroll. Desktop only.
 * Scales with the window like scene 1's HUD.
 */
export const SectionIndex = () => {
  const { section } = useActiveSection();
  const { kw, kh } = useFrame();
  const zoom = clampScale(Math.min(kw, 1.15 * kh), 0.75, 1.9);

  return (
    <nav
      aria-label="Sections"
      data-testid="section-index"
      data-capture-hide
      className="fixed right-[0.8vw] top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center lg:flex"
      style={{ zoom }}
    >
      {SECTIONS.map((s, i) => (
        <Fragment key={s.id}>
          {i > 0 && <span aria-hidden="true" className="h-[22px] w-px bg-crt-line" />}
          <button
            type="button"
            aria-label={s.label}
            aria-current={i === section ? "true" : undefined}
            aria-pressed={i === section}
            onClick={() => goToSection(i)}
            className="crt-rail-btn crt-index-btn min-h-11 min-w-11 font-vt text-[20px]"
          >
            <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          </button>
        </Fragment>
      ))}
    </nav>
  );
};
