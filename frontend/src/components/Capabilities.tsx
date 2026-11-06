import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT, fadeUpVariants, revealOnView } from "../lib/motion";
import { Plus, Minus } from "lucide-react";
import { capabilities } from "../data/portfolioData";
import { SectionBackdrop } from "./SectionBackdrop";
import { Num } from "./Num";

const fadeUp = fadeUpVariants();

export const Capabilities = () => {
  const [openId, setOpenId] = useState<string | null>("frontend");

  return (
    <section
      id="capabilities"
      data-testid="capabilities-section"
      style={{ background: "var(--bg-capabilities)" }}
      className="relative overflow-hidden px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <SectionBackdrop scene="capabilities" />
      <div className="relative mx-auto max-w-4xl">
        <motion.p variants={fadeUp} {...revealOnView()} className="section-pill">
          CAPABILITIES
        </motion.p>
        <motion.h2
          variants={fadeUp}
          custom={1}
          {...revealOnView()}
          className="section-title section-title--light mt-4"
        >
          What the core runs on
        </motion.h2>

        <div className="mt-14 border-y border-ink/[0.13]">
          {capabilities.map((cap, i) => {
            const open = openId === cap.id;
            return (
              <motion.div
                key={cap.id}
                data-testid={`capability-accordion-${cap.id}`}
                variants={fadeUp}
                custom={i}
                {...revealOnView("-60px")}
                className={i > 0 ? "border-t border-ink/[0.13]" : ""}
              >
                <button
                  data-testid={`capability-trigger-${cap.id}`}
                  onClick={() => setOpenId(open ? null : cap.id)}
                  aria-expanded={open}
                  className="group flex w-full items-center justify-between gap-6 py-7 text-left"
                >
                  <span className="flex items-baseline gap-4 sm:gap-6">
                    <Num value={cap.num} className="font-display text-[13px] text-ink/65" />
                    <span
                      className={`font-display text-base uppercase transition-colors duration-300 sm:text-lg ${
                        open ? "text-ink" : "text-ink/[0.83] group-hover:text-ink"
                      }`}
                    >
                      {cap.title}
                    </span>
                  </span>
                  {open ? (
                    <Minus size={18} className="shrink-0 text-ink" />
                  ) : (
                    <Plus
                      size={18}
                      className="shrink-0 text-ink/65 transition-colors duration-300 group-hover:text-ink"
                    />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 sm:pl-[4.5rem]">
                        <p className="max-w-lg font-inter text-sm leading-relaxed text-ink/65">
                          {cap.description}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {cap.tags.map((tag) => (
                            <span
                              key={tag}
                              className="border border-ink/[0.13] px-3 py-1.5 font-display text-[13px] uppercase tracking-wider text-ink/[0.83]"
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
