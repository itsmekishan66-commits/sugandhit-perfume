/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./Components/**/*.{js,ts,jsx,tsx}",
    "./Context/**/*.{js,ts,jsx,tsx}",
    "./Pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#faf6f0',
        ink: '#2b1d16',
        'ink-soft': '#5c4a3f',
        sand: '#f1e8dc',
        blush: '#e8efe9',
        gold: '#c9a227',
        'gold-soft': '#e6c96b',
        espresso: '#6f3b2b',
        deep: '#1a110c',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        sans: ['Jost', 'sans-serif'],
      },
      letterSpacing: {
        luxe: '0.28em',
      },
    },
  },
  plugins: [],
}