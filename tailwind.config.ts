import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#14532D",
        "forest-2": "#1B6B3A",
        paper: "#FFFFFF",
        lime: "#84CC16",
        "lime-dark": "#4D7C0F",
        leaf: "#16A34A",
        rule: "#DCE7DC",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
