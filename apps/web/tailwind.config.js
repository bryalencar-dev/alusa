/** @type {import('tailwindcss').Config} */
// por quê: adiciona tokens de cor e mantém extensões futuras centralizadas
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/lib/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        'brand-bg': '#1A153A',
        'brand-primary': '#19143A',
        'brand-accent': '#4F2298',
        'brand-muted': '#686868',
        'brand-muted2': '#828282',
        'brand-stroke': '#DDDDDD',
        // pixel-perfect login
        brand: {
          // Segmented control / principal (DEFAULT/light)
          DEFAULT: '#4f2298',
          light: '#6b35cc',
          selected: '#5b28af',
          // Paleta existente mantida para não quebrar classes atuais
          bg: '#0F0C26',
            primary: '#19143A',
            accent: '#4F2298',
            stroke: '#E2E2E8',
            muted: '#828282'
        },
        primary: {
          DEFAULT: '#4f2298',
          foreground: '#ffffff'
        },
        violet: {
          600: '#7c3aed',
          700: '#6d28d9'
        },
        purple: {
          25: '#fefcff',
          50: '#faf5ff',
          300: '#c4b5fd',
          400: '#a78bfa',
          600: '#7c3aed',
          900: '#581c87'
        }
      },
      boxShadow: {
        card: '0 8px 32px -4px rgba(10,10,15,0.18)'
      },
      borderRadius: {
        card: '40px'
      }
    }
  },
  plugins: []
};
