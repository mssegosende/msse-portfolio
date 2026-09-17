import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Spline from "@splinetool/react-spline";
import { FolderOpen, Send } from "lucide-react";
import { SPLINE_SCENE_URL, profile } from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

const lineReveal = {
  hidden: { y: "110%" },
  show: (i) => ({
    y: "0%",
    transition: { delay: 0.2 + i * 0.18, duration: 1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const uiFade = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.7 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

export const Hero = ({ onReady }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(false);
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  const revealed = loaded || failed;

  // Cinematic scroll pull-back: close-up head -> full robot (transform/opacity only)
  const startScale = reduceMotion ? 1 : isMobile ? 1.6 : 2.2;
  const startY = reduceMotion ? "0%" : isMobile ? "16%" : "22%";
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 22,
    mass: 0.6,
  });
  const canvasScale = useTransform(smooth, [0, 0.85], [startScale, 1]);
  const canvasY = useTransform(smooth, [0, 0.85], [startY, "0%"]);
  const headlineOpacity = useTransform(smooth, [0, 0.3], [1, 0]);
  const headlineY = useTransform(smooth, [0, 0.3], [0, -140]);

  const R = 34;
  const CIRC = 2 * Math.PI * R;

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-testid="hero-section"
      className="relative h-[250vh] w-full bg-black"
    >
      <div className="sticky top-0 h-screen min-h-[640px] w-full overflow-hidden">
        {/* 3D scene — cinematic zoom wrapper */}
        <motion.div
          data-testid="hero-canvas-zoom"
          style={{ scale: canvasScale, y: canvasY, willChange: "transform" }}
          className="absolute inset-0"
        >
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

          {/* Animated fallback — pure CSS, monochrome */}
          {failed && (
            <div className="absolute inset-0" data-testid="hero-fallback">
              <div className="absolute inset-0 bg-[#050505]" />
              <div className="absolute inset-0 bg-grid opacity-50" />
              <div className="absolute inset-0 scanline-overlay" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_60%)]" />
              <div
                data-testid="hero-fallback-badge"
                className="absolute right-6 top-24 rounded-full border border-[#222] bg-black/60 px-4 py-2 font-kodemono text-[10px] uppercase tracking-[0.3em] text-[#8A8A8A] backdrop-blur-md"
              >
                3D OFFLINE // STATIC RENDER
              </div>
            </div>
          )}
        </motion.div>

        {/* Atmosphere */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.7)_100%)]" />

        {/* Kinetic headline — overlaps the head, fades up on scroll */}
        <motion.div
          style={{
            opacity: headlineOpacity,
            y: headlineY,
            willChange: "transform, opacity",
          }}
          className="pointer-events-none absolute inset-x-0 top-[15%] z-10 text-center mix-blend-difference sm:top-[17%]"
        >
          <div className="overflow-hidden px-4">
            <motion.h1
              variants={lineReveal}
              custom={0}
              initial="hidden"
              animate={revealed ? "show" : "hidden"}
              data-testid="hero-headline-1"
              className="font-inter text-[clamp(1.6rem,5.5vw,5.25rem)] font-extralight uppercase leading-none tracking-[0.3em] text-white"
            >
              — Build the future —
            </motion.h1>
          </div>
          <div className="mt-5 overflow-hidden px-4">
            <motion.p
              variants={lineReveal}
              custom={1}
              initial="hidden"
              animate={revealed ? "show" : "hidden"}
              data-testid="hero-headline-2"
              className="font-inter text-[clamp(0.85rem,3vw,2.75rem)] font-extralight uppercase leading-none tracking-[0.42em] text-white/40"
            >
              one system at a time
            </motion.p>
          </div>
        </motion.div>

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
                    stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"
                    strokeDasharray={CIRC}
                    initial={{ strokeDashoffset: CIRC }}
                    animate={{ strokeDashoffset: CIRC - (CIRC * progress) / 100 }}
                    transition={{ ease: "easeOut", duration: 0.3 }}
                    style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-kodemono text-sm text-white">
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

        {/* Minimal UI */}
        <div className="pointer-events-none absolute inset-0 z-20">
          {/* top-left brand */}
          <motion.div
            variants={uiFade} custom={0} initial="hidden"
            animate={revealed ? "show" : "hidden"}
            className="absolute left-6 top-6 sm:left-10 sm:top-8"
          >
            <span data-testid="hero-brand" className="font-orbitron text-sm font-bold tracking-[0.3em] text-white mix-blend-difference">
              {profile.shortMark}
              <span className="text-[#8A8A8A]">AI</span>
            </span>
          </motion.div>

          {/* top-right status */}
          <motion.div
            variants={uiFade} custom={1} initial="hidden"
            animate={revealed ? "show" : "hidden"}
            className="absolute right-6 top-6 sm:right-10 sm:top-8 flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
            <span data-testid="hero-status" className="font-pixel text-[9px] uppercase tracking-[0.3em] text-neutral-300 mix-blend-difference">
              STATUS: {profile.status}
            </span>
          </motion.div>

          {/* bottom-left pill buttons */}
          <motion.div
            variants={uiFade} custom={2} initial="hidden"
            animate={revealed ? "show" : "hidden"}
            className="pointer-events-auto absolute bottom-24 left-6 flex flex-wrap gap-3 sm:bottom-28 sm:left-10"
          >
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="flex items-center gap-2 bg-white px-5 py-2.5 font-pixel text-[9px] uppercase tracking-[0.2em] text-black transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(255,255,255,0.4)]"
            >
              <FolderOpen size={13} />
              Projects
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="flex items-center gap-2 border border-white/25 bg-black/40 px-5 py-2.5 font-pixel text-[9px] uppercase tracking-[0.2em] text-white backdrop-blur-md transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <Send size={13} />
              Contact
            </button>
          </motion.div>
        </div>

        {/* bottom fade into next section */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
    </section>
  );
};
