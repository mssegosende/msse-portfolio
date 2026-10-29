import { Github, Linkedin, Mail } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToTop } from "../hooks/useLenis";

const SocialLink = ({ href, label, testId, external = true, children }) => (
  <a
    data-testid={testId}
    href={href}
    aria-label={label}
    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/[0.13] text-ink/65 transition-[color,border-color] duration-300 hover:border-ink/40 hover:text-ink"
  >
    {children}
  </a>
);

export const Footer = () => (
  <footer
    data-testid="footer"
    className="border-t border-ink/[0.13] bg-surface px-4 pb-32 pt-14 sm:px-8 md:px-12 lg:px-20"
  >
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-center">
      <div>
        {/* To the very top: the hero is pinned, so its element would land mid-sequence. */}
        <button
          data-testid="footer-brand"
          onClick={scrollToTop}
          className="font-orbitron text-sm font-bold tracking-[0.02em] text-ink transition-colors hover:text-ink/[0.83]"
        >
          {profile.shortMark}
          <span className="text-ink/65"> {profile.markSuffix}</span>
        </button>
        <p className="mt-3 font-display text-[13px] uppercase tracking-[0.02em] text-ink/65">
          © {new Date().getFullYear()} {profile.name} — Software & AI Engineer
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SocialLink href={profile.socials.github} label="GitHub" testId="footer-github-link">
          <Github size={16} />
        </SocialLink>
        {profile.socials.linkedin && (
          <SocialLink
            href={profile.socials.linkedin}
            label="LinkedIn"
            testId="footer-linkedin-link"
          >
            <Linkedin size={16} />
          </SocialLink>
        )}
        <SocialLink
          href={`mailto:${profile.email}`}
          label="Email"
          testId="footer-email-link"
          external={false}
        >
          <Mail size={16} />
        </SocialLink>
      </div>
    </div>
  </footer>
);
