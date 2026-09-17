import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { capabilities } from "../data/portfolioData";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const Capabilities = () => {
  const [openId, setOpenId] = useState("frontend");

  return (
    <section
      id="capabilities"
      data-testid="capabilities-section"
      className="relative bg-black px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-4xl">
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-kodemono text-xs uppercase tracking-[0.35em] text-white"
        >
          04 // SYSTEM SPECIFICATIONS
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-6 font-orbitron text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          Capabilities
        </motion.h2>

        <div className="mt-14 border-y border-[#222]">
          {capabilities.map((cap, i) => {
            const open = openId === cap.id;
            return (
              <motion.div
                key={cap.id}
                data-testid={`capability-accordion-${cap.id}`}
                variants={fadeUp} custom={i} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                className={i > 0 ? "border-t border-[#222]" : ""}
              >
                <button
                  data-testid={`capability-trigger-${cap.id}`}
                  onClick={() => setOpenId(open ? null : cap.id)}
                  aria-expanded={open}
                  className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                >
                  <span className="flex items-baseline gap-4 sm:gap-6">
                    <span className="font-kodemono text-xs text-[#8A8A8A]">[ {cap.num} ]</span>
                    <span
                      className={`font-orbitron text-xl font-semibold transition-colors duration-300 sm:text-2xl ${
                        open ? "text-white" : "text-[#BDBDBD] group-hover:text-white"
                      }`}
                    >
                      {cap.title}
                    </span>
                  </span>
                  {open ? (
                    <Minus size={18} className="shrink-0 text-white" />
                  ) : (
                    <Plus size={18} className="shrink-0 text-[#8A8A8A] transition-colors duration-300 group-hover:text-white" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 sm:pl-[4.5rem]">
                        <p className="max-w-lg font-inter text-sm leading-relaxed text-[#8A8A8A]">
                          {cap.description}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {cap.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-[#222] px-3 py-1.5 font-kodemono text-[10px] uppercase tracking-wider text-[#BDBDBD]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
