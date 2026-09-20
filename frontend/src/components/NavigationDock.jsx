import { motion } from "framer-motion";
import { User, FolderOpen, Cpu, Mail, Send, Sun, Moon } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToId, scrollToTop } from "../hooks/useLenis";
import { useTheme } from "../hooks/useTheme";

const links = [
  { id: "about", label: "About", icon: User, testid: "nav-about-link" },
  { id: "projects", label: "Projects", icon: FolderOpen, testid: "nav-projects-link" },
  { id: "capabilities", label: "Capabilities", icon: Cpu, testid: "nav-capabilities-link" },
  { id: "contact", label: "Contact", icon: Mail, testid: "nav-contact-link" },
];

export const NavigationDock = ({ visible }) => {
  const { theme, toggle } = useTheme();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3">
      <motion.nav
        data-testid="navigation-dock"
        initial={{ y: 90, opacity: 0 }}
        animate={visible ? { y: 0, opacity: 1 } : {}}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto"
      >
        <div className="glass flex max-w-[calc(100vw-1.5rem)] items-center gap-1 px-2 py-2 shadow-[0_8px_40px_rgb(var(--surface) / 0.6)] sm:px-3 cut-corner overflow-x-auto">
          <button
            data-testid="nav-brand"
            onClick={scrollToTop}
            className="mr-2 hidden shrink-0 px-3 py-2 font-orbitron text-[13px] font-bold tracking-[0.02em] text-ink transition-colors hover:text-ink/[0.83] sm:block"
          >
            {profile.shortMark}
          </button>
          {links.map(({ id, label, icon: Icon, testid }) => (
            <button
              key={id}
              data-testid={testid}
              onClick={() => scrollToId(id)}
              className="group flex shrink-0 items-center gap-2 px-3 py-2 text-ink/65 transition-[color,background-color] duration-300 hover:bg-ink/5 hover:text-ink"
              aria-label={label}
            >
              <Icon size={15} />
              <span className="hidden font-display text-[13px] uppercase tracking-[0.02em] md:block">
                {label}
              </span>
            </button>
          ))}
          <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-ink/15" />
          <button
            data-testid="theme-toggle"
            onClick={toggle}
            className="group flex shrink-0 items-center gap-2 px-3 py-2 text-ink/65 transition-[color,background-color] duration-300 hover:bg-ink/5 hover:text-ink"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            data-testid="nav-cta-button"
            onClick={() => scrollToId("contact")}
            className="ml-1 flex shrink-0 items-center gap-2 bg-ink px-4 py-2 font-display text-[13px] uppercase tracking-[0.02em] text-surface transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgb(var(--ink) / 0.35)]"
          >
            <Send size={12} />
            <span className="hidden sm:block">Initiate</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
};
