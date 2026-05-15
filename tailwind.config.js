/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: '#E8A020',
          light: '#F5C842',
          pale: '#FDF3DC',
          dark: '#C8880E',
        },
        vuka: {
          green: '#2D6E35',
          'green-light': '#4A9A54',
          'green-pale': '#EAF3DE',
          cream: '#F5F5E8',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

