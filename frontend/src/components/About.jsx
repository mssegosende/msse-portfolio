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
          className="font-kodemono text-xs uppercase tracking-[0.35em] text-white"
        >
          02 // WHO
        </motion.p>

        <div className="mt-10 max-w-3xl">
          <motion.h2
            variants={fadeUp} custom={1} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
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
                <div className="font-orbitron text-2xl font-bold text-white sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 font-kodemono text-[10px] uppercase tracking-[0.2em] text-[#8A8A8A]">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Numbered manifesto chapters */}
        <div className="mt-28 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#222] bg-[#222] md:grid-cols-3">
          {manifesto.map((ch, i) => (
            <motion.article
              key={ch.num}
              data-testid={`manifesto-chapter-${ch.num}`}
              variants={fadeUp} custom={i} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group bg-black p-8 transition-colors duration-500 hover:bg-[#0A0A0A] sm:p-10"
            >
              <div className="font-orbitron text-5xl font-black text-outline-grey transition-all duration-500 group-hover:text-white group-hover:[-webkit-text-stroke:0px]">
                {ch.num}
              </div>
              <h3 className="mt-6 font-orbitron text-lg font-semibold text-white">
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
