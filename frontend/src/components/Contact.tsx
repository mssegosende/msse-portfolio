import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "../data/portfolioData";
import { scrollToTop } from "../hooks/useLenis";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useSectionStep } from "../hooks/useSectionStep";
import { REDUCED_MOTION_QUERY } from "../lib/motion";
import { clampScale, useFrame } from "../hooks/useFrame";
import { GridField } from "./GridField";
import s from "./Contact.module.css";
import { useCrossfade } from "@/hooks/useSectionDissolve";

// Production: same origin (Vercel routes /api/* to the backend service).
// Dev: the local uvicorn. VITE_BACKEND_URL overrides both.
const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? "http://localhost:8000" : "");
const API_URL = `${BACKEND_URL}/api/contact`;

// The required fields, in the order they are checked and focused. Same rules
// as the backend (backend/server.py ContactMessage), which answers 422.
const REQUIRED = ["name", "email", "message"] as const;
type RequiredField = (typeof REQUIRED)[number];
type FieldErrors = Partial<Record<RequiredField, string>>;

const fieldError = (key: RequiredField, value: string): string | undefined => {
  const v = value.trim();
  if (!v) return `ERR: ${key} is required`;
  if (key === "name" && v.length < 2) return "ERR: name must be at least 2 characters";
  if (key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "ERR: invalid email format";
  if (key === "message" && v.length < 10) return "ERR: message must be at least 10 characters";
  return undefined;
};

const validate = (form: ContactForm): FieldErrors => {
  const errors: FieldErrors = {};
  for (const key of REQUIRED) {
    const error = fieldError(key, form[key]);
    if (error) errors[key] = error;
  }
  return errors;
};

// The phones' live signal (ContactM.dc.html): drawn twice as wide as its box
// and slid sideways by CSS, so it moves without a timer.
const RX_WAVE = (() => {
  let d = "";
  for (let x = 0; x <= 696; x += 4) {
    const y = 25 + 14 * Math.sin(x * 0.0903) * (0.6 + 0.4 * Math.sin(x * 0.018));
    d += `${x === 0 ? "M" : "L"}${x} ${y.toFixed(1)} `;
  }
  return d;
})();

// Contact's desktop screen at its design size (Contact.dc.html), px tall.
const CONTACT_H = 960;

// BASE · BUENOS AIRES: the local time there (GMT-3, no daylight saving).
const BA_TIME = (withSeconds: boolean) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  });

/**
 * The live clock in Buenos Aires, ticking seconds while on screen (María Sol,
 * 13 Nov). Reduced motion: hours and minutes, updated each minute.
 */
const BaseClock = ({ still, live }: { still: boolean; live: boolean }) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!live) return undefined;
    const tick = () => setNow(new Date());
    // Right away when it comes on screen, then on the beat.
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, still ? 30000 : 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [still, live]);
  return (
    <time data-testid="contact-clock" dateTime={now.toISOString()}>
      {BA_TIME(!still).format(now)}
    </time>
  );
};

// Errors are notices, not transcript: one entry per message, kept apart from
// the log. Resubmitting the same invalid field restarts its timer instead of
// stacking another copy.
const ERROR_TTL = 4200;

/** The request body; `website` is the honeypot. */
interface ContactForm {
  name: string;
  email: string;
  company: string;
  linkedin: string;
  message: string;
  website: string;
}

const EMPTY_FORM: ContactForm = {
  name: "",
  email: "",
  company: "",
  linkedin: "",
  message: "",
  website: "",
};

interface LogLine {
  text: string;
  ok: boolean;
}

type FieldChange = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

interface TerminalFieldProps {
  label: string;
  hint?: string;
  multiline?: boolean;
  type?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  /** Inline error under the input; marks it invalid. */
  error?: string;
  name?: string;
  onChange: (e: FieldChange) => void;
  "data-testid"?: string;
}

// One terminal prompt: "> label (hint):" on one line, over its input.
const TerminalField = ({
  label,
  hint,
  multiline = false,
  type = "text",
  error,
  ...field
}: TerminalFieldProps) => {
  const errorId = `contact-${label}-error`;
  const a11y = {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  return (
    <label className={s.field}>
      <span className={s.label}>
        &gt; {label.toUpperCase()}
        {hint && (
          <>
            {" "}
            <span className={s.hint}>{hint}</span>
          </>
        )}
        :
      </span>
      {multiline ? (
        <textarea rows={4} className={s.input} {...a11y} {...field} />
      ) : (
        <input type={type} className={s.input} {...a11y} {...field} />
      )}
      {error && (
        <span id={errorId} data-testid={`contact-${label}-error`} className={s.fieldError}>
          {error}
        </span>
      )}
    </label>
  );
};

/**
 * Scene 5 · LET'S TALK (design/source/{desktop,mobile}/light/scene-5-contact.dc.html):
 * the text, the terminal form card and the page footer, over the bulging grid.
 */
export const Contact = () => {
  const ref = useRef<HTMLElement>(null);
  // 4 -> 5: About's stage holds its last screen; Contact comes in, pinned.
  useCrossfade(ref, "about", true, -3);
  // Reduced motion: shown whole (the hidden states are never armed).
  const still = useMediaQuery(REDUCED_MOTION_QUERY);
  const reached = useSectionStep(ref, 3) >= 0 || still;
  const [form, setForm] = useState(EMPTY_FORM);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [errors, setErrors] = useState<{ text: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  // One timer per message, so two errors expire independently.
  const errorTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = errorTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // The confirmation takes the form's place at the form's height (María Sol,
  // 13 Nov: the window never grows, so the footer never slides under the dock).
  const [formH, setFormH] = useState<number | null>(null);
  // The section's loops (the ghosts, the wave, the radar, the clock) run only on screen.
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([e]) => setLive(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const set = (key: keyof ContactForm) => (e: FieldChange) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    // An error clears as soon as the field is fixed; it never appears while typing.
    setFieldErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      const error = fieldError(key as RequiredField, value);
      if (error) next[key as RequiredField] = error;
      else delete next[key as RequiredField];
      return next;
    });
  };

  const pushLine = (text: string, ok = false) => setLines((prev) => [...prev, { text, ok }]);
  // NEW MESSAGE: the form comes back, empty.
  const again = () => {
    setDone(false);
    setLines([]);
  };

  const showError = (text: string) => {
    setErrors((prev) => (prev.some((x) => x.text === text) ? prev : [...prev, { text }]));
    const timers = errorTimers.current;
    clearTimeout(timers.get(text));
    timers.set(
      text,
      setTimeout(() => {
        timers.delete(text);
        setErrors((prev) => prev.filter((x) => x.text !== text));
      }, ERROR_TTL),
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;

    const invalid = validate(form);
    setFieldErrors(invalid);
    const first = REQUIRED.find((key) => invalid[key]);
    if (first) {
      const el = e.currentTarget.elements.namedItem(first);
      if (el instanceof HTMLElement) el.focus();
      return;
    }

    setSending(true);
    setFormH(e.currentTarget.offsetHeight);
    setLines([{ text: "$ transmit --channel=secure …", ok: false }]);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        pushLine("[OK] MESSAGE TRANSMITTED — I will get back to you within 24h.", true);
        setDone(true);
        setForm(EMPTY_FORM);
      } else if (res.status === 429) {
        showError("[ERR] RATE LIMIT — too many transmissions. Try again later.");
      } else {
        showError(`[ERR] TRANSMISSION FAILED — server responded ${res.status}.`);
      }
    } catch {
      showError("[ERR] NETWORK OFFLINE — message not sent. Try again.");
    } finally {
      setSending(false);
    }
  };

  // Desktop: the 1440-wide design scaled to the window's width, capped so the
  // whole screen (title, form, footer) fits its height (María Sol, 12 Nov).
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { kw, height } = useFrame();
  const zoom = clampScale(Math.min(kw, height / CONTACT_H));
  const stageStyle = desktop ? { zoom, minHeight: `calc(100vh / ${zoom})` } : undefined;

  // Ø5.1 text, Ø5.2 the card, Ø5.3 the footer: one after another on arrival.
  const rise = (i: number) => ({
    "data-on": reached,
    style: { transitionDelay: reached ? `${i * 0.35}s` : undefined },
  });

  return (
    <section
      ref={ref}
      id="contact"
      data-testid="contact-section"
      // The reveals' hidden states apply only once JS has armed them.
      data-armed={!still}
      // xf-overlap: the section crossfades (useSectionDissolve).
      className={`xf-overlap ${s.section}`}
      data-live={live}
    >
      {/* The perspective floor (GridField, in the grid token) under a fade,
          then the page grid (Contact.dc.html): the section's, unscaled. */}
      <div aria-hidden="true" className={s.floor}>
        <GridField />
      </div>
      <div aria-hidden="true" className={s.floorFade} />
      <div aria-hidden="true" className="crt-grid absolute inset-0" />
      <div aria-hidden="true" className={`crt-bg-word font-michroma ${s.word}`}>
        TALK
      </div>
      <div className={s.stage} style={stageStyle}>
        <div className={`${s.head} ${s.reveal}`} {...rise(0)} data-xf="head">
          <span className="crt-section-label self-start font-vt">05 // CONTACT</span>
          {/* LET'S / TALK (phones: inside crosshair corners), with two ghost
              copies that jump sideways now and then, and the live signal
              under it (ContactM.dc.html; desktop too since María Sol, 13 Nov). */}
          <div className={s.titleBox}>
            <span aria-hidden="true" className={s.rx}>
              [signal.rx]
            </span>
            <span aria-hidden="true" className={`${s.ghost} ${s.ghostA}`}>
              LET&apos;S
              <br />
              TALK
            </span>
            <span aria-hidden="true" className={`${s.ghost} ${s.ghostB}`}>
              LET&apos;S
              <br />
              TALK
            </span>
            <h2 className={`crt-glow font-michroma ${s.title}`}>
              Let&apos;s <br className={s.titleBreak} />
              talk
            </h2>
          </div>
          <div aria-hidden="true" className={s.wave}>
            <div className="crt-scope h-[52px] overflow-hidden border border-[var(--crt-line-row)]">
              <svg
                width="200%"
                height="50"
                viewBox="0 0 696 50"
                preserveAspectRatio="none"
                className={s.waveSvg}
              >
                <path d={RX_WAVE} className="crt-scope__wave" fill="none" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-[0.08em] text-crt-dim">
              <span>SIGNAL · OPEN</span>
              <span>RX · MSSE://CONTACT</span>
            </div>
          </div>
        </div>

        <div className={`${s.card} ${s.reveal}`} data-testid="contact-terminal" {...rise(1)}>
          <div className={s.chrome}>
            <span className={s.chromeTitle}>
              msse@contact: ~/new<span className={s.chromeLong}>-message</span>
            </span>
            <span aria-hidden="true" className="crt-term__dots">
              <span />
              <span />
              <span />
            </span>
          </div>

          {done ? (
            // The confirmation in the form's place, at its height.
            <div
              data-testid="contact-status-lines"
              className={s.log}
              style={formH ? { height: formH } : undefined}
            >
              <div>
                {lines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={line.ok ? s.logOk : undefined}
                  >
                    {line.text}
                  </motion.p>
                ))}
                <span className="terminal-caret" />
              </div>
              <button
                type="button"
                data-testid="contact-new-message"
                onClick={again}
                className={s.again}
              >
                NEW MESSAGE &gt;&gt;
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={s.form} noValidate>
              <div className={s.fields}>
                <TerminalField
                  label="name"
                  data-testid="contact-name-input"
                  value={form.name}
                  required
                  error={fieldErrors.name}
                  name="name"
                  onChange={set("name")}
                  placeholder="your name"
                />
                <TerminalField
                  label="email"
                  type="email"
                  data-testid="contact-email-input"
                  value={form.email}
                  required
                  error={fieldErrors.email}
                  name="email"
                  onChange={set("email")}
                  placeholder="you@company.com"
                />
                <TerminalField
                  label="company"
                  hint="(optional)"
                  data-testid="contact-company-input"
                  value={form.company}
                  onChange={set("company")}
                  placeholder="organization / studio"
                />
                <TerminalField
                  label="linkedin"
                  hint="(optional)"
                  type="url"
                  data-testid="contact-linkedin-input"
                  value={form.linkedin}
                  onChange={set("linkedin")}
                  placeholder="linkedin.com/in/..."
                />
                <div className={s.full}>
                  <TerminalField
                    label="message"
                    multiline
                    data-testid="contact-message-input"
                    value={form.message}
                    required
                    error={fieldErrors.message}
                    name="message"
                    onChange={set("message")}
                    placeholder="what are you building?"
                  />
                </div>
              </div>

              {/* honeypot — invisible to humans */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={set("website")}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <div className={s.sendRow}>
                <span aria-hidden="true" className={s.prompt}>
                  {sending ? "$ transmit --channel=secure …" : "$ send --to msse"}{" "}
                  <span className={s.caret} />
                </span>
                <button
                  data-testid="contact-submit-button"
                  type="submit"
                  disabled={sending}
                  className={s.submit}
                >
                  {sending ? "SENDING…" : "SEND >>"}
                </button>
              </div>

              {/* Hidden with :empty rather than errors.length: the array is
                already empty while the last line fades out, and a JS
                condition would unmount it mid-animation. */}
              <div data-testid="contact-errors" className={s.notices}>
                <AnimatePresence>
                  {errors.map((err) => (
                    <motion.p
                      key={err.text}
                      role="alert"
                      data-testid="contact-error"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    >
                      {err.text}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>
            </form>
          )}
        </div>

        {/* Three small live boxes (María Sol, 13 Nov): CHANNEL OPEN with its
            typing log; BASE with the Buenos Aires clock and GitHub; SIGNAL,
            a radar sweep (desktop only). */}
        <div className={`${s.side} ${s.reveal}`} {...rise(1)} data-xf="cards">
          <aside className={`crt-frame ${s.box}`} aria-label="Channel">
            <div className={s.channelHead}>
              <span className="crt-glow-label">CHANNEL OPEN</span>
              <span
                aria-hidden="true"
                className="h-2 w-2 animate-pulse-dot rounded-full bg-status shadow-[0_0_10px_#F472B6] motion-reduce:animate-none"
              />
            </div>
            <div aria-hidden="true" className={s.typed}>
              <div>
                <span className="text-crt-dim">&gt;</span>{" "}
                <span className={s.type1}>channel open</span>
              </div>
              <div>
                <span className="text-crt-dim">&gt;</span>{" "}
                <span className={s.type2}>waiting for your message</span>
                <span className={s.caret} />
              </div>
            </div>
          </aside>
          <aside className={`crt-frame ${s.box}`} aria-label="Base">
            <div className={s.channelHead}>
              <span className="crt-glow-label">BASE · BUENOS AIRES</span>
            </div>
            <div className={s.channelRow}>
              <span className={s.channelKey}>GMT-3</span>
              <span className={s.channelVal}>
                <BaseClock still={still} live={live} />
              </span>
            </div>
            <a
              className={`${s.channelRow} ${s.channelLink}`}
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={s.channelKey}>GITHUB</span>
              <span className={s.channelVal}>MSSEGOSENDE &gt;</span>
            </a>
          </aside>
          <aside aria-hidden="true" className={`crt-frame ${s.box} ${s.signalBox}`}>
            <div className={s.channelHead}>
              <span className="crt-glow-label">SIGNAL</span>
              <span className={s.radarTag}>[signal.open]</span>
            </div>
            <div className={s.radar}>
              <span className={s.radarRing} />
              <span className={`${s.radarRing} ${s.radarRingIn}`} />
              <span className={s.radarV} />
              <span className={s.radarH} />
              <span className={s.sweep} />
              <span className={s.blip} />
              <span className={`${s.blip} ${s.blip2}`} />
            </div>
          </aside>
        </div>

        <footer
          data-testid="footer"
          className={`${s.footer} ${s.reveal}`}
          {...rise(2)}
          data-xf="cards"
        >
          {/* To the very top: the hero is pinned, so its element would land mid-sequence. */}
          <button
            type="button"
            data-testid="footer-brand"
            onClick={scrollToTop}
            className={s.brand}
          >
            {profile.shortMark}
          </button>
          <span className={s.socials}>
            <a
              data-testid="footer-github-link"
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className={s.social}
            >
              GITHUB
            </a>
            {/* LINKEDIN (María Sol, 12 Nov); EMAIL stays beside it. */}
            {profile.socials.linkedin && (
              <a
                data-testid="footer-linkedin-link"
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={s.social}
              >
                LINKEDIN
              </a>
            )}
            <a
              data-testid="footer-email-link"
              href={`mailto:${profile.email}`}
              className={s.social}
            >
              EMAIL
            </a>
          </span>
          <span className={s.credit}>
            © {new Date().getFullYear()} {profile.name.toUpperCase()}
          </span>
        </footer>
      </div>
      <div aria-hidden="true" className="crt-scanlines pointer-events-none absolute inset-0" />
    </section>
  );
};
