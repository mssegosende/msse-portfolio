import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Mail } from "lucide-react";
import { profile } from "../data/portfolioData";
import { scrollToTop } from "../hooks/useLenis";
import { useSectionStep } from "../hooks/useSectionStep";
import { GridField } from "./GridField";
import { Num } from "./Num";
import { SectionBackdrop } from "./SectionBackdrop";
import s from "./Contact.module.css";

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
        &gt; {label}
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
  const reached = useSectionStep(ref, 3) >= 0;
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
    pushLine("$ transmit --channel=secure …");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        pushLine("[OK] MESSAGE TRANSMITTED — I'll get back to you within 24h.", true);
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

  // Ø5.1 text, Ø5.2 the card, Ø5.3 the footer: one after another on arrival.
  const rise = (i: number) => ({
    "data-on": reached,
    style: { transitionDelay: reached ? `${i * 0.35}s` : undefined },
  });

  return (
    <section ref={ref} id="contact" data-testid="contact-section" className={s.section}>
      <div className={s.stage}>
        <SectionBackdrop scene="contact" />
        <GridField />

        <div className={`${s.left} ${s.reveal}`} {...rise(0)}>
          <p className="section-pill">
            <span className="lg:hidden">
              <Num value="5" /> ·&nbsp;
            </span>
            OPEN CHANNEL
          </p>
          <h2 className={`section-title section-title--light ${s.title}`}>
            Let&apos;s
            <br className="hidden lg:inline" /> talk
          </h2>
          <p className={s.lede}>
            Tell me what you&apos;re building. I answer every message — and if you share your
            LinkedIn, I&apos;ll send you my CV.
          </p>
          <div className={s.where}>Remote · worldwide · GMT−3</div>
        </div>

        <div className={`${s.card} ${s.reveal}`} data-testid="contact-terminal" {...rise(1)}>
          <div aria-hidden="true" className={s.outline} />
          <div aria-hidden="true" className={s.bezel} />
          <div aria-hidden="true" className={s.gap} />
          <div aria-hidden="true" className={s.panel} />

          <div className={s.body}>
            <div className={s.chrome}>
              <span aria-hidden="true" className={`${s.dot} ${s.dot1}`} />
              <span aria-hidden="true" className={`${s.dot} ${s.dot2}`} />
              <span aria-hidden="true" className={`${s.dot} ${s.dot3}`} />
              <span className={s.chromeTitle}>
                <span className="hidden lg:inline">msg@portfolio: </span>~/contact — zsh
              </span>
            </div>

            <form onSubmit={handleSubmit} className={s.form} noValidate>
              <div>$ contact --send --secure</div>

              <div className={s.pair}>
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
                  placeholder="you@domain.com"
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
                  hint="(for the CV)"
                  type="url"
                  data-testid="contact-linkedin-input"
                  value={form.linkedin}
                  onChange={set("linkedin")}
                  placeholder="linkedin.com/in/…"
                />
              </div>
              <TerminalField
                label="message"
                multiline
                data-testid="contact-message-input"
                value={form.message}
                required
                error={fieldErrors.message}
                name="message"
                onChange={set("message")}
                placeholder="describe your project, timeline, scope…"
              />

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

              <button
                data-testid="contact-submit-button"
                type="submit"
                disabled={sending}
                className={s.submit}
              >
                {sending ? "Transmitting…" : done ? "Transmit again" : "Transmit message"}
              </button>

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

            {lines.length > 0 && (
              <div data-testid="contact-status-lines" className={s.log}>
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
            )}
          </div>

          <div className={s.tab}>
            <span className={s.tabInner}>
              <span className={s.tabMark}>MSSE://</span>
              <span aria-hidden="true" className={s.tabRule} />
              <span className={s.tabText}>Secure channel</span>
            </span>
          </div>
        </div>

        <footer data-testid="footer" className={`${s.footer} ${s.reveal}`} {...rise(2)}>
          <div>
            {/* To the very top: the hero is pinned, so its element would land mid-sequence. */}
            <button
              type="button"
              data-testid="footer-brand"
              onClick={scrollToTop}
              className={s.brand}
            >
              {profile.shortMark}
            </button>
            <p className={s.credit}>
              © {new Date().getFullYear()} {profile.name}
              <br />
              Software &amp; AI engineer
            </p>
          </div>
          <div className={s.socials}>
            <a
              data-testid="footer-github-link"
              href={profile.socials.github}
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className={s.social}
            >
              <Github size={18} strokeWidth={1.6} aria-hidden="true" />
            </a>
            <a
              data-testid="footer-email-link"
              href={`mailto:${profile.email}`}
              aria-label="Email"
              className={s.social}
            >
              <Mail size={18} strokeWidth={1.6} aria-hidden="true" />
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
};
