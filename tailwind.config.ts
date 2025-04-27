import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED', // purple
          dark: '#5B21B6',
          light: '#A78BFA',
        },
        tealAccent: '#14B8A6',
      },
    },
  },
  plugins: [],
} satisfies Config; 