import type { CSSProperties } from "react";

export type SectionScene = "projects" | "about" | "contact";

interface Backdrop {
  word: string;
  wordSide: "left" | "right";
  /** Darker ground at the top: the softer word gradient. */
  softWord: boolean;
  /** Glow centre and size, in % of the section (centre) and px (size). */
  glow: { x: string; y: string; w: number; h: number; a: number };
  /** Section-specific shade, layered under the shared vignette. */
  shade?: string;
}

// Values from design/source/desktop/light/scene-{3..5}*.dc.html (1440 x 900).
// Scene 2 (capabilities) is inside the pinned hero (ScrollScene). Every word
// sits behind its own title, as HUMAN does (María Sol's review): WORK and
// SIGNAL moved from the mock's right to the left.
const BACKDROPS: Record<SectionScene, Backdrop> = {
  projects: {
    word: "WORK",
    wordSide: "left",
    softWord: false,
    glow: { x: "50%", y: "58%", w: 1100, h: 700, a: 0.65 },
    shade:
      "radial-gradient(ellipse 60% 30% at 50% 92%, rgba(25,32,42,0.2) 0%, rgba(25,32,42,0) 70%)",
  },
  about: {
    word: "HUMAN",
    wordSide: "left",
    softWord: false,
    glow: { x: "26%", y: "33%", w: 1000, h: 760, a: 0.6 },
    shade:
      "radial-gradient(ellipse 45% 35% at 78% 70%, rgba(25,32,42,0.16) 0%, rgba(25,32,42,0) 70%)",
  },
  contact: {
    word: "SIGNAL",
    wordSide: "left",
    softWord: true,
    glow: { x: "67%", y: "47%", w: 1100, h: 900, a: 0.45 },
  },
};

/**
 * Shared background layers for a section (its ground gradient goes on the
 * <section> itself: `style={{ background: "var(--bg-<scene>)" }}`): soft glow behind the subject,
 * section shade + vignette, the background word, and the grain on top.
 * The section must be `relative overflow-hidden`; its content must come
 * after this in the DOM (and be `relative`) to sit above the word.
 */
export const SectionBackdrop = ({ scene }: { scene: SectionScene }) => {
  const b = BACKDROPS[scene];
  return (
    <>
      <div
        aria-hidden="true"
        className="subject-glow section-glow"
        style={
          {
            left: b.glow.x,
            top: b.glow.y,
            width: b.glow.w,
            height: b.glow.h,
            "--glow-a": b.glow.a,
          } as CSSProperties
        }
      />
      <div
        aria-hidden="true"
        className="section-vignette pointer-events-none absolute inset-0"
        style={b.shade ? { backgroundImage: `${b.shade}, var(--vignette)` } : undefined}
      />
      <div
        aria-hidden="true"
        data-testid={`bg-word-${scene}`}
        className={`bg-word bg-word--${b.wordSide} ${b.softWord ? "bg-word--soft" : ""}`}
      >
        {b.word}
      </div>
      <div aria-hidden="true" className="grain pointer-events-none absolute inset-0 z-20" />
    </>
  );
};
