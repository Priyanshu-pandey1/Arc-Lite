/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        app: {
          bg: '#080612',
          surface: '#0f0a21',
          card: '#160f2e',
          border: '#231846',
          input: '#181232',
          hover: '#241a47',
          pill: '#1e173a',
          accent: '#7c3aed',
          accentHover: '#6d28d9',
          muted: '#94a3b8',
          text: '#f8fafc',
        },
      },
      keyframes: {
        messageIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        message: 'messageIn 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}
