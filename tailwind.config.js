/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hk: {
          primary: '#ec4899',
          dark: '#0a0a12',
          card: '#12121f',
          border: 'rgba(255,255,255,0.1)',
        }
      }
    },
  },
  plugins: [],
}
