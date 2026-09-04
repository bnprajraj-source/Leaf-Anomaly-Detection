/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        leaf: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        forest: {
          dark:  '#0d1f12',
          mid:   '#1a3320',
          light: '#234d2e',
        },
        accent: {
          gold:   '#d4a017',
          amber:  '#f59e0b',
          danger: '#ef4444',
          info:   '#3b82f6',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'leaf-gradient': 'linear-gradient(135deg, #0d1f12 0%, #1a3320 50%, #234d2e 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan':       'scan 2s linear infinite',
        'fadeIn':     'fadeIn 0.5s ease-in-out',
        'slideUp':    'slideUp 0.4s ease-out',
        'slideDown':  'slideDown 0.3s ease-out',
        'scaleIn':    'scaleIn 0.3s ease-out',
        'float':      'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 8s ease-in-out infinite',
        'shimmer':    'shimmer 3s ease-in-out infinite',
        'glow':       'glow 3s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
      },
      keyframes: {
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%':      { transform: 'translateY(-15px) rotate(5deg)' },
          '50%':      { transform: 'translateY(-5px) rotate(-3deg)' },
          '75%':      { transform: 'translateY(-20px) rotate(3deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%':      { transform: 'translateY(-12px) rotate(8deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.1)' },
          '50%':      { boxShadow: '0 0 40px rgba(74, 222, 128, 0.25)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(74, 222, 128, 0.15)',
        'glow-md': '0 0 25px rgba(74, 222, 128, 0.2)',
        'glow-lg': '0 0 40px rgba(74, 222, 128, 0.25)',
        'glow-xl': '0 0 60px rgba(74, 222, 128, 0.3), 0 0 100px rgba(74, 222, 128, 0.1)',
        'card-hover': '0 20px 40px -12px rgba(0, 0, 0, 0.4), 0 0 20px rgba(74, 222, 128, 0.08)',
        'hero': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'leaf-gradient': 'linear-gradient(135deg, #0d1f12 0%, #1a3320 50%, #234d2e 100%)',
        'leaf-gradient-radial': 'radial-gradient(circle at center, rgba(74, 222, 128, 0.1) 0%, transparent 70%)',
        'hero-gradient': 'linear-gradient(135deg, #0d1f12 0%, #1a3320 30%, #234d2e 60%, #0d1f12 100%)',
      },
    },
  },
  plugins: [],
}
