/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
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
