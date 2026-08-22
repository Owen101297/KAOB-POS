/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // Escala brand derivada del verde Vendty #62cb31
        brand: {
          50: '#f3fced',
          100: '#e4f8d6',
          200: '#c9efb0',
          300: '#a5e37e',
          400: '#81d44f',
          500: '#62cb31', // verde Vendty original
          600: '#4aad21',
          700: '#39881a',
          800: '#306b1c',
          900: '#2a5a1c',
          950: '#13320b',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(15, 23, 42, 0.1), 0 2px 4px rgba(15, 23, 42, 0.04)',
        popover: '0 4px 6px -2px rgba(15, 23, 42, 0.03), 0 12px 24px -6px rgba(15, 23, 42, 0.12)',
        menu: '0 0 0 1px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.14)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(10px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'zoom-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slide-left 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'zoom-in': 'zoom-in 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
