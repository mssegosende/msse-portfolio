import { useEffect, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { systemFeatures } from "../data/portfolioData";

const FeatureCallout = ({ feature, index, progress, reduceMotion }) => {
  const t = 0.16 + index * 0.28;
  const revealEnd = t + (reduceMotion ? 0.02 : 0.07);
  const opacity = useTransform(progress, [t, revealEnd], [0, 1]);
  const y = useTransform(progress, [t, revealEnd], [reduceMotion ? 0 : 36, 0]);
  const lineOpacity = useTransform(progress, [revealEnd, revealEnd + 0.05], [0, 1]);
  const lineLen = useTransform(progress, [revealEnd, revealEnd + 0.14], [0, 1]);

  return (
    <>
      <motion.svg
        data-testid={`feature-line-${feature.num}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ opacity: lineOpacity }}
      >
        <motion.line
          x1={feature.from.x}
          y1={feature.from.y}
          x2={feature.to.x}
          y2={feature.to.y}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: lineLen }}
        />
      </motion.svg>
      <motion.span
        style={{
          opacity: lineOpacity,
          left: `${feature.to.x}%`,
          top: `${feature.to.y}%`,
        }}
        className="pointer-events-none absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
      />
      <motion.div
        data-testid={`feature-callout-${feature.num}`}
        style={{ opacity, y, top: feature.top, willChange: "transform, opacity" }}
        className={`absolute w-72 max-w-[42vw] ${
          feature.side === "left" ? "left-[5%]" : "right-[5%]"
        }`}
      >
        <div className="rounded-xl border border-[#222] bg-black/70 p-6 backdrop-blur-md">
          <div className="flex items-baseline gap-3">
            <span className="font-orbitron text-4xl font-black text-outline-grey">
              {feature.num}
            </span>
            <span className="font-kodemono text-[10px] uppercase tracking-[0.3em] text-[#8A8A8A]">
              {feature.part}
            </span>
          </div>
          <h3 className="mt-4 font-pixel text-base uppercase tracking-wide text-white">
            {feature.title}
          </h3>
          <p className="mt-3 font-inter text-sm leading-relaxed text-[#8A8A8A]">
            {feature.text}
          </p>
        </div>
      </motion.div>
    </>
  );
};

const RailItem = ({ num, progress, index }) => {
  const t = 0.16 + index * 0.28;
  const color = useTransform(progress, [t, t + 0.05], ["#555555", "#FFFFFF"]);
  return (
    <motion.span style={{ color }} className="font-kodemono text-xs tracking-[0.3em]">
      {num}
    </motion.span>
  );
};

const SectionHeader = ({ compact }) => (
  <div className={compact ? "text-center" : "pointer-events-none absolute inset-x-0 top-8 z-10 text-center sm:top-12"}>
    <p className="font-kodemono text-[10px] uppercase tracking-[0.4em] text-[#8A8A8A]">
      01 // system features
    </p>
    <h2
      data-testid="features-headline"
      className={`mt-4 font-pixel uppercase text-white ${
        compact ? "text-2xl" : "text-3xl mix-blend-difference sm:text-5xl"
      }`}
    >
      System Features
    </h2>
    <p className="mt-3 font-kodemono text-[10px] uppercase tracking-[0.35em] text-[#8A8A8A]">
      based on the msg·01 core
    </p>
  </div>
);

export const SystemFeatures = () => {
  const sectionRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });

  if (isMobile) {
    return (
      <section id="features" data-testid="features-section" className="bg-black px-4 py-20">
        <SectionHeader compact />
        <div className="mt-8 flex justify-center" data-testid="features-robot-mobile">
          <img
            src="/robot-full.png"
            alt="MSG·01 humanoid unit — full render"
            loading="lazy"
            className="h-[46vh] rounded-xl border border-[#222] object-contain brightness-[0.32] contrast-105"
          />
        </div>
        <div className="mt-10 space-y-5">
          {systemFeatures.map((f) => (
            <motion.div
              key={f.num}
              data-testid={`feature-callout-${f.num}`}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-xl border border-[#222] bg-[#0A0A0A] p-6"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-orbitron text-3xl font-black text-outline-grey">{f.num}</span>
                <span className="font-kodemono text-[10px] uppercase tracking-[0.3em] text-[#8A8A8A]">
                  {f.part}
                </span>
              </div>
              <h3 className="mt-3 font-pixel text-base uppercase text-white">{f.title}</h3>
              <p className="mt-2 font-inter text-sm leading-relaxed text-[#8A8A8A]">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="features"
      ref={sectionRef}
      data-testid="features-section"
      className="relative h-[320vh] bg-black"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* static render of the Spline robot — captured from the live scene */}
        <div className="absolute inset-0 flex items-center justify-center" data-testid="features-robot">
          <img
            src="/robot-full.png"
            alt="MSG·01 humanoid unit — full render"
            className="h-[85vh] rounded-2xl border border-[#222] object-contain brightness-[0.32] contrast-105 shadow-[0_0_80px_rgba(255,255,255,0.05)]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.65)_100%)]" />
        <SectionHeader />
        {systemFeatures.map((f, i) => (
          <FeatureCallout
            key={f.num}
            feature={f}
            index={i}
            progress={smooth}
            reduceMotion={reduceMotion}
          />
        ))}
        <div
          data-testid="features-rail"
          className="absolute right-6 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-10"
        >
          {systemFeatures.map((f, i) => (
            <div key={f.num} className="flex flex-col items-center gap-3">
              <RailItem num={f.num} progress={smooth} index={i} />
              {i < systemFeatures.length - 1 && <span className="h-6 w-px bg-[#333]" />}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </div>
    </section>
  );
};
