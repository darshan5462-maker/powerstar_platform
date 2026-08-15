/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed', 100: '#ffedd5', 200: '#fed7aa',
          300: '#fdba74', 400: '#fb923c', 500: '#f97316',
          600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
        },
        surface: {
          light: { DEFAULT: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1' },
          dark:  { DEFAULT: '#0f172a', 50: '#1e293b', 100: '#334155', 200: '#475569', 300: '#64748b' },
        }
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.08)',
        'glass-dark': '0 8px 32px rgba(0,0,0,0.4)',
        'brand': '0 4px 24px rgba(249,115,22,0.3)',
        'card':  '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-dark': '0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease-out',
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'float':     'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { '0%': { opacity:'0', transform:'translateY(12px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn:   { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideIn:  { '0%': { opacity:'0', transform:'translateX(-12px)' }, '100%': { opacity:'1', transform:'translateX(0)' } },
        pulseDot: { '0%,100%': { transform:'scale(1)', opacity:'1' }, '50%': { transform:'scale(1.5)', opacity:'0.5' } },
        float:    { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-8px)' } },
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
    },
  },
  plugins: [],
}
