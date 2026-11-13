/** @type {import('tailwindcss').Config} */
module.exports = {
  blocklist: ["overline"],
  darkMode: ["selector", "[data-theme='dark']"],
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        michroma: ["Michroma", "sans-serif"],
        gothic: ['"Science Gothic"', "Michroma", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        inter: ["Inter", "sans-serif"],
        display: ["Rajdhani", "sans-serif"],
        // CRT redesign: HUD labels, data rows, buttons, rails.
        vt: ["VT323", "monospace"],
      },
      // Two channel tokens; <alpha-value> lets `text-ink/65` use the same CSS
      // variable as the raw CSS, so a theme flip is one attribute.
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        // The STATUS dots: the phosphor, like the rest (María Sol, 13 Nov: no pink;
        // the dots themselves use .crt-status-dot, index.css).
        status: "var(--crt-phosphor)",
        // CRT redesign tokens (index.css); hex values, so no /alpha modifiers.
        crt: {
          bg: "var(--crt-bg)",
          core: "var(--crt-core)",
          title: "var(--crt-title)",
          text: "var(--crt-text)",
          "text-2": "var(--crt-text-2)",
          dim: "var(--crt-dim)",
          phosphor: "var(--crt-phosphor)",
          node: "var(--crt-node)",
          line: "var(--crt-line)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        "scroll-cue": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(300%)" },
        },
      },
      animation: {
        marquee: "marquee 48s linear infinite",
        "pulse-dot": "pulse-dot 2.2s ease-in-out infinite",
        "scroll-cue": "scroll-cue 1.9s cubic-bezier(0.65, 0, 0.35, 1) infinite",
      },
    },
  },
  plugins: [],
};
