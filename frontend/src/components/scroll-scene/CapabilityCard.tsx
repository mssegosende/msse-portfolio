import type { CapabilityCard as Card } from "../../data/portfolioData";
import type { Theme } from "../../lib/themeReload";
import { Num } from "../Num";
import { ScrollText } from "../projects/ProjectCard";

// The black framed card, layer by layer (design/CARD-SPEC.md).
const FRAME =
  "polygon(30px 0, calc(100% - 16px) 0, 100% 16px, 100% 150px, calc(100% - 8px) 158px, calc(100% - 8px) calc(100% - 24px), calc(100% - 30px) 100%, 16px 100%, 0 calc(100% - 16px), 0 calc(100% - 160px), 8px calc(100% - 168px), 8px 22px)";
const GAP =
  "polygon(26px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 26px), calc(100% - 26px) 100%, 12px 100%, 0 calc(100% - 12px), 0 26px)";
const PANEL =
  "polygon(24px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 24px), calc(100% - 24px) 100%, 10px 100%, 0 calc(100% - 10px), 0 24px)";
const TAB = "polygon(0 100%, 20px 0, calc(100% - 20px) 0, 100% 100%)";
const BEZEL =
  "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 10%), linear-gradient(160deg, #3A4148 0%, #252A30 45%, #1B1F24 100%)";

const THEMES = {
  light: {
    gap: "#050608",
    panel: "radial-gradient(ellipse 120% 70% at 20% 0%, #262B31 0%, #12151A 55%, #0B0D10 100%)",
    tag: "text-white border-white/[0.72]",
    small: "text-[#AEB6BF]",
    title: "text-white",
    body: "text-[#C9D0D7]",
    chip: "text-[#E9EDF1] border-white/[0.32]",
  },
  dark: {
    gap: "#2A3037",
    panel:
      "repeating-linear-gradient(90deg, rgba(255,255,255,0) 0 3px, rgba(255,255,255,0.22) 3px 4px), radial-gradient(ellipse 120% 80% at 18% 0%, #FBFCFD 0%, #E6EAED 42%, #C9D0D6 100%)",
    tag: "text-[#0B0D10] border-[rgba(11,13,16,0.7)]",
    small: "text-[#4A525C]",
    title: "text-[#0B0D10]",
    body: "text-[#14181D]",
    chip: "text-[#14181D] border-[rgba(11,13,16,0.35)]",
  },
};

/**
 * One scene 2 card. Desktop: the reference size, 324 x 463 (the parent scales
 * the whole card). Phones: full width, its height from the content.
 */
export const CapabilityCard = ({
  card,
  theme,
  isMobile,
}: {
  card: Card;
  theme: Theme;
  isMobile: boolean;
}) => {
  const t = THEMES[theme];
  return (
    <article
      data-testid={`capability-card-${card.num}`}
      className={`relative flow-root drop-shadow-[0_34px_40px_rgba(18,24,34,0.38)] ${
        isMobile ? "w-full" : "h-[463px] w-[324px]"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#5B646E]"
        style={{ clipPath: FRAME }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-px"
        style={{ background: BEZEL, clipPath: FRAME }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-5 inset-y-3"
        style={{ background: t.gap, clipPath: GAP }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[22px] inset-y-3.5"
        style={{ background: t.panel, clipPath: PANEL }}
      />

      <div
        className={`relative z-[2] mx-[22px] my-3.5 flex flex-col px-[18px] pb-[58px] pt-6 ${
          isMobile ? "" : "h-[calc(100%-28px)]"
        }`}
      >
        <div
          className={`self-start rounded-[7px] border-[1.5px] px-[11px] py-1.5 font-mono text-[10px] tracking-[0.14em] ${t.tag}`}
        >
          SYS.0{card.num}
        </div>
        <div aria-hidden="true" className={isMobile ? "h-5" : "flex-1"} />
        <div className="flex items-end justify-between gap-2.5">
          <h3
            className={`m-0 min-w-0 font-display text-[22px] font-semibold leading-[1.05] tracking-[0.08em] ${t.title}`}
          >
            <span className={`block text-[12px] tracking-[0.22em] ${t.small}`}>{card.small}</span>
            {card.title}
          </h3>
          <Num
            value={card.num}
            className={`flex-none font-michroma text-[38px] leading-[0.9] ${t.title}`}
          />
        </div>
        {/* Long copy scrolls inside the card, with the project cards' fade
            (design/content-final.md): the card and its fonts never change. */}
        <ScrollText style={{ flex: "0 1 auto", minHeight: 0, marginTop: 10 }}>
          <p className={`m-0 text-[14px] leading-[1.55] ${t.body}`}>{card.text}</p>
        </ScrollText>
        <ul className="mt-3.5 flex flex-wrap gap-1.5 text-[12px] font-medium">
          {card.chips.map((c) => (
            <li key={c} className={`rounded-full border px-[11px] py-[5px] ${t.chip}`}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom tab: MSSE:// │ part. Light text in both themes. */}
      <div className="absolute bottom-0 left-1/2 z-[4] h-10 w-[min(220px,74%)] -translate-x-1/2 text-[#E9EDF1]">
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[#5B646E]"
          style={{ clipPath: TAB }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-px bottom-0 top-px"
          style={{ background: BEZEL, clipPath: TAB }}
        />
        <span className="relative flex h-full items-center justify-center gap-2.5 pt-0.5">
          <span className="font-michroma text-[9.5px] tracking-[0.16em]">MSSE://</span>
          <span aria-hidden="true" className="h-4 w-[1.5px] bg-[rgba(233,237,241,0.6)]" />
          <span className="text-[12.5px] font-medium">{card.part}</span>
        </span>
      </div>
    </article>
  );
};
