/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        slack: {
          purple: '#3F0E40',
          'purple-dark': '#350d36',
          blue: '#1164A3',
          'blue-hover': '#0F5C96',
          active: '#1164A3',
        }
      },
    },
  },
  plugins: [],
}