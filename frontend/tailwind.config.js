/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary, #6366F1)',
          primary: 'var(--brand-primary, #6366F1)',
          glow: 'var(--brand-glow, rgba(99, 102, 241, 0.35))',
        },
        dark: {
          950: '#06080D',
          900: '#0B0F19',
          850: '#0F1524',
          800: '#141C2E',
          700: '#1E293B',
          600: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 35px var(--brand-glow, rgba(99, 102, 241, 0.3))',
        'glow-lg': '0 0 60px var(--brand-glow, rgba(99, 102, 241, 0.35))',
        'glass': '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
        'card-3d': '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      }
    },
  },
  plugins: [],
}
