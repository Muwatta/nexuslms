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
        primary: {
          light: "#D1FAE5",
          DEFAULT: "#10B981",
          dark: "#047857",
        },
        secondary: {
          light: "#E0F2FE",
          DEFAULT: "#0EA5E9",
          dark: "#0369A1",
        },
      },
    },
  },
  plugins: [],
};
