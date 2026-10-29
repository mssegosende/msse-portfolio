import type { Ref, RefObject } from "react";
import { story, storyTitle } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";

interface StoryPanelProps {
  ref?: Ref<HTMLDivElement>;
  titleRef: Ref<HTMLDivElement>;
  paragraphRefs: RefObject<(HTMLParagraphElement | null)[]>;
  theme: Theme;
}

/** Chapter 2 story text; the timeline fades the title and each paragraph separately. */
export const StoryPanel = ({ ref, titleRef, paragraphRefs, theme }: StoryPanelProps) => (
  <div
    ref={ref}
    data-theme={theme}
    className="absolute inset-x-5 bottom-28 cut-corner bg-surface/[0.70] p-5 backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:right-[6%] sm:top-[40%] sm:w-[24rem] sm:-translate-y-1/2 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:right-[9%]"
  >
    {/* Sized so the paragraphs never get pushed out of the viewport. */}
    <div ref={titleRef} className="mb-6" data-testid="story-title">
      <h2 className="font-display text-xl font-light uppercase leading-tight tracking-[0.02em] text-ink sm:text-[1.75rem]">
        {storyTitle.name}
      </h2>
      <p className="mt-1.5 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65">
        {storyTitle.role}
      </p>
    </div>
    {story.map((para, i) => (
      <p
        key={i}
        ref={(el) => {
          paragraphRefs.current[i] = el;
        }}
        data-testid={`story-paragraph-${i + 1}`}
        className={`font-inter text-sm leading-relaxed text-ink/[0.83] sm:text-base ${
          i > 0 ? "mt-6" : ""
        }`}
      >
        {para}
      </p>
    ))}
  </div>
);
