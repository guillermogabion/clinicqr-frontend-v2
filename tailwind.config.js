/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef9ff',
          100: '#d8f1ff',
          200: '#b9e8ff',
          300: '#88daff',
          400: '#50c3ff',
          500: '#28a6ff',
          600: '#0d87f5',
          700: '#0d6fe1',
          800: '#1259b5',
          900: '#144d8e',
          950: '#112f57',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
