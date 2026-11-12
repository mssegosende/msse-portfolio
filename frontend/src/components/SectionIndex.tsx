import { Fragment } from "react";
import { SECTIONS } from "@/lib/sections";
import { goToSection, useActiveSection } from "@/hooks/useActiveSection";

// CRT (SPEC §2b): JetBrains Mono, the dim ink; the active one in the title
// ink with the glow and a short glowing tick.
const ON = "crt-index__on";
const OFF = "crt-index__off";

/**
 * The five sections down the right edge; the active one opens its steps.
 * Desktop only.
 */
export const SectionIndex = () => {
  const { section, step } = useActiveSection();
  // In the hero it comes in with Ø1.3 (design: scene 1, third step).
  const shown = section > 0 || step >= 2;

  return (
    <nav
      aria-label="Sections"
      data-testid="section-index"
      aria-hidden={shown ? undefined : true}
      className={`fixed right-3 top-[28vh] z-40 hidden flex-col items-center gap-0.5 font-mono tracking-[0.06em] transition-opacity duration-500 lg:flex ${
        shown ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {SECTIONS.map((s, i) => (
        <Fragment key={s.id}>
          <button
            type="button"
            aria-label={s.label}
            aria-current={i === section ? "true" : undefined}
            onClick={() => goToSection(i)}
            className={`relative min-h-10 min-w-11 text-[14px] transition-colors ${i === section ? ON : OFF}`}
          >
            <span aria-hidden="true">Ø{s.num}</span>
          </button>
          {i === section &&
            Array.from({ length: s.steps }, (_, k) => (
              <button
                key={k}
                type="button"
                aria-label={`Step ${s.num}.${k + 1}`}
                aria-current={k === step ? "step" : undefined}
                onClick={() => goToSection(i, k)}
                className={`relative min-h-[30px] min-w-11 text-[11px] transition-colors ${k === step ? ON : OFF}`}
              >
                <span aria-hidden="true">
                  Ø{s.num}.{k + 1}
                </span>
              </button>
            ))}
        </Fragment>
      ))}
    </nav>
  );
};
