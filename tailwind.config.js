/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF4F0',
          100: '#FFE5D9',
          200: '#FFC4AE',
          300: '#FF9B7A',
          400: '#FF6B42',
          500: '#FD3C01', // Your chosen color (Hover & Focus states)
          600: '#E63500', // Primary Brand Color (Buttons & Prices)
          700: '#BF2C00',
          800: '#992300',
          900: '#7A1C00',
        },
        cream: {
          DEFAULT: '#FAF7F2',
          soft:    '#F2EDE4',
          line:    '#E7E2DA',
        },
        ink: {
          DEFAULT: '#1C1917',
          muted:   '#78716C',
        },
        night: {
          DEFAULT: '#1A1614',
          surface: '#241F1C',
          line:    '#35302B',
        },
      },
      fontFamily: {
        sans:    ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Roketto', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.04), 0 4px 12px rgba(28,25,23,0.06)',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'fade-in':  'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};