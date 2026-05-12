/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,md,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './theme.config.tsx',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary: #00ADD8 (Go Blue)
        primary: {
          50: '#e6f7fb',
          100: '#cceff7',
          200: '#99dfee',
          300: '#66cfe6',
          400: '#33bfdd',
          500: '#00ADD8',
          600: '#008bb0',
          700: '#006988',
          800: '#004760',
          900: '#002538',
          950: '#001319',
        },
        // Accent: #00C853 (Success Green)
        accent: {
          50: '#e6f9ed',
          100: '#ccf3db',
          200: '#99e7b7',
          300: '#66db93',
          400: '#33cf6f',
          500: '#00C853',
          600: '#00a042',
          700: '#007832',
          800: '#005021',
          900: '#002811',
          950: '#001408',
        },
        // Warning: #FFC107 (Amber/Yellow)
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFC107',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Semantic colors (single values for direct use)
        success: '#00C853',
        error: '#FF1744',
        info: '#00ADD8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'particle-float': 'particleFloat 60s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        particleFloat: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '100%': { transform: 'translateY(-100px) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
