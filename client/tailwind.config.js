/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],
        'xs': ['0.875rem', { lineHeight: '1.25rem' }],
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'md': ['1.0625rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      colors: {
        app: {
          bg: '#090909',
          secondary: '#101010',
          sidebar: '#101010',
          content: '#090909',
          surface: '#171717',
          elevated: '#202020',
          hover: '#282828',
          border: '#303030',
          'border-subtle': '#202020',
          text: '#F5F5F5',
          'text-secondary': '#A3A3A3',
          secondaryText: '#A3A3A3',
          muted: '#777777',
          btn: '#F5F5F5',
          'btn-text': '#090909',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
