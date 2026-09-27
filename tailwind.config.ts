import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--color-bg)",
          surface: "var(--color-surface)",
          "surface-raised": "var(--color-surface-raised)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        token: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        action: {
          DEFAULT: "var(--color-action)",
          hover: "var(--color-action-hover)",
          fg: "var(--color-action-fg)",
        },
        highlight: {
          DEFAULT: "var(--color-highlight)",
          fg: "var(--color-highlight-fg)",
          subtle: "var(--color-highlight-subtle)",
        },
        feedback: {
          success: "var(--color-success)",
          "success-subtle": "var(--color-success-subtle)",
          error: "var(--color-error)",
          "error-subtle": "var(--color-error-subtle)",
        },
        brand: {
          navy: {
            DEFAULT: "#0A1124",
            dark: "#0A1124",
            slate: "#12223B",
            petrol: "#0E3B4F",
          },
          orange: {
            DEFAULT: "#E88607",
            rust: "#B5500C",
            amber: "#CD6E10",
            gold: "#E88607",
          },
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      fontFamily: {
        sans: [
          "var(--font-cairo)",
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        cairo: ["var(--font-cairo)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
