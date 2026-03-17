import type { Config } from "tailwindcss"
import plugin from "tailwindcss/plugin"

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
        /* ── Existing semantic tokens (CSS variable-backed) ── */
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

        /* ── Design System tokens (--ds-*) ── */
        "ds-primary": {
          50:      "var(--ds-primary-50)",
          100:     "var(--ds-primary-100)",
          200:     "var(--ds-primary-200)",
          300:     "var(--ds-primary-300)",
          400:     "var(--ds-primary-400)",
          500:     "var(--ds-primary-500)",
          600:     "var(--ds-primary-600)",
          700:     "var(--ds-primary-700)",
          800:     "var(--ds-primary-800)",
          900:     "var(--ds-primary-900)",
          950:     "var(--ds-primary-950)",
          DEFAULT: "var(--ds-primary)",
        },
        "ds-secondary": {
          50:      "var(--ds-secondary-50)",
          100:     "var(--ds-secondary-100)",
          200:     "var(--ds-secondary-200)",
          300:     "var(--ds-secondary-300)",
          400:     "var(--ds-secondary-400)",
          500:     "var(--ds-secondary-500)",
          600:     "var(--ds-secondary-600)",
          700:     "var(--ds-secondary-700)",
          800:     "var(--ds-secondary-800)",
          900:     "var(--ds-secondary-900)",
          950:     "var(--ds-secondary-950)",
          DEFAULT: "var(--ds-secondary)",
        },
        "ds-accent": {
          50:      "var(--ds-accent-50)",
          100:     "var(--ds-accent-100)",
          200:     "var(--ds-accent-200)",
          300:     "var(--ds-accent-300)",
          400:     "var(--ds-accent-400)",
          500:     "var(--ds-accent-500)",
          600:     "var(--ds-accent-600)",
          700:     "var(--ds-accent-700)",
          800:     "var(--ds-accent-800)",
          900:     "var(--ds-accent-900)",
          950:     "var(--ds-accent-950)",
          DEFAULT: "var(--ds-accent)",
        },
        "ds-neutral": {
          0:       "var(--ds-neutral-0)",
          50:      "var(--ds-neutral-50)",
          100:     "var(--ds-neutral-100)",
          200:     "var(--ds-neutral-200)",
          300:     "var(--ds-neutral-300)",
          400:     "var(--ds-neutral-400)",
          500:     "var(--ds-neutral-500)",
          600:     "var(--ds-neutral-600)",
          700:     "var(--ds-neutral-700)",
          800:     "var(--ds-neutral-800)",
          900:     "var(--ds-neutral-900)",
          950:     "var(--ds-neutral-950)",
        },
        "ds-success": {
          50:      "var(--ds-success-50)",
          100:     "var(--ds-success-100)",
          200:     "var(--ds-success-200)",
          300:     "var(--ds-success-300)",
          400:     "var(--ds-success-400)",
          500:     "var(--ds-success-500)",
          600:     "var(--ds-success-600)",
          700:     "var(--ds-success-700)",
          800:     "var(--ds-success-800)",
          900:     "var(--ds-success-900)",
          DEFAULT: "var(--ds-success)",
        },
        "ds-warning": {
          50:      "var(--ds-warning-50)",
          100:     "var(--ds-warning-100)",
          200:     "var(--ds-warning-200)",
          300:     "var(--ds-warning-300)",
          400:     "var(--ds-warning-400)",
          500:     "var(--ds-warning-500)",
          600:     "var(--ds-warning-600)",
          700:     "var(--ds-warning-700)",
          800:     "var(--ds-warning-800)",
          900:     "var(--ds-warning-900)",
          DEFAULT: "var(--ds-warning)",
        },
        "ds-error": {
          50:      "var(--ds-error-50)",
          100:     "var(--ds-error-100)",
          200:     "var(--ds-error-200)",
          300:     "var(--ds-error-300)",
          400:     "var(--ds-error-400)",
          500:     "var(--ds-error-500)",
          600:     "var(--ds-error-600)",
          700:     "var(--ds-error-700)",
          800:     "var(--ds-error-800)",
          900:     "var(--ds-error-900)",
          DEFAULT: "var(--ds-error)",
        },
        "ds-info": {
          50:      "var(--ds-info-50)",
          100:     "var(--ds-info-100)",
          200:     "var(--ds-info-200)",
          300:     "var(--ds-info-300)",
          400:     "var(--ds-info-400)",
          500:     "var(--ds-info-500)",
          600:     "var(--ds-info-600)",
          700:     "var(--ds-info-700)",
          800:     "var(--ds-info-800)",
          900:     "var(--ds-info-900)",
          DEFAULT: "var(--ds-info)",
        },

        /* ── DS background / text / border tokens ── */
        "ds-bg": {
          base:     "var(--ds-bg-base)",
          surface:  "var(--ds-bg-surface)",
          elevated: "var(--ds-bg-elevated)",
          overlay:  "var(--ds-bg-overlay)",
          glass:    "var(--ds-bg-glass)",
        },
        "ds-text": {
          primary:   "var(--ds-text-primary)",
          secondary: "var(--ds-text-secondary)",
          tertiary:  "var(--ds-text-tertiary)",
          inverse:   "var(--ds-text-inverse)",
        },
        "ds-border": {
          DEFAULT: "var(--ds-border-default)",
          hover:   "var(--ds-border-hover)",
          focus:   "var(--ds-border-focus)",
        },
      },

      fontFamily: {
        "ds-sans":    "var(--ds-font-sans)",
        "ds-heading": "var(--ds-font-heading)",
        "ds-mono":    "var(--ds-font-mono)",
      },

      fontSize: {
        "ds-xs":  ["var(--ds-text-xs)",  { lineHeight: "var(--ds-text-xs-lh)" }],
        "ds-sm":  ["var(--ds-text-sm)",  { lineHeight: "var(--ds-text-sm-lh)" }],
        "ds-base": ["var(--ds-text-base)", { lineHeight: "var(--ds-text-base-lh)" }],
        "ds-lg":  ["var(--ds-text-lg)",  { lineHeight: "var(--ds-text-lg-lh)" }],
        "ds-xl":  ["var(--ds-text-xl)",  { lineHeight: "var(--ds-text-xl-lh)" }],
        "ds-2xl": ["var(--ds-text-2xl)", { lineHeight: "var(--ds-text-2xl-lh)" }],
        "ds-3xl": ["var(--ds-text-3xl)", { lineHeight: "var(--ds-text-3xl-lh)" }],
        "ds-4xl": ["var(--ds-text-4xl)", { lineHeight: "var(--ds-text-4xl-lh)" }],
        "ds-5xl": ["var(--ds-text-5xl)", { lineHeight: "var(--ds-text-5xl-lh)" }],
      },

      letterSpacing: {
        "ds-tight":  "var(--ds-tracking-tight)",
        "ds-normal": "var(--ds-tracking-normal)",
        "ds-wide":   "var(--ds-tracking-wide)",
      },

      spacing: {
        "ds-0":  "var(--ds-space-0)",
        "ds-1":  "var(--ds-space-1)",
        "ds-2":  "var(--ds-space-2)",
        "ds-3":  "var(--ds-space-3)",
        "ds-4":  "var(--ds-space-4)",
        "ds-5":  "var(--ds-space-5)",
        "ds-6":  "var(--ds-space-6)",
        "ds-8":  "var(--ds-space-8)",
        "ds-10": "var(--ds-space-10)",
        "ds-12": "var(--ds-space-12)",
        "ds-16": "var(--ds-space-16)",
        "ds-20": "var(--ds-space-20)",
      },

      boxShadow: {
        sm:  "var(--shadow-sm)",
        md:  "var(--shadow-md)",
        lg:  "var(--shadow-lg)",
        xl:  "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
        "primary": "var(--shadow-primary)",
        /* DS shadows */
        "ds-sm": "var(--ds-shadow-sm)",
        "ds-md": "var(--ds-shadow-md)",
        "ds-lg": "var(--ds-shadow-lg)",
        "ds-xl": "var(--ds-shadow-xl)",
        "ds-glow-primary":   "var(--ds-glow-primary)",
        "ds-glow-secondary": "var(--ds-glow-secondary)",
        "ds-glow-error":     "var(--ds-glow-error)",
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
        /* DS radii */
        "ds-sm":   "var(--ds-radius-sm)",
        "ds-md":   "var(--ds-radius-md)",
        "ds-lg":   "var(--ds-radius-lg)",
        "ds-xl":   "var(--ds-radius-xl)",
        "ds-2xl":  "var(--ds-radius-2xl)",
        "ds-full": "var(--ds-radius-full)",
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
        /* DS easing */
        "ds-default": "var(--ds-ease-default)",
        "ds-in":      "var(--ds-ease-in)",
        "ds-out":     "var(--ds-ease-out)",
        "ds-spring":  "var(--ds-ease-spring)",
      },

      transitionDuration: {
        fast: "var(--motion-fast)",
        normal: "var(--motion-duration)",
        slow: "var(--motion-slow)",
        /* DS durations */
        "ds-fast":   "var(--ds-duration-fast)",
        "ds-normal": "var(--ds-duration-normal)",
        "ds-slow":   "var(--ds-duration-slow)",
        "ds-slower": "var(--ds-duration-slower)",
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
  plugins: [
    require("tailwindcss-animate"),

    /* ── Design System utility plugin ── */
    plugin(function ({ addUtilities }) {
      addUtilities({
        /* Glassmorphism */
        ".ds-glass": {
          background: "var(--ds-bg-glass)",
          "backdrop-filter": "blur(16px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(16px) saturate(180%)",
          border: "1px solid var(--ds-border-default)",
        },
        ".ds-glass-border": {
          background: "var(--ds-bg-glass)",
          "backdrop-filter": "blur(20px) saturate(180%)",
          "-webkit-backdrop-filter": "blur(20px) saturate(180%)",
          border: "1px solid var(--ds-border-hover)",
          "box-shadow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        },
        ".ds-glass-glow": {
          background: "var(--ds-bg-glass)",
          "backdrop-filter": "blur(20px) saturate(200%)",
          "-webkit-backdrop-filter": "blur(20px) saturate(200%)",
          border: "1px solid var(--ds-border-hover)",
          "box-shadow": "var(--ds-glow-primary), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        },

        /* Gradient mesh background */
        ".ds-gradient-mesh": {
          "background-image": "var(--ds-gradient-mesh)",
        },

        /* Gradient backgrounds */
        ".ds-gradient-primary": {
          background: "var(--ds-gradient-primary)",
        },
        ".ds-gradient-secondary": {
          background: "var(--ds-gradient-secondary)",
        },
        ".ds-gradient-accent": {
          background: "var(--ds-gradient-accent)",
        },

        /* Glow effects */
        ".ds-glow-primary": {
          "box-shadow": "var(--ds-glow-primary)",
        },
        ".ds-glow-secondary": {
          "box-shadow": "var(--ds-glow-secondary)",
        },
        ".ds-glow-error": {
          "box-shadow": "var(--ds-glow-error)",
        },

        /* Gradient text */
        ".ds-text-gradient-primary": {
          background: "var(--ds-gradient-primary)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".ds-text-gradient-secondary": {
          background: "var(--ds-gradient-secondary)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
      })
    }),
  ],
} satisfies Config

export default config
