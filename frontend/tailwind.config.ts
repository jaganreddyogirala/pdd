import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#07090e",
        foreground: "#f3f4f6",
        card: {
          DEFAULT: "rgba(18, 24, 38, 0.7)",
          hover: "rgba(28, 38, 59, 0.85)",
        },
        primary: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          glow: "rgba(59, 130, 246, 0.35)",
        },
        accent: {
          cyan: "#06b6d4",
          purple: "#8b5cf6",
          emerald: "#10b981",
        },
      },
      borderRadius: {
        lg: "22px",
        md: "14px",
        sm: "8px",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
