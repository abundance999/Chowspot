/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    screens: {
      'xs': '360px',  // Extra small screens (mobile phones)
      'sm': '640px',  // Small screens (tablets)
      'md': '768px',  // Medium screens
      'lg': '1024px', // Large screens
      'xl': '1280px', // Extra large screens
    },
    extend: {
      colors: {
        // ChowSpot brand — deep food-red, warm and appetizing
        brand: {
          50:  '#fff4f1',
          100: '#ffe6df',
          200: '#ffc9bb',
          300: '#ffa08a',
          400: '#ff6b4a',
          500: '#f94920',
          600: '#e8420f', // ← primary action color
          700: '#c03508',
          800: '#9d2d0a',
          900: '#81290f',
        },
      },
      fontFamily: {
        // Plus Jakarta Sans — modern, premium, distinctive
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      spacing: {
        'safe': 'max(1rem, env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
};
