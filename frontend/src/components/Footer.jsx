import { Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToId } from "../hooks/useLenis";

export const Footer = () => {
  return (
    <footer
      data-testid="footer"
      className="border-t border-[#222] bg-black px-4 pb-32 pt-14 sm:px-8 md:px-12 lg:px-20"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
        <div>
          <button
            data-testid="footer-brand"
            onClick={() => scrollToId("hero")}
            className="font-orbitron text-sm font-bold tracking-[0.02em] text-white transition-colors hover:text-[#D3D3D3]"
          >
            {profile.shortMark}
            <span className="text-[#A6A6A6]">AI</span>
          </button>
          <p className="mt-3 font-display text-[13px] uppercase tracking-[0.02em] text-[#A6A6A6]">
            © 2026 {profile.name} — engineered, not templated
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            data-testid="footer-github-link"
            href={profile.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222] text-[#A6A6A6] transition-[color,border-color] duration-300 hover:border-white/40 hover:text-white"
          >
            <Github size={16} />
          </a>
          {profile.socials.linkedin && (
            <a
              data-testid="footer-linkedin-link"
              href={profile.socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222] text-[#A6A6A6] transition-[color,border-color] duration-300 hover:border-white/40 hover:text-white"
            >
              <Linkedin size={16} />
            </a>
          )}
          <a
            data-testid="footer-email-link"
            href={`mailto:${profile.email}`}
            aria-label="Email"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#222] text-[#A6A6A6] transition-[color,border-color] duration-300 hover:border-white/40 hover:text-white"
          >
            <Mail size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
};
