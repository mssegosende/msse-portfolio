import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { textBlip } from "../lib/sound";

// About's bio as a terminal that types itself (María Sol, 12 Nov): ~35
// characters a second, each one flickering through 3-6 random glyphs in the
// core ink before it settles in the body ink; a block cursor follows. Once
// the text reaches the panel's bottom, it scrolls up a line at a time and the
// read lines fade out at the top. Plays once per page load, only while the
// panel is on screen and the tab is visible (one requestAnimationFrame loop).
// Once it has finished (María Sol, pre-launch), the panel scrolls with the
// wheel, touch and the keyboard to reread it, no visible scrollbar. Reduced
// motion: the whole text at once, scrollable the same way.

const CPS = 35;
const GLYPHS = "0123456789#$%&*+=<>/\\|[]{}@!?;:~^";
/** How long each flicker glyph shows, ms. */
const GLYPH_MS = 45;

/** Typing progress, shared across mounts: the bio plays once per load. */
const progress = { chars: 0 };

const flickers = (i: number) => 3 + (Math.floor(Math.abs(Math.sin(i * 12.9898) * 43758.5453)) % 4);
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!;

/** Word-wrap the paragraphs to `cols` characters, a blank line between them. */
const wrapBio = (paragraphs: string[], cols: number): string[] => {
  const lines: string[] = [];
  paragraphs.forEach((p, k) => {
    if (k > 0) lines.push("");
    let line = "";
    for (const word of p.split(/\s+/)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= cols) line += ` ${word}`;
      else {
        lines.push(line);
        line = word;
      }
      while (line.length > cols) {
        lines.push(line.slice(0, cols));
        line = line.slice(cols);
      }
    }
    if (line) lines.push(line);
  });
  return lines;
};

const escape = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const BioTerminal = ({
  paragraphs,
  reduced,
  start = true,
  className = "",
}: {
  paragraphs: string[];
  reduced: boolean;
  /** Typing begins once this is true (About: once the portrait is in). */
  start?: boolean;
  className?: string;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [cols, setCols] = useState(0);
  // Typed to the end: the view becomes a real scroller.
  const [done, setDone] = useState(false);

  // Characters per line, from the panel's width and the mono font's advance.
  useLayoutEffect(() => {
    const view = viewRef.current;
    const probe = probeRef.current;
    if (!view || !probe) return undefined;
    const measure = () => {
      const advance = probe.offsetWidth / 50;
      if (advance > 0) setCols(Math.max(16, Math.floor(view.clientWidth / advance)));
    };
    measure();
    void document.fonts?.ready.then(measure);
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    ro?.observe(view);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    const text = textRef.current;
    const panel = panelRef.current;
    const view = viewRef.current;
    if (!cols || !text || !panel || !view) return undefined;
    const lines = wrapBio(paragraphs, cols);
    // Each line's first character, counting characters only (blank lines: none).
    const starts: number[] = [];
    let total = 0;
    for (const l of lines) {
      starts.push(total);
      total += l.length;
    }
    text.innerHTML = lines.map(() => `<div class="crt-bio__line"></div>`).join("");
    const rows = Array.from(text.children) as HTMLElement[];
    const lineH = rows[0]?.offsetHeight || 21;

    const lineOf = (i: number) => {
      let l = 0;
      while (l + 1 < lines.length && starts[l + 1]! <= i) l++;
      return l;
    };
    const cursor = `<span class="crt-bio__cursor"></span>`;

    if (reduced) {
      rows.forEach((row, l) => (row.textContent = lines[l]!));
      rows[rows.length - 1]?.insertAdjacentHTML("beforeend", cursor);
      panel.dataset.done = "true";
      const settle = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(settle);
    }

    // Lines already settled are written once; only the typing lines change.
    let settledThrough = -1;
    let last = 0;
    let raf = 0;
    let onScreen = false;
    const draw = () => {
      const t = progress.chars / CPS; // typing clock, s
      const typed = Math.min(total, Math.floor(progress.chars));
      // The first character still flickering.
      let firstLive = typed;
      for (let i = Math.max(0, typed - 12); i < typed; i++) {
        if (t < i / CPS + (flickers(i) * GLYPH_MS) / 1000) {
          firstLive = i;
          break;
        }
      }
      const cursorLine = typed >= total ? lines.length - 1 : lineOf(typed);
      const liveFrom = lineOf(Math.min(firstLive, Math.max(0, total - 1)));
      for (let l = settledThrough + 1; l < Math.min(liveFrom, lines.length); l++) {
        rows[l]!.textContent = lines[l]!;
        settledThrough = l;
      }
      for (let l = Math.max(liveFrom, settledThrough + 1); l <= cursorLine; l++) {
        const start = starts[l]!;
        const line = lines[l]!;
        let html = "";
        for (let c = 0; c < line.length; c++) {
          const i = start + c;
          if (i >= typed) break;
          if (i < firstLive) html += escape(line[c]!);
          else html += `<span class="crt-bio__flick">${escape(randomGlyph())}</span>`;
        }
        if (l === cursorLine) html += cursor;
        rows[l]!.innerHTML = html;
      }
      // Keep the typing line at the bottom; the read ones move up.
      const shift = Math.max(0, (cursorLine + 1) * lineH - view.clientHeight);
      text.style.transform = `translateY(${-shift}px)`;
      view.dataset.scrolled = shift > 0 ? "true" : "false";
      if (typed >= total && firstLive >= total) {
        panel.dataset.done = "true";
        // Hand the position from the transform to a real scroll, same place.
        text.style.transition = "none";
        text.style.transform = "";
        view.scrollTop = shift;
        setDone(true);
        return true;
      }
      return false;
    };
    // A digital text blip every 2-3 characters (when sound is on).
    let nextClick = Math.floor(progress.chars) + 2;
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      progress.chars += dt * CPS;
      if (progress.chars >= nextClick && progress.chars < total) {
        textBlip();
        nextClick = Math.floor(progress.chars) + 2 + (Math.random() < 0.5 ? 1 : 0);
      }
      if (draw()) return;
      if (onScreen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const begin = () => {
      if (!start) return;
      if (!raf && onScreen && !document.hidden && panel.dataset.done !== "true") {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    draw();
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = !!e?.isIntersecting;
        begin();
      },
      { threshold: 0.2 },
    );
    io.observe(panel);
    document.addEventListener("visibilitychange", begin);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", begin);
    };
  }, [cols, paragraphs, reduced, start]);

  const onKey = (e: React.KeyboardEvent) => {
    const view = viewRef.current;
    if (!view) return;
    const page = view.clientHeight - 21;
    const by: Record<string, number> = {
      ArrowDown: 21,
      ArrowUp: -21,
      PageDown: page,
      PageUp: -page,
      " ": page,
    };
    if (e.key === "Home") view.scrollTo({ top: 0 });
    else if (e.key === "End") view.scrollTo({ top: view.scrollHeight });
    else if (e.key in by) view.scrollBy({ top: by[e.key] });
    else return;
    e.preventDefault();
  };

  return (
    <div
      ref={panelRef}
      className={`crt-bio ${className}`}
      data-testid="about-text"
      data-reduced={reduced ? "true" : undefined}
      data-scrollable={done ? "true" : undefined}
      // Once typed: focusable, and the arrows, Page Up/Down, Home and End
      // scroll it (the text itself is aria-hidden; the bio is in sr-only).
      tabIndex={done ? 0 : undefined}
      role={done ? "region" : undefined}
      aria-label={done ? "Bio" : undefined}
      onKeyDown={done ? onKey : undefined}
    >
      {/* The bio as real text, for screen readers and search. */}
      <div className="sr-only">
        {paragraphs.map((p, i) => (
          <p key={i} data-testid={`about-paragraph-${i + 1}`}>
            {p}
          </p>
        ))}
      </div>
      <div
        ref={viewRef}
        aria-hidden="true"
        className="crt-bio__view"
        // Rereading: the top fade only while there is text above.
        onScroll={
          done
            ? (e) => {
                e.currentTarget.dataset.scrolled = e.currentTarget.scrollTop > 0 ? "true" : "false";
              }
            : undefined
        }
      >
        <div ref={textRef} className="crt-bio__text" />
      </div>
      <span ref={probeRef} aria-hidden="true" className="crt-bio__probe">
        {"0".repeat(50)}
      </span>
    </div>
  );
};

/** Values already typed this page load (a row types once). */
const typedOnce = new Set<string>();

/**
 * One short value typing in with the bio's effect (the dossier's data rows):
 * ~35 characters a second, each flickering through 3-6 glyphs before it
 * settles. Starts when `start` turns true, once per page load. The real text
 * is in the DOM for screen readers; the animated layer is aria-hidden.
 * Reduced motion: shown whole.
 */
export const TypeLine = ({
  text,
  start,
  reduced,
}: {
  text: string;
  start: boolean;
  reduced: boolean;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced || typedOnce.has(text)) {
      el.textContent = text;
      return undefined;
    }
    if (!start) {
      el.textContent = "";
      return undefined;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const typed = Math.min(text.length, Math.floor(t * CPS));
      let html = "";
      let live = false;
      for (let i = 0; i < typed; i++) {
        if (t < i / CPS + (flickers(i) * GLYPH_MS) / 1000) {
          live = true;
          html += `<span class="crt-bio__flick">${escape(randomGlyph())}</span>`;
        } else html += escape(text[i]!);
      }
      el.innerHTML = html;
      if (typed < text.length || live) raf = requestAnimationFrame(tick);
      else typedOnce.add(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, start, reduced]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden="true" />
    </>
  );
};
