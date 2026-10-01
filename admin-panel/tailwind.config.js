/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: '#030304',
          900: '#070709',
          800: '#0d0e12',
          700: '#14161d',
          600: '#1e212b',
        },
        crimson: {
          500: '#ff2a2a',
          600: '#ef4444',
          700: '#dc2626',
          800: '#b91c1c',
          900: '#991b1b',
        }
      }
    },
  },
  plugins: [],
}
