// tailwind.config.js

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  // ... other config ...
  theme: {
    extend: {
      fontFamily: {
        // Add 'Noto Sans' to the beginning of the default sans-serif font stack
        sans: ['Noto Sans', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};