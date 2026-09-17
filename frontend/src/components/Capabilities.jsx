import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { capabilities } from "../data/portfolioData";
import { GridField } from "./GridField";

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
      className="relative overflow-hidden bg-black px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <GridField intensity={0.45} />
      {/* soft scrim: text sits on near-solid black, grid stays visible at the edges */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_45%,rgba(0,0,0,0.82),transparent_100%)]" />
      <div className="relative mx-auto max-w-4xl">
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-[13px] uppercase tracking-[0.02em] text-white"
        >
          04 // SYSTEM SPECIFICATIONS
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-engraved mt-6 font-display font-light text-3xl uppercase text-white sm:text-4xl lg:text-5xl"
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
                    <span className="font-display text-[13px] text-[#A6A6A6]">[ {cap.num} ]</span>
                    <span
                      className={`font-display text-base uppercase transition-colors duration-300 sm:text-lg ${
                        open ? "text-white" : "text-[#D3D3D3] group-hover:text-white"
                      }`}
                    >
                      {cap.title}
                    </span>
                  </span>
                  {open ? (
                    <Minus size={18} className="shrink-0 text-white" />
                  ) : (
                    <Plus size={18} className="shrink-0 text-[#A6A6A6] transition-colors duration-300 group-hover:text-white" />
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
                        <p className="max-w-lg font-inter text-sm leading-relaxed text-[#A6A6A6]">
                          {cap.description}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {cap.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-[#222] px-3 py-1.5 font-display text-[13px] uppercase tracking-wider text-[#D3D3D3]"
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
