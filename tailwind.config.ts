/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0F172A',
          800: '#1E293B',
        },
      },
      borderRadius: {
        '3xl': '32px',
        '4xl': '40px',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
