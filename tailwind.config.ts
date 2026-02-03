import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#020617",
        navy: {
          900: "#020617",
          800: "#0f172a",
          700: "#1e293b",
        },
        emerald: {
          500: "#10b981",
          400: "#34d399",
        },
      },
      backgroundImage: {
        'glass-gradient': "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
      },
    },
  },
  plugins: [],
};
export default config;