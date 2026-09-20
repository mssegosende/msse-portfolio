import { useState } from "react";
import { motion } from "framer-motion";
import { terminalBoot } from "../data/portfolioData";
import { GridField } from "./GridField";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  }),
};

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api/contact`;

const validate = ({ name, email, message }) => {
  if (name.trim().length < 2) return "ERR: name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "ERR: invalid email format";
  if (message.trim().length < 10) return "ERR: message must be at least 10 characters";
  return null;
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-ink/[0.13] bg-ink/[0.03] px-4 py-3 font-kodemono text-sm text-ink placeholder:text-ink/65 outline-none transition-[border-color,box-shadow] duration-300 focus:border-ink/50 focus:shadow-[0_0_20px_rgb(var(--ink) / 0.07)]";

export const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", website: "" });
  const [lines, setLines] = useState([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pushLine = (text, kind = "out") =>
    setLines((prev) => [...prev, { text, kind }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const error = validate(form);
    if (error) {
      pushLine(error, "err");
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
        setForm({ name: "", email: "", company: "", message: "", website: "" });
      } else if (res.status === 429) {
        pushLine("[ERR] RATE LIMIT — too many transmissions. Try again later.", "err");
      } else {
        pushLine(`[ERR] TRANSMISSION FAILED — server responded ${res.status}.`, "err");
      }
    } catch {
      pushLine("[ERR] NETWORK OFFLINE — message not sent. Try again.", "err");
    } finally {
      setSending(false);
    }
  };

  const lineColor = { cmd: "text-ink/[0.83]", out: "text-ink/65", ok: "text-ink", err: "text-ink/65" };

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
          variants={fadeUp} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-[13px] uppercase tracking-[0.02em] text-ink"
        >
          05 // OPEN CHANNEL
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="text-engraved mt-6 font-display font-light text-3xl uppercase text-ink sm:text-4xl lg:text-5xl"
        >
          Initiate contact
        </motion.h2>

        <motion.div
          variants={fadeUp} custom={2} initial="hidden" whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
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

              <label className="block">
                <span className="text-ink">&gt; name:</span>
                <input
                  data-testid="contact-name-input"
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="your name"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-ink">&gt; email:</span>
                <input
                  data-testid="contact-email-input"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@domain.com"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-ink">&gt; company <span className="text-ink/65">(optional):</span></span>
                <input
                  data-testid="contact-company-input"
                  type="text"
                  value={form.company}
                  onChange={set("company")}
                  placeholder="organization / studio"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="text-ink">&gt; message:</span>
                <textarea
                  data-testid="contact-message-input"
                  value={form.message}
                  onChange={set("message")}
                  placeholder="describe your project, timeline, scope…"
                  rows={4}
                  className={`${inputClass} resize-none`}
                />
              </label>

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
            </form>

            {lines.length > 0 && (
              <div data-testid="contact-status-lines" className="mt-6 space-y-1.5 border-t border-ink/[0.13] pt-5">
                {lines.map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={lineColor[line.kind]}
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
