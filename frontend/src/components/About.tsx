import { motion } from "framer-motion";
import { fadeUpVariants, revealOnView } from "../lib/motion";
import { profile, manifesto } from "../data/portfolioData";
import { SectionBackdrop } from "./SectionBackdrop";
import { Num } from "./Num";

const fadeUp = fadeUpVariants({ stagger: 0.12, duration: 0.9 });

export const About = () => {
  return (
    <section
      id="about"
      data-testid="about-section"
      style={{ background: "var(--bg-about)" }}
      className="relative overflow-hidden px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <SectionBackdrop scene="about" />
      <div className="relative mx-auto max-w-7xl">
        <motion.p variants={fadeUp} {...revealOnView()} className="section-pill">
          WHO
        </motion.p>

        <div className="max-w-3xl">
          <motion.h2
            variants={fadeUp}
            custom={1}
            {...revealOnView()}
            className="section-title mt-4"
          >
            The human
            <br />
            behind the machine
          </motion.h2>

          {profile.bio.map((para, i) => (
            <motion.p
              key={i}
              variants={fadeUp}
              custom={2 + i}
              {...revealOnView()}
              className="mt-6 font-inter text-sm leading-relaxed text-ink/[0.83] sm:text-base"
            >
              {para}
            </motion.p>
          ))}

          <motion.div
            variants={fadeUp}
            custom={4}
            {...revealOnView()}
            className="mt-12 flex flex-wrap gap-x-16 gap-y-8 border-t border-ink/[0.13] pt-8"
          >
            {profile.stats.map((s) => (
              <div key={s.label} data-testid={`about-stat-${s.label.split(" ")[1] || s.label}`}>
                <div className="font-display text-4xl text-ink sm:text-5xl">{s.value}</div>
                <div className="mt-2 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="mt-28 grid grid-cols-1 gap-px border border-ink/[0.13] bg-ink/[0.13] md:grid-cols-3">
          {manifesto.map((ch, i) => (
            <motion.article
              key={ch.num}
              data-testid={`manifesto-chapter-${ch.num}`}
              variants={fadeUp}
              custom={i}
              {...revealOnView("-60px")}
              className="group corner-frame cut-corner bg-surface p-8 pt-5 transition-colors duration-500 hover:bg-ink/[0.04] sm:p-10 sm:pt-7"
            >
              <div className="select-none font-display text-7xl leading-none text-outline-grey transition-all duration-500 group-hover:[-webkit-text-stroke-color:rgb(var(--ink) / 0.55)]">
                <Num value={ch.num} />
              </div>
              <h3 className="mt-6 font-display text-sm uppercase tracking-wider text-ink">
                {ch.title}
              </h3>
              <p className="mt-4 font-inter text-sm leading-relaxed text-ink/65">{ch.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
