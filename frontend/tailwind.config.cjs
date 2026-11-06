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
        kodemono: ['"Kode Mono"', "monospace"],
        display: ["Rajdhani", "sans-serif"],
      },
      // Two channel tokens; <alpha-value> lets `text-ink/65` use the same CSS
      // variable as the raw CSS, so a theme flip is one attribute.
      colors: {
        ink: "rgb(var(--ink) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
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
