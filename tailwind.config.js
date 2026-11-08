/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Bringova Warm Coral / Terracotta primary accent (THE LILA BAN compliant, <80% saturation feel)
        primary: {
          50: '#FDF3F2',
          100: '#FCE7E5',
          200: '#F9CFCB',
          300: '#F3ABA4',
          400: '#EA7B71',
          500: '#E14D43',
          600: '#CC3B31',
          700: '#AB2E26',
          800: '#8D2923',
          900: '#752722',
          950: '#40100D',
        },
        canvas: {
          light: '#FDF8F6',
          subtle: '#F8EFEA',
          dark: '#0C0D10',
          darkElevated: '#13151A',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(24, 24, 27, 0.04), 0 2px 6px -1px rgba(24, 24, 27, 0.02)',
        elevated: '0 14px 34px -6px rgba(24, 24, 27, 0.08), 0 4px 12px -2px rgba(24, 24, 27, 0.04)',
        pop: '0 20px 44px -10px rgba(225, 77, 67, 0.14), 0 6px 16px -4px rgba(24, 24, 27, 0.06)',
      },
    },
  },
  plugins: [],
}
