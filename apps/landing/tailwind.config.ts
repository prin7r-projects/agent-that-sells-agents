import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F4EFE6",
        ink: "#161513",
        "ink-2": "#2C2925",
        graphite: "#3F3B36",
        brass: "#A88646",
        "brass-2": "#C9A35E",
        signal: "#1F4FE0",
        "signal-2": "#3766F0",
        vermilion: "#B5331A",
        wax: "#E9E0CF",
        vellum: "#FBF7EE",
        night: "#0E0D0B",
      },
      fontFamily: {
        sans: ["Inter Display", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
      },
      letterSpacing: {
        tightest: "-0.02em",
        tighter: "-0.01em",
      },
      maxWidth: {
        content: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
