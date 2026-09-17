import { motion } from "framer-motion";
import { Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { projects, robotShots } from "../data/portfolioData";

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
    className={`group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0C]/70 p-7 backdrop-blur-md transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-cyber/40 hover:shadow-[0_0_50px_rgba(0,255,209,0.08)] sm:p-9 ${project.span}`}
  >
    {project.image && (
      <>
        <img
          src={project.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-25 transition-[opacity,transform] duration-700 group-hover:scale-105 group-hover:opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </>
    )}

    <div className="relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-kodemono text-[10px] uppercase tracking-[0.3em] text-cyber">
            {project.subtitle}
          </p>
          <h3 className="mt-2 font-orbitron text-xl font-bold text-white sm:text-2xl">
            {project.title}
          </h3>
        </div>
        <ArrowUpRight
          size={20}
          className="shrink-0 text-neutral-600 transition-[color,transform] duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyber"
        />
      </div>

      <p className="mt-4 max-w-lg font-inter text-sm leading-relaxed text-neutral-400">
        {project.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/10 px-3 py-1 font-kodemono text-[10px] uppercase tracking-wider text-neutral-400 transition-colors duration-300 group-hover:border-cyber/25 group-hover:text-neutral-300"
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
            className="flex items-center gap-1.5 font-kodemono text-[11px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-cyber"
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
            className="flex items-center gap-1.5 font-kodemono text-[11px] uppercase tracking-[0.15em] text-neutral-400 transition-colors hover:text-cyber"
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
              className="font-kodemono text-xs uppercase tracking-[0.35em] text-cyber"
            >
              02 // SELECTED WORK
            </motion.p>
            <motion.h2
              variants={fadeUp} custom={1} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-6 font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Projects
            </motion.h2>
          </div>
          <motion.p
            variants={fadeUp} custom={2} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="max-w-sm font-inter text-sm leading-relaxed text-neutral-500"
          >
            Systems I've designed, trained and shipped — from agent platforms to
            realtime pipelines.
          </motion.p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}

          {/* robot arm close-up tile */}
          <motion.div
            data-testid="project-image-tile"
            variants={fadeUp} custom={projects.length} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="group relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 md:col-span-12"
          >
            <img
              src={robotShots.arm}
              alt="Actuator arm module — close-up"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-40 animate-kenburns"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-7 sm:p-9">
              <p className="font-kodemono text-[10px] uppercase tracking-[0.3em] text-cyber">
                UNIT: ARM.ACTUATOR
              </p>
              <p className="mt-3 max-w-md font-orbitron text-lg font-semibold text-white sm:text-xl">
                Precision hardware inspires precision software.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
