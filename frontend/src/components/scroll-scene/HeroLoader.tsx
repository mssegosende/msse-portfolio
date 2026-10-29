import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "../../lib/motion";

/** "SYSTEM BOOT": dark, a thin line filling slowly; fades out on reveal. */
export const HeroLoader = ({ visible, progress }: { visible: boolean; progress: number }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        data-testid="hero-loader"
        exit={{ opacity: 0, transition: { duration: 0.9 } }}
        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface"
      >
        <p className="font-display text-[13px] font-light uppercase tracking-[0.02em] text-ink/65">
          System boot
        </p>
        <div className="mt-6 h-px w-56 bg-ink/[0.13]">
          <motion.div
            className="h-px bg-ink/[0.83]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: EASE_OUT, duration: 0.3 }}
          />
        </div>
        <p className="mt-4 font-display text-[13px] tracking-[0.02em] text-ink/65">
          {Math.round(progress)}%
        </p>
      </motion.div>
    )}
  </AnimatePresence>
);
