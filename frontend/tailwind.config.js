/** @type {import('tailwindcss').Config} */
module.exports = {
    blocklist: ["overline"],
    darkMode: ['selector', "[data-theme='dark']"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        kodemono: ['"Kode Mono"', 'monospace'],
        display: ['Rajdhani', 'sans-serif'],
      },
      // The whole palette is two channel-triplet tokens plus their alphas.
      // <alpha-value> lets `text-ink/65` and `border-ink/10` resolve against
      // the same variable the raw CSS uses, so a theme flip is one attribute.
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' }
        },
        kenburns: {
          from: { transform: 'scale(1) translate(0, 0)' },
          to: { transform: 'scale(1.18) translate(-2%, -2%)' }
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 48s linear infinite',
        kenburns: 'kenburns 16s ease-in-out infinite alternate',
        'pulse-dot': 'pulse-dot 2.2s ease-in-out infinite'
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
