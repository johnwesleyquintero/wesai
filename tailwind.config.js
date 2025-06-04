/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
    './App.tsx',
    './LoginPage.tsx',
    './types.ts', // Added types.ts
  ],
  darkMode: 'class', // Ensure class-based dark mode is enabled
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};
