/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        ghost: {
          900: '#F8FAFC', // Layout Background
          800: '#FFFFFF', // Card Background
          700: '#F1F5F9', // Subtle Backgrounds
          600: '#E2E8F0', // Borders
          500: '#94A3B8', // Muted Text
          400: '#64748B', // Secondary Text
          300: '#475569', // Gray Text
          200: '#1E293B', // Heading Text
          100: '#0F172A', // Darkest Text
          accent: '#2563eb', // Core Blue
          'accent-light': '#60a5fa',
          'accent-glow': 'rgba(37, 99, 235, 0.15)',
          gold: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ghost-gradient': 'linear-gradient(135deg, #2563eb 0%, #3b82f6 60%, #60a5fa 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px #3b82f655' },
          '50%': { boxShadow: '0 0 24px #3b82f699' },
        },
      },
    },
  },
  plugins: [],
};

