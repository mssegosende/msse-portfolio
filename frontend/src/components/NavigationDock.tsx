import { motion } from "framer-motion";
import { User, FolderOpen, Cpu, Send, Sun, Moon, Volume2, VolumeX } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToTop } from "../hooks/useLenis";
import { THEME_TOGGLE, useTheme } from "../hooks/useTheme";
import { goToSection, useActiveSection } from "../hooks/useActiveSection";
import { SECTIONS } from "../lib/sections";
import { setSound, useSound } from "../lib/sound";

const links = [
  { id: "about", label: "About", icon: User, testid: "nav-about-link" },
  { id: "projects", label: "Projects", icon: FolderOpen, testid: "nav-projects-link" },
  { id: "capabilities", label: "Capabilities", icon: Cpu, testid: "nav-capabilities-link" },
];

export const NavigationDock = ({ visible }: { visible: boolean }) => {
  const { theme, toggle } = useTheme();
  const { id: current } = useActiveSection();
  const sound = useSound();

  return (
    // data-dock-slot: the dock's resting place, measured even while the nav
    // inside is hidden (useCalloutsAboveDock).
    <div
      data-dock-slot=""
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3"
    >
      <motion.nav
        data-testid="navigation-dock"
        initial={{ y: 90, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto w-full sm:w-auto"
      >
        {/* CRT frame with nodes (SPEC §2b). The dots sit on this outer box: the
            inner row scrolls sideways on narrow phones and would clip them. */}
        <div className="crt-dock relative">
          {(
            [
              "left-[-4px] top-[-4px]",
              "right-[-4px] top-[-4px]",
              "bottom-[-4px] left-[-4px]",
              "bottom-[-4px] right-[-4px]",
            ] as const
          ).map((pos) => (
            <span key={pos} aria-hidden="true" className={`crt-node ${pos}`} />
          ))}
          <div className="flex w-full max-w-[calc(100vw-1.5rem)] items-center justify-between gap-0 overflow-x-auto p-1.5 [scrollbar-width:none] sm:w-auto sm:justify-start sm:gap-1 sm:px-2.5">
            <button
              data-testid="nav-brand"
              onClick={scrollToTop}
              aria-label="Back to the top"
              // Exactly the floating signature's MSSE:// (María Sol, 13 Nov:
              // the reference): 13px, .msse-mark, white, its dark halo; on
              // phones too (hidden under 380px wide: the footer's logo goes
              // to the top too).
              className="msse-mark signature-halo mr-0.5 min-h-11 shrink-0 px-1 text-[13px] leading-[1.5] text-[#14181D] max-[379px]:hidden dark:text-white sm:mr-2 sm:px-3"
            >
              {profile.shortMark}
            </button>
            {links.map(({ id, label, icon: Icon, testid }) => (
              <button
                key={id}
                data-testid={testid}
                onClick={() => goToSection(SECTIONS.findIndex((s) => s.id === id))}
                aria-current={current === id ? "true" : undefined}
                className="crt-dock__link group flex min-h-11 shrink-0 items-center gap-2 px-2 sm:px-3"
                aria-label={label}
              >
                <Icon size={15} />
                <span className="hidden font-vt text-[21px] uppercase tracking-[0.14em] md:block">
                  {label}
                </span>
              </button>
            ))}
            <span
              aria-hidden="true"
              className="mx-1.5 hidden h-6 w-px shrink-0 bg-crt-line sm:block"
            />
            {/* Framed (dashed) so it reads as a control, not another destination.
                Off on the live site, dark only (THEME_TOGGLE, hooks/useTheme). */}
            {THEME_TOGGLE && (
              <button
                data-testid="theme-toggle"
                onClick={toggle}
                className="crt-dock__toggle flex min-h-11 shrink-0 items-center gap-2 px-2 sm:px-3"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                <span className="hidden font-vt text-[19px] uppercase tracking-[0.14em] lg:block">
                  {theme === "dark" ? "Light" : "Dark"}
                </span>
              </button>
            )}
            {/* SOUND: OFF / ON (María Sol, pre-launch): off by default,
                remembered for the session. */}
            <button
              data-testid="sound-toggle"
              onClick={() => setSound(!sound)}
              aria-pressed={sound}
              className="crt-dock__toggle ml-1 flex min-h-11 shrink-0 items-center gap-2 px-2 sm:px-3"
              aria-label={sound ? "Sound on: turn it off" : "Sound off: turn it on"}
              title={sound ? "Sound on" : "Sound off"}
            >
              {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span className="hidden font-vt text-[19px] uppercase tracking-[0.14em] lg:block">
                Sound: {sound ? "On" : "Off"}
              </span>
            </button>
            <button
              data-testid="nav-cta-button"
              onClick={() => goToSection(SECTIONS.findIndex((s) => s.id === "contact"))}
              className="crt-dock__cta ml-1 flex min-h-11 shrink-0 items-center gap-1.5 px-2 font-vt text-[16px] uppercase tracking-[0.06em] sm:gap-2 sm:px-4 sm:text-[21px] sm:tracking-[0.14em]"
            >
              <Send size={12} />
              <span>Initiate</span>
            </button>
          </div>
        </div>
      </motion.nav>
    </div>
  );
};
