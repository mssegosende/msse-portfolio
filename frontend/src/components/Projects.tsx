import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ProjectsDesktop } from "./projects/ProjectsDesktop";
import { ProjectsCarousel } from "./projects/ProjectsCarousel";

/**
 * Scene 3 · PROJECTS (design/HANDOFF.md P3). Desktop: pinned featured reel,
 * then the folder row. Below lg: the swipe carousel. Only one is mounted, so
 * only one set of clips loads.
 */
export const Projects = () => {
  const desktop = useMediaQuery("(min-width: 1024px)");
  return desktop ? <ProjectsDesktop /> : <ProjectsCarousel />;
};
