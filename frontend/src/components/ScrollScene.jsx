import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Spline from "@splinetool/react-spline";
import { FolderOpen, Send } from "lucide-react";
import { SPLINE_SCENE_URL, profile, systemFeatures } from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

gsap.registerPlugin(ScrollTrigger);

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

export const ScrollScene = ({ onReady }) => {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const readyRef = useRef(false);

  const sectionRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const splineLayerRef = useRef(null);
  const maskRef = useRef(null);
  const pngLayerRef = useRef(null);
  const headlineRef = useRef(null);
  const pillsRef = useRef(null);
  const featuresHeaderRef = useRef(null);
  const calloutRefs = useRef([]);
  const lineRefs = useRef([]);
  const dotRefs = useRef([]);
  const railRefs = useRef([]);

  const [isMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

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

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startScale = reduce ? 1 : isMobile ? 1.6 : 2.2;
    const startY = reduce ? "0%" : isMobile ? "16%" : "22%";

    const ctx = gsap.context(() => {
      gsap.set(canvasWrapRef.current, {
        scale: startScale,
        y: startY,
        transformOrigin: "50% 50%",
      });
      gsap.set(pngLayerRef.current, { opacity: 0 });
      gsap.set(featuresHeaderRef.current, { opacity: 0, y: 24 });
      calloutRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 36 }));
      lineRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));
      dotRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));

      const maskProxy = { r: 220 };
      const applyMask = () => {
        const v = `radial-gradient(ellipse ${maskProxy.r}% ${Math.round(
          maskProxy.r * 0.82
        )}% at 50% 45%, transparent 55%, black 100%)`;
        maskRef.current.style.webkitMaskImage = v;
        maskRef.current.style.maskImage = v;
      };
      applyMask();

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=380%",
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      // Phase 1 -> 2: headline leaves, camera pulls back, darkness closes in fully
      tl.to(headlineRef.current, { opacity: 0, y: -140, duration: 0.1 }, 0.06);
      tl.to(canvasWrapRef.current, { scale: 1, y: "0%", duration: 0.32, ease: "power1.inOut" }, 0.12);
      tl.to(maskProxy, { r: 12, duration: 0.36, onUpdate: applyMask }, 0.14);
      tl.to(pillsRef.current, { opacity: 0, y: 24, duration: 0.08 }, 0.44);

      // Phase 3: crossfade in darkness -> transparent render revealed
      tl.to(splineLayerRef.current, { opacity: 0, duration: 0.12 }, 0.56);
      tl.to(pngLayerRef.current, { opacity: 1, duration: 0.12 }, 0.56);
      tl.to(featuresHeaderRef.current, { opacity: 1, y: 0, duration: 0.06 }, 0.6);

      // Callouts one by one
      const times = [0.72, 0.82, 0.9];
      systemFeatures.forEach((f, i) => {
        if (calloutRefs.current[i])
          tl.to(calloutRefs.current[i], { opacity: 1, y: 0, duration: 0.07, ease: "power1.out" }, times[i]);
        if (lineRefs.current[i])
          tl.to(lineRefs.current[i], { opacity: 1, duration: 0.05 }, times[i] + 0.04);
        if (dotRefs.current[i])
          tl.to(dotRefs.current[i], { opacity: 1, duration: 0.03 }, times[i] + 0.05);
        if (railRefs.current[i])
          tl.to(railRefs.current[i], { color: "#FFFFFF", duration: 0.03 }, times[i]);
        if (isMobile && i < systemFeatures.length - 1)
          tl.to(calloutRefs.current[i], { opacity: 0, y: -24, duration: 0.05 }, times[i + 1] - 0.04);
      });
    }, sectionRef);

    const lenis = window.__lenis;
    const onScroll = () => ScrollTrigger.update();
    if (lenis) lenis.on("scroll", onScroll);
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 900);

    return () => {
      clearTimeout(refresh);
      if (lenis) lenis.off("scroll", onScroll);
      ctx.revert();
    };
  }, [isMobile]);

  const R = 34;
  const CIRC = 2 * Math.PI * R;

  return (
    <section
      id="hero"
      ref={sectionRef}
      data-testid="scene-section"
      className="relative h-screen min-h-[640px] w-full overflow-hidden bg-black"
    >
      {/* Layer A — live 3D scene */}
      <div ref={splineLayerRef} className="absolute inset-0">
        <div
          ref={canvasWrapRef}
          data-testid="hero-canvas-zoom"
          className="absolute inset-0 will-change-transform"
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
          {failed && (
            <div className="absolute inset-0" data-testid="hero-fallback">
              <div className="absolute inset-0 bg-[#050505]" />
              <div className="absolute inset-0 bg-grid opacity-50" />
              <div className="absolute inset-0 scanline-overlay" />
              <div
                data-testid="hero-fallback-badge"
                className="absolute right-6 top-24 border border-[#222] bg-black/60 px-4 py-2 font-display text-[13px] uppercase tracking-[0.02em] text-[#8A8A8A] backdrop-blur-md"
              >
                3D OFFLINE // STATIC RENDER
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Layer B — darkness closing over the live scene (soft radial mask) */}
      <div
        ref={maskRef}
        data-testid="scene-mask"
        className="pointer-events-none absolute inset-0 bg-black"
      />

      {/* Layer C — transparent render floating on black, back-lit glow */}
      <div
        ref={pngLayerRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="absolute h-[90vh] w-[90vh] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.07),transparent_62%)]" />
        <img
          src="/robot-alpha.png"
          alt="MSG·01 humanoid unit — full render"
          data-testid="features-robot"
          className="relative h-[80vh] object-contain md:h-[105vh]"
        />
      </div>

      {/* gentle edge vignette above everything visual */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

      {/* Layer D — UI */}
      <div className="absolute inset-0 z-10">
        {/* kinetic headline (phase 1) */}
        <div
          ref={headlineRef}
          className="pointer-events-none absolute inset-x-0 top-[15%] text-center mix-blend-difference sm:top-[17%]"
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
        </div>

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
          <span data-testid="hero-status" className="font-display text-[13px] uppercase tracking-[0.02em] text-[#BDBDBD] mix-blend-difference">
            STATUS: {profile.status}
          </span>
        </motion.div>

        {/* bottom-left pill buttons */}
        <motion.div
          variants={uiFade} custom={2} initial="hidden"
          animate={revealed ? "show" : "hidden"}
          className="absolute bottom-24 left-6 sm:bottom-28 sm:left-10"
        >
          <div ref={pillsRef} className="pointer-events-auto flex flex-wrap gap-3">
            <button
              data-testid="hero-cta-projects"
              onClick={() => scrollToId("projects")}
              className="flex items-center gap-2 bg-white px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-black transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(255,255,255,0.4)]"
            >
              <FolderOpen size={13} />
              Projects
            </button>
            <button
              data-testid="hero-cta-contact"
              onClick={() => scrollToId("contact")}
              className="flex items-center gap-2 border border-white/25 bg-black/40 px-5 py-2.5 font-display text-[13px] uppercase tracking-[0.02em] text-white backdrop-blur-md transition-[border-color,background-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/10"
            >
              <Send size={13} />
              Contact
            </button>
          </div>
        </motion.div>

        {/* features header (phase 3) */}
        <div
          ref={featuresHeaderRef}
          className="pointer-events-none absolute inset-x-0 top-8 text-center sm:top-12"
        >
          <p className="font-display text-[13px] uppercase tracking-[0.02em] text-[#BDBDBD]">
            01 // system features
          </p>
          <h2
            data-testid="features-headline"
            className="text-engraved mt-4 font-display text-3xl font-light uppercase text-white sm:text-5xl"
          >
            System Features
          </h2>
          <p className="mt-3 font-display text-[13px] uppercase tracking-[0.02em] text-[#8A8A8A]">
            based on the msg·01 core
          </p>
        </div>

        {/* connector lines + dots (desktop) */}
        {!isMobile &&
          systemFeatures.map((f, i) => (
            <svg
              key={`line-${f.num}`}
              data-testid={`feature-line-${f.num}`}
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                ref={(el) => (lineRefs.current[i] = el)}
                x1={f.from.x}
                y1={f.from.y}
                x2={f.to.x}
                y2={f.to.y}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ))}
        {!isMobile &&
          systemFeatures.map((f, i) => (
            <span
              key={`dot-${f.num}`}
              ref={(el) => (dotRefs.current[i] = el)}
              style={{ left: `${f.to.x}%`, top: `${f.to.y}%` }}
              className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            />
          ))}

        {/* callout cards */}
        {systemFeatures.map((f, i) => (
          <div
            key={f.num}
            ref={(el) => (calloutRefs.current[i] = el)}
            data-testid={`feature-callout-${f.num}`}
            style={isMobile ? { bottom: "6rem" } : { top: f.top }}
            className={`absolute ${
              isMobile
                ? "left-4 right-4 w-auto"
                : `w-72 max-w-[42vw] ${f.side === "left" ? "left-[5%]" : "right-[5%]"}`
            }`}
          >
            <div className="corner-frame cut-corner relative border border-[#222] bg-black/70 p-6 pt-3 backdrop-blur-md">
              <div className="select-none font-display text-7xl font-light leading-none text-outline-grey">
                {f.num}
              </div>
              <div className="-mt-4 flex items-baseline gap-3">
                <span className="font-display text-[13px] uppercase tracking-[0.02em] text-[#BDBDBD]">
                  {f.part}
                </span>
              </div>
              <h3 className="mt-2 font-display text-xl font-light uppercase text-white">
                {f.title}
              </h3>
              <p className="mt-3 font-inter text-sm leading-relaxed text-[#BDBDBD]">
                {f.text}
              </p>
            </div>
          </div>
        ))}

        {/* progress rail (desktop) */}
        {!isMobile && (
          <div
            data-testid="features-rail"
            className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-10"
          >
            {systemFeatures.map((f, i) => (
              <div key={f.num} className="flex flex-col items-center gap-3">
                <span
                  ref={(el) => (railRefs.current[i] = el)}
                  className="font-display text-[13px] tracking-[0.02em] text-[#8A8A8A]"
                >
                  {f.num}
                </span>
                {i < systemFeatures.length - 1 && <span className="h-6 w-px bg-[#333]" />}
              </div>
            ))}
          </div>
        )}
      </div>

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
            <p className="mt-8 font-display text-[13px] uppercase tracking-[0.02em] text-[#8A8A8A]">
              Initializing systems
            </p>
            <p className="mt-2 font-display text-[13px] uppercase tracking-[0.02em] text-[#555]">
              loading 3D core…
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
