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
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
        "primary": "var(--shadow-primary)",
      },
      borderRadius: {
        xs:     "var(--r-xs)",
        sm:     "var(--r-sm)",
        md:     "var(--r-md)",
        DEFAULT: "var(--r-md)",
        lg:     "var(--r-lg)",
        xl:     "var(--r-xl)",
        "2xl":  "var(--r-2xl)",
        full:   "var(--r-full)",
      },
      backdropBlur: {
        xs:   "4px",
        sm:   "8px",
        md:   "12px",
        lg:   "var(--glass-blur)",
        xl:   "40px",
        "2xl": "64px",
      },
      transitionTimingFunction: {
        spring: "var(--motion-spring)",
        smooth: "var(--motion-smooth)",
        snap:   "var(--motion-snap)",
        bounce: "var(--motion-bounce)",
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        normal: "var(--motion-duration)",
        slow: "var(--motion-slow)",
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
        "enter-fade": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "exit-fade": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(4px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
        "enter-fade": "enter-fade 0.4s cubic-bezier(0.2, 0, 0, 1) both",
        "exit-fade": "exit-fade 0.2s cubic-bezier(0.25, 0.1, 0.25, 1) both",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
