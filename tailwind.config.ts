import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './figma/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        /* ── Semantic tokens (CSS variable-backed) ── */
        bg:      "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          muted:   "var(--surface-muted)",
          dim:     "var(--surface-dim)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted:   "var(--text-muted)",
          faint:   "var(--text-faint)",
        },
        border:  "var(--border)",
        ring:    "var(--ring)",

        primary: {
          DEFAULT:    "var(--primary)",
          hover:      "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },

        success: "var(--success)",
        warning: "var(--warning)",
        danger:  "var(--danger)",
        info:    "var(--info)",

        /* ── shadcn/ui compat (HSL bridge) ── */
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        input: "hsl(var(--input))",
      },
      boxShadow: {
        sm:  "var(--shadow-sm)",
        md:  "var(--shadow-md)",
        lg:  "var(--shadow-lg)",
        xl:  "var(--shadow-xl)",
      },
      borderRadius: {
        sm:     "var(--r-sm)",
        md:     "var(--r-md)",
        DEFAULT: "var(--r-md)",
        lg:     "var(--r-lg)",
        xl:     "var(--r-xl)",
        full:   "var(--r-full)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
