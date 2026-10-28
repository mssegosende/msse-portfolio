import { RotateCw } from "lucide-react";

/**
 * The site is portrait-only on phones and tablets. No browser lets a page
 * lock orientation in a normal tab (Safari never, Chrome only in fullscreen),
 * so in landscape this covers the page and asks for the device to be turned
 * back. Shown purely by CSS (.rotate-lock in index.css), so it is right from
 * the first paint and follows the rotation without any JS. Installed as an
 * app, manifest.json already pins portrait.
 */
export const RotateLock = () => (
  <div
    data-testid="rotate-lock"
    role="alert"
    className="rotate-lock fixed inset-0 z-[100] flex-col items-center justify-center gap-5 bg-[rgb(var(--page-surface))] px-8 text-center"
  >
    <RotateCw size={28} strokeWidth={1.25} className="text-ink/65" aria-hidden="true" />
    <p className="font-display text-[13px] font-light uppercase tracking-[0.02em] text-ink/[0.83]">
      Rotate your device to portrait
    </p>
  </div>
);
