import { motion } from "framer-motion";
import { profile, manifesto } from "../data/portfolioData";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const About = () => {
  return (
    <section
      id="about"
      data-testid="about-section"
      className="relative bg-black px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-[13px] uppercase tracking-[0.02em] text-white"
        >
          02 // WHO
        </motion.p>

        <div className="mt-10 max-w-3xl">
          <motion.h2
            variants={fadeUp} custom={1} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="text-engraved font-display font-light text-3xl uppercase text-white sm:text-4xl lg:text-5xl"
          >
            Human behind
            <br />
            the <span className="text-[#8A8A8A]">machine</span>
          </motion.h2>

          {profile.bio.map((para, i) => (
            <motion.p
              key={i}
              variants={fadeUp} custom={2 + i} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-6 font-inter text-sm leading-relaxed text-[#BDBDBD] sm:text-base"
            >
              {para}
            </motion.p>
          ))}

          <motion.div
            variants={fadeUp} custom={4} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid grid-cols-3 gap-6 border-t border-[#222] pt-8"
          >
            {profile.stats.map((s) => (
              <div key={s.label} data-testid={`about-stat-${s.label.split(" ")[1] || s.label}`}>
                <div className="font-display text-2xl text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-2 font-display text-[13px] uppercase tracking-[0.02em] text-[#8A8A8A]">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Numbered manifesto chapters */}
        <div className="mt-28 grid grid-cols-1 gap-px border border-[#222] bg-[#222] md:grid-cols-3">
          {manifesto.map((ch, i) => (
            <motion.article
              key={ch.num}
              data-testid={`manifesto-chapter-${ch.num}`}
              variants={fadeUp} custom={i} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group corner-frame cut-corner bg-black p-8 pt-5 transition-colors duration-500 hover:bg-[#0A0A0A] sm:p-10 sm:pt-7"
            >
              <div className="select-none font-display text-7xl leading-none text-outline-grey transition-all duration-500 group-hover:[-webkit-text-stroke-color:rgba(255,255,255,0.55)]">
                {ch.num}
              </div>
              <h3 className="-mt-5 font-display text-sm uppercase tracking-wider text-white">
                {ch.title}
              </h3>
              <p className="mt-4 font-inter text-sm leading-relaxed text-[#8A8A8A]">
                {ch.text}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
