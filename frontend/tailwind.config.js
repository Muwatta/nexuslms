/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cool: {
          light: "#B2F7EF",
          DEFAULT: "#69D2E7",
          dark: "#07689F",
        },
      },
    },
  },
  plugins: [],
};
