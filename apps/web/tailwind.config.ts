import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── Gold Scale (Primary Brand) ──────────────────────
        gold: {
          50: '#fdf9ec',
          100: '#faf0cc',
          200: '#f5df95',
          300: '#efc85a',
          400: '#e8b430',
          500: '#C9A84C', // Primary gold
          600: '#b8922e',
          700: '#9a7425',
          800: '#7d5c22',
          900: '#674c1f',
          950: '#3b280e',
        },
        // ─── Charcoal Scale (Text/Dark) ───────────────────────
        charcoal: {
          50: '#f6f6f7',
          100: '#e2e3e6',
          200: '#c5c7cc',
          300: '#a0a3ab',
          400: '#7c8089',
          500: '#636670',
          600: '#4f525a',
          700: '#41434b',
          800: '#383a40',
          900: '#1a1b1f', // Primary dark
          950: '#0d0e10',
        },
        // ─── Status Colors ────────────────────────────────────
        status: {
          available: '#22c55e',
          occupied: '#3b82f6',
          dirty: '#f97316',
          clean: '#22c55e',
          inspected: '#8b5cf6',
          'out-of-order': '#ef4444',
          'out-of-service': '#6b7280',
          'on-change': '#eab308',
        },
        // ─── Reservation Status ───────────────────────────────
        reservation: {
          confirmed: '#3b82f6',
          'checked-in': '#22c55e',
          'checked-out': '#6b7280',
          cancelled: '#ef4444',
          'no-show': '#f97316',
          tentative: '#eab308',
          inquiry: '#8b5cf6',
        },
        // ─── shadcn/ui CSS variable mappings ──────────────────
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'gold-sm': '0 1px 3px 0 rgba(201, 168, 76, 0.15)',
        'gold-md': '0 4px 12px 0 rgba(201, 168, 76, 0.2)',
        'gold-lg': '0 10px 30px 0 rgba(201, 168, 76, 0.25)',
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;