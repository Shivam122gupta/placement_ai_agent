/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff1f0',
          100: '#ffe4e1',
          200: '#ffc8c4',
          300: '#ffa29b',
          400: '#ff7e67',
          500: '#ff6b6b',
          600: '#fa7268',
          700: '#e0564c',
          800: '#b93f36',
          900: '#98352e',
        },
        salmon: {
          light: '#FFA07A',
          DEFAULT: '#FA8072',
          dark: '#E9967A',
        },
        brand: {
          50: '#fff1f0',
          100: '#ffe4e1',
          200: '#ffc8c4',
          300: '#ffa29b',
          400: '#ff7e67',
          500: '#ff6b6b',
          600: '#fa7268',
          700: '#e0564c',
          800: '#b93f36',
          900: '#98352e',
          950: '#521410',
        },
        obsidian: {
          bg: '#090708',
          card: '#120B0D',
          surface: '#180F12',
          border: 'rgba(255, 107, 107, 0.15)',
        },
        dark: {
          bg: '#090708',
          card: '#120B0D',
          border: '#241417',
          muted: '#A89698',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
