import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#121212',
        surface: {
          DEFAULT: '#1E1E1E',
          light: '#1A1A1A',
        },
        borderMuted: '#2D2D2D',
        textPrimary: '#E0E0E0',
        textSecondary: 'rgba(255,255,255,0.6)',
        textDisabled: 'rgba(255,255,255,0.38)',
        primary: {
          DEFAULT: '#BB86FC',
          dark: '#9C6BDF',
          light: '#C79CFF',
        },
        tealAccent: '#14B8A6',
      },
      keyframes: {
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-out-scale': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '100% 0' },
        },
      },
      animation: {
        'modal-in': 'fade-in-scale 0.2s ease-out',
        'modal-out': 'fade-out-scale 0.15s ease-in',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
} satisfies Config; 