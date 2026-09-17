import { motion } from "framer-motion";
import { Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { projects } from "../data/portfolioData";

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
    className={`group corner-frame cut-corner relative flex min-h-[320px] flex-col justify-end border border-[#222] bg-[#0A0A0A] p-7 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_0_50px_rgba(255,255,255,0.06)] sm:p-9 ${project.span}`}
  >
    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-pixel text-[9px] uppercase tracking-[0.3em] text-[#8A8A8A]">
            {project.subtitle}
          </p>
          <h3 className="mt-2 font-pixel text-lg uppercase text-white sm:text-xl">
            {project.title}
          </h3>
        </div>
        <ArrowUpRight
          size={20}
          className="shrink-0 text-[#555] transition-[color,transform] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
        />
      </div>

      <p className="mt-4 max-w-lg font-inter text-sm leading-relaxed text-[#8A8A8A]">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="border border-[#222] px-3 py-1.5 font-pixel text-[8px] uppercase tracking-wider text-[#8A8A8A] transition-colors duration-300 group-hover:border-white/20 group-hover:text-[#BDBDBD]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        {project.github && (
          <a
            data-testid={`project-github-link-${project.id}`}
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-pixel text-[9px] uppercase tracking-[0.15em] text-[#8A8A8A] transition-colors hover:text-white"
          >
            <Github size={14} /> Code
          </a>
        )}
        {project.demo && (
          <a
            data-testid={`project-demo-link-${project.id}`}
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-pixel text-[9px] uppercase tracking-[0.15em] text-[#8A8A8A] transition-colors hover:text-white"
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
      className="relative bg-black px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="font-pixel text-[10px] uppercase tracking-[0.35em] text-white"
            >
              03 // SELECTED WORK
            </motion.p>
            <motion.h2
              variants={fadeUp} custom={1} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="text-engraved mt-6 font-pixel text-3xl uppercase text-white sm:text-4xl lg:text-5xl"
            >
              Projects
            </motion.h2>
          </div>
          <motion.p
            variants={fadeUp} custom={2} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="max-w-sm font-inter text-sm leading-relaxed text-[#8A8A8A]"
          >
            Systems I've designed, trained and shipped — from agent platforms to
            realtime pipelines.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

