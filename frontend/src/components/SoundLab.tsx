import { useState } from "react";
import { GLITCH_SOUND, previewBackground, SOUNDS, textBlip } from "@/lib/sound";

// A line of text typing, as the bio does it: ~35 characters a second, a blip
// every 2-3 of them.
const typeALine = () => {
  for (let c = 0; c < 40; c += 2 + (c % 3 === 0 ? 1 : 0))
    window.setTimeout(() => textBlip(true), (c / 35) * 1000);
};

/**
 * ?view=sounds (María Sol, pre-launch; not linked anywhere): one button per
 * HUD sound, to judge them one by one. It plays them whatever the SOUND
 * toggle says, at the site's level (the loudest peaks ~-24 dBFS).
 */
export const SoundLab = () => {
  const [bg, setBg] = useState(false);
  return (
    <main
      className="min-h-screen bg-crt-bg px-4 py-10 text-crt-text sm:px-10"
      data-testid="sound-lab"
    >
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div>
          <p className="crt-section-label m-0 font-vt text-[20px] tracking-[0.14em]">
            INDEX // SOUND CHECK
          </p>
          <h1 className="crt-glow m-0 mt-2 font-michroma text-[28px] font-normal uppercase tracking-[0.04em] text-crt-title">
            HUD sounds
          </h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-crt-text-2">
            Each button plays one sound as the site does, cut from your two sound-design tracks,
            very quiet (the loudest peaks near -24 dBFS). BACKGROUND plays your track as the loop
            that runs under everything while SOUND is on. On the site they stay off until the
            visitor turns SOUND on in the dock.
            {!GLITCH_SOUND && " The glitch burst is switched off (GLITCH_SOUND)."}
          </p>
        </div>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
          {Object.entries(SOUNDS).map(([name, play]) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => play(true)}
                className="crt-button flex min-h-12 w-full items-center gap-3 px-4 text-left text-[21px] tracking-[0.1em]"
                data-testid={`sound-${name.split(" · ")[0]}`}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
                </svg>
                {name.toUpperCase()}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                previewBackground(!bg);
                setBg(!bg);
              }}
              aria-pressed={bg}
              className="crt-button flex min-h-12 w-full items-center gap-3 px-4 text-left text-[21px] tracking-[0.1em]"
              data-testid="sound-background"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
              </svg>
              BACKGROUND: {bg ? "ON" : "OFF"}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={typeALine}
              className="crt-button flex min-h-12 w-full items-center gap-3 px-4 text-left text-[21px] tracking-[0.1em]"
              data-testid="sound-1-line"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 2 L12 7 L3 12 Z" fill="currentColor" />
              </svg>
              1 · TYPING, A WHOLE LINE
            </button>
          </li>
        </ul>
        <a href="/" className="crt-link self-start font-vt text-[20px] tracking-[0.14em]">
          &lt; BACK TO THE SITE
        </a>
      </div>
    </main>
  );
};
