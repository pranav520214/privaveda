/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './three/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F2EB',
        paper: '#EEEAE1',
        ink: '#111513',
        graphite: '#343B38',
        muted: '#7A817D',
        teal: {
          DEFAULT: '#1E6861',
          dark: '#0B332F',
          soft: '#AFCAC4',
        },
        comp: {
          bg: '#06100E',
          panel: '#0C1816',
          border: 'rgba(175, 202, 196, 0.12)',
        },
        hairline: 'rgba(17, 21, 19, 0.14)',
        'hairline-dark': 'rgba(255, 255, 255, 0.10)',
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Geist Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
    },
  },
  plugins: [],
};
