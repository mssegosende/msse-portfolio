import { story, storyTitle } from "../../data/portfolioData";

/**
 * Chapter 2's story text, beside the close-up robot (below it on phones).
 * The timeline fades the title and each paragraph on its own, so the panel
 * hands out three kinds of refs: the panel, the title and one per paragraph.
 *
 * At the story framing (scale 2.8) the head centres near 31% of the viewport;
 * dead-centring this block left it a head below that.
 */
export const StoryPanel = ({ ref, titleRef, paragraphRefs, theme }) => (
  <div
    ref={ref}
    data-theme={theme}
    className="absolute inset-x-5 bottom-28 cut-corner bg-surface/[0.70] p-5 backdrop-blur-md sm:inset-x-auto sm:bottom-auto sm:right-[6%] sm:top-[40%] sm:w-[24rem] sm:-translate-y-1/2 sm:bg-transparent sm:p-0 sm:backdrop-blur-none lg:right-[9%]"
  >
    {/* story heading — section-title type, sized so it never pushes the
        paragraphs out of the viewport */}
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
        ref={(el) => (paragraphRefs.current[i] = el)}
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
