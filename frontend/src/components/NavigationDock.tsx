import { motion } from "framer-motion";
import { User, FolderOpen, Cpu, Send, Sun, Moon } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToTop } from "../hooks/useLenis";
import { useTheme } from "../hooks/useTheme";
import { goToSection, useActiveSection } from "../hooks/useActiveSection";
import { SECTIONS } from "../lib/sections";

const links = [
  { id: "about", label: "About", icon: User, testid: "nav-about-link" },
  { id: "projects", label: "Projects", icon: FolderOpen, testid: "nav-projects-link" },
  { id: "capabilities", label: "Capabilities", icon: Cpu, testid: "nav-capabilities-link" },
];

export const NavigationDock = ({ visible }: { visible: boolean }) => {
  const { theme, toggle } = useTheme();
  const { id: current } = useActiveSection();

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
        <div className="glass flex w-full max-w-[calc(100vw-1.5rem)] items-center justify-between gap-0.5 py-1.5 pl-1.5 pr-1.5 sm:w-auto sm:justify-start sm:gap-1 sm:py-2 shadow-[0_8px_40px_rgb(var(--surface) / 0.6)] sm:px-3 cut-corner overflow-x-auto">
          <button
            data-testid="nav-brand"
            onClick={scrollToTop}
            aria-label="Back to the top"
            className="mr-1 shrink-0 px-2 py-2 font-michroma text-[11px] tracking-[0.14em] text-ink transition-colors hover:text-ink/[0.83] sm:mr-2 sm:px-3 sm:text-[13px] sm:tracking-[0.02em]"
          >
            {profile.shortMark}
          </button>
          {links.map(({ id, label, icon: Icon, testid }) => (
            <button
              key={id}
              data-testid={testid}
              onClick={() => goToSection(SECTIONS.findIndex((s) => s.id === id))}
              aria-current={current === id ? "true" : undefined}
              className={`group flex shrink-0 items-center gap-2 px-3 py-2 transition-[color,background-color] duration-300 hover:bg-ink/5 hover:text-ink ${
                current === id ? "font-semibold text-ink" : "text-ink/65 dark:text-ink/[0.78]"
              }`}
              aria-label={label}
            >
              <Icon size={15} />
              <span className="hidden font-display text-[13px] uppercase tracking-[0.02em] md:block">
                {label}
              </span>
            </button>
          ))}
          <span aria-hidden="true" className="mx-1.5 hidden h-5 w-px shrink-0 bg-ink/15 sm:block" />
          {/* Framed so it reads as a control, not another destination. */}
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            className="group relative flex shrink-0 items-center gap-2 cut-corner border border-ink/20 bg-ink/[0.06] px-3 py-2 text-ink transition-[background-color,border-color] duration-300 hover:border-ink/45 hover:bg-ink/10"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {/* The folded corner. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 h-[14px] w-[14px] bg-[linear-gradient(225deg,transparent_50%,rgb(var(--ink)/0.18)_50%)]"
            />
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hidden font-display text-[12px] uppercase tracking-[0.02em] lg:block">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
          <button
            data-testid="nav-cta-button"
            onClick={() => goToSection(SECTIONS.findIndex((s) => s.id === "contact"))}
            className="ml-1 flex shrink-0 items-center gap-1.5 bg-ink px-3 py-2 sm:gap-2 sm:px-4 font-display text-[13px] uppercase tracking-[0.02em] text-surface transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgb(var(--ink) / 0.35)]"
          >
            <Send size={12} />
            <span>Initiate</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
};
