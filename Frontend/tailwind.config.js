/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Poppins", "Inter", "ui-sans-serif", "system-ui"],
      },
      colors: {
        // Brand colors (mapped to CSS variables)
        fire: {
          50: 'hsl(var(--primary))',
          100: 'hsl(var(--primary))',
          200: 'hsl(var(--primary))',
          300: 'hsl(var(--primary))',
          400: 'hsl(var(--primary))',
          500: 'hsl(var(--primary))',
          600: 'hsl(var(--primary))',
          700: 'hsl(var(--primary))',
          800: 'hsl(var(--primary))',
          900: 'hsl(var(--primary))',
          950: 'hsl(var(--primary))',
        },
        // Legacy alias
        'toro-red': 'hsl(var(--primary))',
        ember: {
          50: 'hsl(var(--muted))',
          500: 'hsl(var(--foreground))',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },

        // Shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      spacing: {
        'touch-min': '44px', // iOS minimum touch target
        'touch': '48px', // Standard touch target
        'section': '3rem', // 48px entre secciones - 2026 spacing
        'card-padding': '2rem', // 32px padding en cards
        'safe': 'max(0px, env(safe-area-inset-bottom))', // iOS safe area
      },

      borderRadius: {
        'sm': '0.5rem', // 8px
        'DEFAULT': '0.75rem', // 12px
        'md': '1rem', // 16px
        'lg': '1.25rem', // 20px
        'xl': '1.5rem', // 24px - 2026 style
        '2xl': '2rem', // 32px - 2026 style
        'full': '9999px',
      },

      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-base)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-lg)',
        'fire': 'var(--shadow-fire)',
        'fire-lg': 'var(--shadow-fire-lg)', // Glow intenso - 2026
        'ember': 'var(--shadow-ember)',
        'primary-glow': 'var(--shadow-primary-glow)', // Glow sutil - 2026
        'glow': '0 0 20px -5px var(--primary)',
        'glow-lg': '0 0 40px -10px var(--primary)',
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1, boxShadow: "0 0 20px -5px var(--primary)" },
          "50%": { opacity: 0.8, boxShadow: "0 0 30px -5px var(--primary)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in-from-right 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
