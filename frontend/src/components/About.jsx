import { motion } from "framer-motion";
import { profile, manifesto, robotShots } from "../data/portfolioData";

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
          className="font-kodemono text-xs uppercase tracking-[0.35em] text-cyber"
        >
          01 // WHO
        </motion.p>

        <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-7">
            <motion.h2
              variants={fadeUp} custom={1} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Human behind
              <br />
              the <span className="text-cyber">machine</span>
            </motion.h2>

            {profile.bio.map((para, i) => (
              <motion.p
                key={i}
                variants={fadeUp} custom={2 + i} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="mt-6 max-w-xl font-inter text-sm leading-relaxed text-neutral-400 sm:text-base"
              >
                {para}
              </motion.p>
            ))}

            <motion.div
              variants={fadeUp} custom={4} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-8"
            >
              {profile.stats.map((s) => (
                <div key={s.label} data-testid={`about-stat-${s.label.split(" ")[1] || s.label}`}>
                  <div className="font-orbitron text-2xl font-bold text-cyber sm:text-3xl">
                    {s.value}
                  </div>
                  <div className="mt-1 font-kodemono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp} custom={2} initial="hidden" whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="lg:col-span-5"
          >
            <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
              <img
                src={robotShots.head}
                alt="Unit head module — close-up"
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[4000ms] ease-out group-hover:scale-110 animate-kenburns"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
              <div className="absolute left-5 top-5 font-kodemono text-[10px] uppercase tracking-[0.3em] text-cyber/90">
                UNIT: HEAD.MODULE
              </div>
              <div className="absolute bottom-5 left-5 font-kodemono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                OPTICAL.ZOOM // SLOW SCAN
              </div>
              <div className="absolute inset-0 border border-cyber/0 transition-colors duration-500 group-hover:border-cyber/30 rounded-2xl" />
            </div>
          </motion.div>
        </div>

        {/* Numbered manifesto chapters */}
        <div className="mt-28 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
          {manifesto.map((ch, i) => (
            <motion.article
              key={ch.num}
              data-testid={`manifesto-chapter-${ch.num}`}
              variants={fadeUp} custom={i} initial="hidden" whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="group bg-black p-8 transition-colors duration-500 hover:bg-[#050807] sm:p-10"
            >
              <div className="font-orbitron text-5xl font-black text-outline-cyan transition-all duration-500 group-hover:text-cyber group-hover:[-webkit-text-stroke:0px]">
                {ch.num}
              </div>
              <h3 className="mt-6 font-orbitron text-lg font-semibold text-white">
                {ch.title}
              </h3>
              <p className="mt-4 font-inter text-sm leading-relaxed text-neutral-400">
                {ch.text}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
