import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Spline from "@splinetool/react-spline";
import { ArrowDown, FolderOpen, Send } from "lucide-react";
import { SPLINE_SCENE_URL, profile, robotShots } from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

const lineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { delay: 0.15 + i * 0.12, duration: 0.9, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const Hero = ({ onReady }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 22 });
  const sy = useSpring(my, { stiffness: 50, damping: 22 });
  const parX = useTransform(sx, [-0.5, 0.5], [-16, 16]);
  const parY = useTransform(sy, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    if (loaded || failed) return;
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 6 + 2, 90));
    }, 160);
    return () => clearInterval(t);
  }, [loaded, failed]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        setFailed(true);
        onReady?.();
      }
    }, 22000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoad = () => {
    if (readyRef.current) return;
    readyRef.current = true;
    setProgress(100);
    setTimeout(() => {
      setLoaded(true);
      onReady?.();
    }, 700);
  };

  const handleMouse = (e) => {
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  const revealed = loaded || failed;
  const R = 34;
  const CIRC = 2 * Math.PI * R;

  return (
    <section
      id="hero"
      data-testid="hero-section"
      onMouseMove={handleMouse}
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black"
    >
      {/* 3D Scene */}
      {!failed && (
        <div className="absolute inset-0" data-testid="spline-canvas-wrap">
          <Spline
            scene={SPLINE_SCENE_URL}
            onLoad={handleLoad}
            onError={() => {
              setFailed(true);
              onReady?.();
            }}
          />
        </div>
      )}

      {/* Animated fallback */}
      {failed && (
        <div className="absolute inset-0" data-testid="hero-fallback">
          <img
            src={robotShots.head}
            alt="Cybernetic unit — static render"
            className="h-full w-full object-cover opacity-45 animate-kenburns"
          />
          <div className="absolute inset-0 scanline-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />
          <div
            data-testid="hero-fallback-badge"
            className="absolute right-6 top-24 rounded-full border border-cyber/30 bg-black/60 px-4 py-2 font-kodemono text-[10px] uppercase tracking-[0.3em] text-cyber backdrop-blur-md"
          >
            3D OFFLINE // STATIC RENDER
          </div>
        </div>
      )}

      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.75)_100%)]" />

      {/* Loader */}
      <AnimatePresence>
        {!revealed && (
          <motion.div
            data-testid="hero-loader"
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black"
          >
            <div className="relative h-28 w-28">
              <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
                <circle
                  cx="42" cy="42" r={R} fill="none"
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
                />
                <motion.circle
                  cx="42" cy="42" r={R} fill="none"
                  stroke="#00FFD1" strokeWidth="1.5" strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: CIRC - (CIRC * progress) / 100 }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(0,255,209,0.7))" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-kodemono text-sm text-cyber">
                {Math.round(progress)}%
              </div>
            </div>
            <p className="mt-8 font-kodemono text-[11px] uppercase tracking-[0.4em] text-neutral-500">
              Initializing systems
            </p>
            <p className="mt-2 font-kodemono text-[10px] uppercase tracking-[0.3em] text-neutral-700">
              loading 3D core…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Revealed UI — minimal, name lives inside the 3D scene */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {/* top-left brand */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-6 top-6 sm:left-10 sm:top-8"
        >
          <span data-testid="hero-brand" className="font-orbitron text-sm font-bold tracking-[0.3em] text-white">
            {profile.shortMark}
            <span className="text-cyber">AI</span>
          </span>
        </motion.div>

        {/* status overline */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={revealed ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.8 }}
          className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyber animate-pulse-dot" />
          <span data-testid="hero-status" className="font-kodemono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            STATUS: {profile.status}
          </span>
        </motion.div>

        {/* bottom-left tagline block with parallax */}
        <motion.div
          style={{ x: parX, y: parY }}
          className="absolute bottom-28 left-6 max-w-xl sm:bottom-32 sm:left-10"
        >
          <div className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 bg-gradient-to-r from-black/85 via-black/45 to-transparent blur-2xl" />
          <div className="overflow-hidden">
            <motion.p
              variants={lineReveal} custom={0} initial="hidden"
              animate={revealed ? "show" : "hidden"}
              data-testid="hero-tagline-role"
              className="font-orbitron text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-4xl"
            >
              {profile.taglineLines[0]}
              <span className="text-cyber"> {profile.taglineLines[1]}</span>
            </motion.p>
          </div>
          <div className="mt-4 overflow-hidden">
            <motion.p
              variants={lineReveal} custom={1} initial="hidden"
              animate={revealed ? "show" : "hidden"}
              data-testid="hero-tagline"
              className="font-inter text-sm leading-relaxed text-neutral-400 sm:text-base"
            >
              {profile.tagline}
            </motion.p>
          </div>
          <div className="mt-3 overflow-hidden">
            <motion.p
              variants={lineReveal} custom={2} initial="hidden"
              animate={revealed ? "show" : "hidden"}
              className="font-kodemono text-[10px] uppercase tracking-[0.35em] text-cyber/80"
            >
              SYS.LOC: {profile.location}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={revealed ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="group flex items-center gap-2 rounded-full bg-cyber px-6 py-3 font-kodemono text-xs font-semibold uppercase tracking-[0.2em] text-black transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,255,209,0.45)]"
            >
              <FolderOpen size={14} />
              View Projects
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 font-kodemono text-xs uppercase tracking-[0.2em] text-white transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-cyber/60 hover:bg-cyber/5"
            >
              <Send size={14} />
              Initiate Contact
            </button>
          </motion.div>
        </motion.div>

        {/* scroll cue */}
        <motion.button
          data-testid="hero-scroll-cue"
          onClick={() => scrollToId("about")}
          initial={{ opacity: 0 }}
          animate={revealed ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 1 }}
          className="pointer-events-auto absolute bottom-28 right-6 hidden flex-col items-center gap-3 sm:right-10 md:flex"
          aria-label="Scroll to about"
        >
          <span className="font-kodemono text-[9px] uppercase tracking-[0.4em] text-neutral-500 [writing-mode:vertical-rl]">
            scroll
          </span>
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ArrowDown size={14} className="text-cyber" />
          </motion.span>
        </motion.button>
      </div>

      {/* bottom fade into next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
};
