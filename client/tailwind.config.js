/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // Use data-theme attribute for toggling (not class)
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // CSS variable-based tokens — values set in index.css per theme
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        border: 'var(--border)',
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        accent: {
          purple: '#7c6af7',
          blue:   '#5b8af5',
          green:  '#3ba55d',
          red:    '#ed4245',
          purple2:'#9d8ff7', // lighter variant for light mode
        },
        // Legacy aliases so old code still works
        bg: {
          primary:   'var(--surface-1)',
          secondary: 'var(--surface-2)',
          tertiary:  'var(--surface-3)',
          hover:     'var(--surface-4)',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:  '0 2px 16px 0 rgba(0,0,0,0.18)',
        float: '0 8px 32px 0 rgba(0,0,0,0.28)',
        glow:  '0 0 20px rgba(124,106,247,0.35)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
        'pulse-dot': 'pulseDot 1.4s infinite ease-in-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },                          to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)', opacity: 0.4 },
          '40%':           { transform: 'scale(1)', opacity: 1 },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
