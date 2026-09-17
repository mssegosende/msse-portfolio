import { motion } from "framer-motion";
import { User, FolderOpen, Cpu, Mail, Send } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

const links = [
  { id: "about", label: "About", icon: User, testid: "nav-about-link" },
  { id: "projects", label: "Projects", icon: FolderOpen, testid: "nav-projects-link" },
  { id: "capabilities", label: "Capabilities", icon: Cpu, testid: "nav-capabilities-link" },
  { id: "contact", label: "Contact", icon: Mail, testid: "nav-contact-link" },
];

export const NavigationDock = ({ visible }) => {
  return (
    <motion.nav
      data-testid="navigation-dock"
      initial={{ y: 90, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : {}}
      transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="glass flex items-center gap-1 rounded-full px-3 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
        <button
          data-testid="nav-brand"
          onClick={() => scrollToId("hero")}
          className="mr-2 hidden rounded-full px-3 py-2 font-orbitron text-[11px] font-bold tracking-[0.25em] text-white transition-colors hover:text-cyber sm:block"
        >
          {profile.shortMark}
        </button>
        {links.map(({ id, label, icon: Icon, testid }) => (
          <button
            key={id}
            data-testid={testid}
            onClick={() => scrollToId(id)}
            className="group flex items-center gap-2 rounded-full px-3 py-2 text-neutral-400 transition-[color,background-color] duration-300 hover:bg-white/5 hover:text-cyber"
            aria-label={label}
          >
            <Icon size={15} />
            <span className="hidden font-kodemono text-[10px] uppercase tracking-[0.2em] md:block">
              {label}
            </span>
          </button>
        ))}
        <button
          data-testid="nav-cta-button"
          onClick={() => scrollToId("contact")}
          className="ml-2 flex items-center gap-2 rounded-full bg-cyber px-4 py-2 font-kodemono text-[10px] font-semibold uppercase tracking-[0.2em] text-black transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(0,255,209,0.5)]"
        >
          <Send size={12} />
          <span className="hidden sm:block">Initiate</span>
        </button>
      </div>
    </motion.nav>
  );
};
