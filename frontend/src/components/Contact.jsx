import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUpVariants, revealOnView } from "../lib/motion";
import { terminalBoot } from "../data/portfolioData";
import { GridField } from "./GridField";

const fadeUp = fadeUpVariants({ stagger: 0.1 });

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/contact`;

const validate = ({ name, email, message }) => {
  if (name.trim().length < 2) return "ERR: name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "ERR: invalid email format";
  if (message.trim().length < 10) return "ERR: message must be at least 10 characters";
  return null;
};

// Errors are notices, not transcript: one entry per message, kept apart from
// the log. Resubmitting the same invalid field restarts its timer instead of
// stacking another copy.
const ERROR_TTL = 4200;

const EMPTY_FORM = { name: "", email: "", company: "", message: "", website: "" };

const LINE_COLOR = { cmd: "text-ink/[0.83]", out: "text-ink/65", ok: "text-ink" };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-ink/[0.13] bg-ink/[0.03] px-4 py-3 font-kodemono text-sm text-ink placeholder:text-ink/65 outline-none transition-[border-color,box-shadow] duration-300 focus:border-ink/50 focus:shadow-[0_0_20px_rgb(var(--ink) / 0.07)]";

// One terminal prompt: "> label:" over its input (or textarea).
const TerminalField = ({ label, hint, multiline = false, ...field }) => (
  <label className="block">
    <span className="text-ink">
      &gt; {label}
      {hint ? (
        <>
          {" "}
          <span className="text-ink/65">{hint}:</span>
        </>
      ) : (
        ":"
      )}
    </span>
    {multiline ? (
      <textarea rows={4} className={`${inputClass} resize-none`} {...field} />
    ) : (
      <input type="text" className={inputClass} {...field} />
    )}
  </label>
);

export const Contact = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  // One timer per message, so two errors expire independently.
  const errorTimers = useRef(new Map());

  useEffect(() => {
    const timers = errorTimers.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pushLine = (text, kind = "out") =>
    setLines((prev) => [...prev, { text, kind }]);

  const showError = (text) => {
    setErrors((prev) => (prev.some((x) => x.text === text) ? prev : [...prev, { text }]));
    const timers = errorTimers.current;
    clearTimeout(timers.get(text));
    timers.set(
      text,
      setTimeout(() => {
        timers.delete(text);
        setErrors((prev) => prev.filter((x) => x.text !== text));
      }, ERROR_TTL)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const error = validate(form);
    if (error) {
      showError(error);
      return;
    }

    setSending(true);
    pushLine("$ transmit --channel=secure …", "cmd");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        pushLine("[OK] MESSAGE TRANSMITTED — I'll get back to you within 24h.", "ok");
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

  return (
    <section
      id="contact"
      data-testid="contact-section"
      className="relative overflow-hidden bg-surface px-4 py-24 sm:px-8 md:px-12 md:py-36 lg:px-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgb(var(--ink) / 0.04),transparent_60%)]" />
      <GridField />
      <div className="relative mx-auto max-w-4xl">
        <motion.p
          variants={fadeUp}
          {...revealOnView()}
          className="font-display text-[13px] uppercase tracking-[0.02em] text-ink"
        >
          05 // OPEN CHANNEL
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1}
          {...revealOnView()}
          className="text-engraved mt-6 font-display font-light text-3xl uppercase text-ink sm:text-4xl lg:text-5xl"
        >
          Initiate contact
        </motion.h2>

        <motion.div
          variants={fadeUp} custom={2}
          {...revealOnView()}
          data-testid="contact-terminal"
          className="corner-frame cut-corner mt-14 overflow-hidden border border-ink/[0.13] bg-ink/[0.04]/90 shadow-[0_0_80px_rgb(var(--ink) / 0.03)] backdrop-blur-xl"
        >
          {/* terminal chrome */}
          <div className="flex items-center gap-2 border-b border-ink/[0.13] px-5 py-3.5">
            <span className="h-3 w-3 rounded-full bg-ink/20" />
            <span className="h-3 w-3 rounded-full bg-ink/[0.33]" />
            <span className="h-3 w-3 rounded-full bg-ink/[0.47]" />
            <span className="ml-4 font-kodemono text-[13px] tracking-wider text-ink/65">
              msg@portfolio: ~/contact — zsh
            </span>
          </div>

          <div className="p-6 font-kodemono text-[13px] leading-relaxed sm:p-8">
            {terminalBoot.map((line, i) => (
              <p key={i} className={line.type === "cmd" ? "text-ink/[0.83]" : "text-ink/65"}>
                {line.type === "cmd" ? `$ ${line.text}` : line.text}
              </p>
            ))}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <p className="text-ink/[0.83]">$ contact --send --secure</p>

              <TerminalField
                label="name"
                data-testid="contact-name-input"
                value={form.name}
                onChange={set("name")}
                placeholder="your name"
              />
              <TerminalField
                label="email"
                type="email"
                data-testid="contact-email-input"
                value={form.email}
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
                label="message"
                multiline
                data-testid="contact-message-input"
                value={form.message}
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
                className="group relative w-full border border-ink/30 bg-ink/5 px-6 py-4 font-display text-[13px] uppercase tracking-[0.02em] text-ink transition-[background-color,box-shadow,color] duration-300 hover:bg-ink hover:text-surface hover:shadow-[0_0_40px_rgb(var(--ink) / 0.25)] disabled:cursor-wait disabled:opacity-50"
              >
                {sending ? "Transmitting…" : done ? "Transmit again" : "Transmit message"}
              </button>

              {/* Hidden with :empty rather than errors.length: the array is
                  already empty while the last line fades out, and a JS
                  condition would unmount it mid-animation. */}
              <div data-testid="contact-errors" className="space-y-1.5 empty:hidden">
                <AnimatePresence>
                  {errors.map((err) => (
                    <motion.p
                      key={err.text}
                      role="alert"
                      data-testid="contact-error"
                      className="text-ink/65"
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
              <div data-testid="contact-status-lines" className="mt-6 space-y-1.5 border-t border-ink/[0.13] pt-5">
                {lines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={LINE_COLOR[line.kind]}
                  >
                    {line.text}
                  </motion.p>
                ))}
                <span className="terminal-caret text-ink/65" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
