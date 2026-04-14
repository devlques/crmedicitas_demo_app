import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#0B2C4D",
          700: "#092440",
          800: "#071d34",
        },
        teal: {
          50:  "#e8f8f4",
          100: "#c8eee6",
          DEFAULT: "#3FBFA0",
          500: "#3FBFA0",
          600: "#3FBFA0",
          700: "#33a085",
        },
      },
    },
  },
  plugins: [],
};

export default config;
