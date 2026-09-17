import { motion } from "framer-motion";
import { Code2, Server, BrainCircuit, CloudCog } from "lucide-react";
import { capabilities } from "../data/portfolioData";

const icons = { Code2, Server, BrainCircuit, CloudCog };

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const Capabilities = () => {
  return (
    <section
      id="capabilities"
      data-testid="capabilities-section"
      className="relative bg-black px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-7xl">
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-kodemono text-xs uppercase tracking-[0.35em] text-cyber"
        >
          03 // SYSTEM SPECIFICATIONS
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-6 font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Capabilities
        </motion.h2>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
          {capabilities.map((cap, i) => {
            const Icon = icons[cap.icon];
            return (
              <motion.div
                key={cap.id}
                data-testid={`capability-card-${cap.id}`}
                variants={fadeUp} custom={i} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className="group glass rounded-2xl p-8 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 hover:border-cyber/40 hover:shadow-[0_0_50px_rgba(0,255,209,0.08)] sm:p-10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyber/25 bg-cyber/5 text-cyber transition-shadow duration-500 group-hover:shadow-[0_0_20px_rgba(0,255,209,0.25)]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-orbitron text-lg font-semibold text-white">
                      {cap.title}
                    </h3>
                    <p className="mt-1 font-inter text-xs text-neutral-500">
                      {cap.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-5">
                  {cap.skills.map((skill, j) => (
                    <div key={skill.name}>
                      <div className="flex items-center justify-between">
                        <span className="font-kodemono text-[11px] uppercase tracking-[0.15em] text-neutral-300">
                          {skill.name}
                        </span>
                        <span className="font-kodemono text-[11px] text-cyber">
                          {skill.level}%
                        </span>
                      </div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${skill.level}%` }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{
                            delay: 0.2 + j * 0.1,
                            duration: 1.1,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="h-full rounded-full bg-cyber shadow-[0_0_10px_rgba(0,255,209,0.6)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
