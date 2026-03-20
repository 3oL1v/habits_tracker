import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#fff8f7",
          100: "#fceeed",
          200: "#f6dbd8",
          300: "#efc7c0",
          400: "#e4ada4",
          500: "#d7948d"
        },
        stone: {
          950: "#1f1a18"
        }
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 40px rgba(95, 74, 67, 0.08)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
