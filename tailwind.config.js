/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: {
          main: '#0a0f1e',
          card: '#111827',
          secondary: '#1a2235',
          input: '#1f2937',
          hover: '#243044',
        },
        // Accent
        brand: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          glow: 'rgba(59,130,246,0.3)',
        },
        gold: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          crown: '#fbbf24',
        },
        vip: {
          from: '#7c3aed',
          to: '#4f46e5',
        },
        // Text
        ink: {
          primary: '#f9fafb',
          secondary: '#9ca3af',
          muted: '#6b7280',
          link: '#60a5fa',
        },
        // Semantic
        success: '#22c55e',
        warning: '#fbbf24',
        error: '#ef4444',
        danger: '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59,130,246,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(59,130,246,0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'progress-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'progress-shimmer': 'progress-shimmer 1.5s linear infinite',
        'status-pulse': 'status-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
