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
        white: '#ffffff',
        blue: {
          50: '#f0f4ef',
          100: '#d7e2d4',
          200: '#b2c7ab',
          300: '#85a47c',
          400: '#5e8253',
          500: '#3b5034',
          600: '#2d3e28',
          700: '#23301f',
          800: '#192216',
          900: '#0f140d',
          950: '#080a06',
        },
        gray: {
          50: '#f9f9f8',
          100: '#f2f0ea',
          200: '#ede8de',
          300: '#d4cebf',
          400: '#b5ae9c',
          500: '#948d79',
          600: '#736b56',
          700: '#5c5443',
          800: '#3b5034',
          900: '#293624',
          950: '#1e261a',
        },
        slate: {
          50: '#f9f9f8',
          100: '#f2f0ea',
          200: '#ede8de',
          300: '#d4cebf',
          400: '#b5ae9c',
          500: '#948d79',
          600: '#736b56',
          700: '#5c5443',
          800: '#3b5034',
          900: '#293624',
          950: '#1e261a',
        },
        primary: {
          50: '#f0f4ef',
          100: '#d7e2d4',
          200: '#b2c7ab',
          300: '#85a47c',
          400: '#5e8253',
          500: '#3b5034',
          600: '#2d3e28',
          700: '#23301f',
          800: '#192216',
          900: '#0f140d',
        },
        ghost: {
          900: '#ede8de', // Layout Background
          800: '#ede8de', // Card Background
          700: '#d4cebf', // Subtle Backgrounds
          600: '#b5ae9c', // Borders
          500: '#948d79', // Muted Text
          400: '#736b56', // Secondary Text
          300: '#5c5443', // Gray Text
          200: '#3b5034', // Heading Text
          100: '#293624', // Darkest Text
          accent: '#3b5034', // Core
          'accent-light': '#5e8253',
          'accent-glow': 'rgba(59, 80, 52, 0.15)',
          gold: '#F59E0B',
          success: '#10B981',
          danger: '#EF4444',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'ghost-gradient': 'linear-gradient(135deg, #3b5034 0%, #5e8253 60%, #85a47c 100%)',
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
          '0%, 100%': { boxShadow: '0 0 8px #5e825355' },
          '50%': { boxShadow: '0 0 24px #5e825399' },
        },
      },
    },
  },
  plugins: [],
};

