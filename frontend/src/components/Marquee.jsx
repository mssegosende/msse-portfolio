import { marqueeItems } from "../data/portfolioData";

export const Marquee = () => {
  const row = [...marqueeItems, ...marqueeItems];
  return (
    <section
      data-testid="marquee-section"
      className="relative overflow-hidden border-y border-white/10 bg-black py-10"
    >
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-pixel text-4xl uppercase tracking-wider text-outline sm:text-6xl">
              {item}
            </span>
            <span className="font-kodemono text-2xl text-white/30">•</span>
          </span>
        ))}
      </div>
    </section>
  );
};
