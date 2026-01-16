/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Cairo',
          'Tajawal',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'Noto Sans',
          'sans-serif',
        ],
        serif: ['Amiri', 'serif'],
      },
      colors: {
        ink: {
          50: '#f4f7ff',
          100: '#e8efff',
          200: '#ccdaff',
          300: '#a3baff',
          400: '#7190ff',
          500: '#4766ff',
          600: '#2f44f5',
          700: '#2436c8',
          800: '#1f2f9e',
          900: '#1c2a7d',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
}

