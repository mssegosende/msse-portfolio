import { RotateCw } from "lucide-react";

/**
 * Phones and tablets are portrait-only. A tab cannot lock orientation, so
 * landscape is covered instead. Visibility is pure CSS (.rotate-lock), right
 * from the first paint; manifest.json pins portrait for installed apps.
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
