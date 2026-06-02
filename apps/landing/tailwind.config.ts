import type { Config } from "tailwindcss";

/**
 * [STAMPED_AGENTS_TAILWIND] Apple-gallery refresh — 2026-05-08.
 * Mirrored in `app/globals.css` and DESIGN.md §4-5, §15.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-aligned scale
        canvas: "#FFFFFF",
        snow: "#FFFFFF",
        fog: "#F5F5F7",
        "silver-mist": "#E8E8ED",
        ink: "#1D1D1F",
        slate: "#474747",
        graphite: "#707070",
        ash: "#8F8F8F",
        obsidian: "#000000",
        // [STAMPED_AGENTS_WAVE2] azure is now a *micro-accent* only (focus rings,
        // selection highlight, ≤6px status dots). It is NOT used for primary
        // CTAs, badges, lead-capture, pricing, or state colors. See DESIGN.md §4.
        azure: "#0071E3",
        "cobalt-link": "#0066CC",
        vellum: "#FAFAF8",
        night: "#0E0D0B",

        // Legacy aliases preserved so existing utilities still resolve.
        paper: "#FFFFFF",
        "ink-2": "#2C2925",
        brass: "#1D1D1F",
        "brass-2": "#707070",
        // [STAMPED_AGENTS_WAVE2] `signal` retained as an azure alias for the
        // focus-ring utility; not used for fills, badges, or states.
        signal: "#0071E3",
        wax: "#F5F5F7"
      },
      fontFamily: {
        sans: ["Inter Display", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "10px",          // Apple smallButtons
        DEFAULT: "10px",
        lg: "14px",
        "2xl": "28px",       // Apple feature card
        "3xl": "28px"
      },
      letterSpacing: {
        display: "-0.022em",
        tightest: "-0.022em",
        tighter: "-0.016em",
        tight: "-0.010em"
      },
      maxWidth: {
        content: "1200px"
      },
      fontSize: {
        "apple-display": ["96px", { lineHeight: "1.04", letterSpacing: "-0.022em" }],
        "apple-heading-lg": ["56px", { lineHeight: "1.07", letterSpacing: "-0.016em" }],
        "apple-heading": ["40px", { lineHeight: "1.17", letterSpacing: "-0.015em" }],
        "apple-subheading": ["20px", { lineHeight: "1.4", letterSpacing: "-0.010em" }],
        "apple-body": ["17px", { lineHeight: "1.47", letterSpacing: "-0.003em" }]
      }
    },
  },
  plugins: [],
};

export default config;
