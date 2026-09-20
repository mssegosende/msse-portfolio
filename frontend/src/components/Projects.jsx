import { motion } from "framer-motion";
import { Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { getProjects } from "../data/portfolioData";
import { GridField } from "./GridField";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const ProjectCard = ({ project, index }) => (
  <motion.article
    data-testid={`project-card-${project.id}`}
    variants={fadeUp} custom={index} initial="hidden" whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
    className={`group corner-frame cut-corner relative flex min-h-[320px] flex-col justify-end border border-ink/[0.13] bg-ink/[0.04] p-7 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-ink/30 hover:shadow-[0_0_50px_rgb(var(--ink) / 0.06)] sm:p-9 ${project.span}`}
  >
    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          {/* Dev-only: drafts never reach the production bundle, so this needs
              no environment check of its own. Sits above the subtitle rather
              than in the corner, where it would land under the arrow icon. */}
          {project.draft && (
            <span
              data-testid={`project-draft-badge-${project.id}`}
              className="mb-3 inline-block border border-[#E5B567]/40 px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.18em] text-[#E5B567]"
            >
              Draft
            </span>
          )}
          <p className="font-display text-[13px] uppercase tracking-[0.02em] text-ink/65">
            {project.subtitle}
          </p>
          <h3 className="mt-2 font-display text-lg uppercase text-ink sm:text-xl">
            {project.title}
          </h3>
        </div>
        <ArrowUpRight
          size={20}
          className="shrink-0 text-ink/65 transition-[color,transform] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink"
        />
      </div>

      <p className="mt-4 max-w-lg font-inter text-sm leading-relaxed text-ink/65">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="border border-ink/[0.13] px-3 py-1.5 font-display text-[13px] uppercase tracking-wider text-ink/65 transition-colors duration-300 group-hover:border-ink/20 group-hover:text-ink/[0.83]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {project.codeUrl && (
          <a
            data-testid={`project-github-link-${project.id}`}
            href={project.codeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65 transition-colors hover:text-ink"
          >
            <Github size={14} /> Code
          </a>
        )}
        {project.liveUrl && (
          <a
            data-testid={`project-demo-link-${project.id}`}
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65 transition-colors hover:text-ink"
          >
            <ExternalLink size={14} /> Live
          </a>
        )}
      </div>
    </div>
  </motion.article>
);

export const Projects = () => {
  return (
    <section
      id="projects"
      data-testid="projects-section"
      className="relative overflow-hidden bg-surface px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <GridField />
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="font-display text-[13px] uppercase tracking-[0.02em] text-ink"
            >
              03 // SELECTED WORK
            </motion.p>
            <motion.h2
              variants={fadeUp} custom={1} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="text-engraved mt-6 font-display font-light text-3xl uppercase text-ink sm:text-4xl lg:text-5xl"
            >
              Projects
            </motion.h2>
          </div>
          <motion.p
            variants={fadeUp} custom={2} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="max-w-sm font-inter text-sm leading-relaxed text-ink/65"
          >
            Products I've designed and built end to end — from the data model
            up to the interface.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {getProjects().map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

