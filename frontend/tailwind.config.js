import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060E18',
          900: '#0B1929',
          800: '#132337',
          700: '#1C3450',
          // Alias legacy (compatibilité composants existants)
          DEFAULT: '#0B1929',
          mid: '#132337',
        },
        teal: {
          500: '#1D9E75',
          400: '#2EBF8E',
          300: '#5DCAA5',
          100: '#E1F5EE',
          50: '#F0FAF6',
          // Alias legacy
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          mid: '#5DCAA5',
          dark: '#0F6E56',
          border: '#9FE1CB',
        },
        gray: {
          50: '#FAFAF8',
          100: '#F4F3EF',
          200: '#E8E7E3',
          400: '#B4B2A9',
          500: '#888780',
          700: '#5F5E5A',
          900: '#2C2C2A',
          // Alias legacy
          bg: '#F4F3EF',
          border: '#E8E7E3',
          muted: '#888780',
          text: '#2C2C2A',
          light: '#FAFAF8',
        },
        amber: { light: '#FAEEDA', DEFAULT: '#BA7517', dark: '#633806' },
      },
      fontFamily: {
        serif: ['"Crimson Pro"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)',
        'card-hover':
          '0 4px 24px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06)',
        teal: '0 0 0 1px rgba(29, 158, 117, 0.3), 0 4px 20px rgba(29, 158, 117, 0.15)',
        navy: '0 8px 40px rgba(6, 14, 24, 0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'shimmer-badge': {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'toast-progress': {
          '0%': { width: '100%' },
          '100%': { width: '0%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(-6deg)' },
          '50%': { transform: 'translate(0, -18px) rotate(-2deg)' },
        },
        scan: {
          '0%': { transform: 'translate3d(0, -4px, 0)', opacity: '0' },
          '6%': { opacity: '1' },
          '88%': { transform: 'translate3d(0, 168px, 0)', opacity: '1' },
          '96%': { transform: 'translate3d(0, 168px, 0)', opacity: '0' },
          '100%': { transform: 'translate3d(0, 168px, 0)', opacity: '0' },
        },
        'scan-fill': {
          '0%': { transform: 'scaleY(0)', opacity: '0.4' },
          '6%': { opacity: '1' },
          '88%': { transform: 'scaleY(1)', opacity: '1' },
          '96%': { transform: 'scaleY(1)', opacity: '0' },
          '100%': { transform: 'scaleY(0)', opacity: '0' },
        },
        'scan-glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.85' },
        },
        'line-read': {
          '0%, 100%': { opacity: '0.45', transform: 'scaleX(1)' },
          '12%, 28%': { opacity: '1', transform: 'scaleX(1)' },
        },
        'chip-scan': {
          '0%, 72%': { opacity: '0.88', transform: 'scale(1) translateY(0)' },
          '80%, 90%': { opacity: '1', transform: 'scale(1.04) translateY(-2px)' },
          '96%, 100%': { opacity: '0.88', transform: 'scale(1) translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(6px)' },
          '60%': { opacity: '1', transform: 'scale(1.04)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'dash-rotate': {
          to: { strokeDashoffset: '-20' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-50%, 0, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.5s linear infinite',
        'shimmer-badge': 'shimmer-badge 3s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'toast-progress': 'toast-progress linear forwards',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        drift: 'drift 11s ease-in-out infinite',
        scan: 'scan 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'scan-fill': 'scan-fill 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'scan-glow': 'scan-glow 1.4s ease-in-out infinite',
        'line-read': 'line-read 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'chip-scan': 'chip-scan 2.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        twinkle: 'twinkle 2.4s ease-in-out infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        'dash-rotate': 'dash-rotate 1s linear infinite',
        marquee: 'marquee 36s linear infinite',
      },
    },
  },
  plugins: [forms],
}
