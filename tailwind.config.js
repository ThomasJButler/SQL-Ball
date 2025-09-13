/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Custom semantic colors using CSS variables
        'bg-base': 'var(--bg-base)',
        'bg-alt': 'var(--bg-alt)',
        'bg-sidebar': 'var(--bg-sidebar)',
        'bg-navbar': 'var(--bg-navbar)',
        'text-base': 'var(--text-base)',
        'text-muted': 'var(--text-muted)',
        'border-base': 'var(--border-base)',
        'border-sidebar': 'var(--border-sidebar)',
        'border-navbar': 'var(--border-navbar)',
        primary: {
          DEFAULT: 'hsl(210, 90%, 50%)', // Brighter base blue
          light: 'hsl(210, 90%, 65%)',
          dark: 'hsl(210, 90%, 40%)',
          '50': 'hsl(210, 90%, 95%)',
          '100': 'hsl(210, 90%, 90%)',
          '200': 'hsl(210, 90%, 80%)',
          '300': 'hsl(210, 90%, 70%)',
          '400': 'hsl(210, 90%, 60%)',
          '500': 'hsl(210, 90%, 50%)', // Base
          '600': 'hsl(210, 90%, 45%)',
          '700': 'hsl(210, 90%, 40%)', // Dark
          '800': 'hsl(210, 90%, 30%)',
          '900': 'hsl(210, 90%, 20%)',
          '950': 'hsl(210, 90%, 10%)',
        },
        accent: {
          DEFAULT: 'hsl(260, 85%, 60%)', // Vibrant purple
          light: 'hsl(260, 85%, 70%)',
          dark: 'hsl(260, 85%, 50%)',
          // Add shades 50-950 if needed
        },
        secondary: {
          DEFAULT: 'hsl(180, 70%, 50%)', // Teal/Cyan
          light: 'hsl(180, 70%, 65%)',
          dark: 'hsl(180, 70%, 40%)',
           // Add shades 50-950 if needed
        },
        slate: { // Slightly cooler slate
          '50': '#f8fafc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a', // Deeper dark base
          '950': '#020617' // Almost black
        },
        // Keep success, warning, error as they are or adjust similarly
        success: {
          DEFAULT: 'hsl(145, 63%, 42%)', // Example: Keep or adjust
          // ... shades
        },
        warning: {
          DEFAULT: 'hsl(45, 100%, 51%)', // Example: Keep or adjust
          // ... shades
        },
        error: {
          DEFAULT: 'hsl(0, 72%, 51%)', // Example: Keep or adjust
          // ... shades
        },
      },
      boxShadow: {
        'glow-primary-sm': '0 0 8px 0px hsla(210, 90%, 50%, 0.3)',
        'glow-primary-md': '0 0 15px 2px hsla(210, 90%, 50%, 0.4)',
        'glow-primary-lg': '0 0 25px 5px hsla(210, 90%, 50%, 0.5)',
        'glow-accent-md': '0 0 15px 2px hsla(260, 85%, 60%, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-in-up': 'slideInUp 0.5s ease-out forwards',
        'bounce-in': 'bounceIn 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient': 'gradient 10s ease infinite', // Slower default gradient
        'gradient-fast': 'gradient 5s ease infinite', // Faster gradient animation
        'pulse-glow-subtle': 'pulseGlowSubtle 3s ease-in-out infinite',
        'float-subtle': 'float 10s ease-in-out infinite', // Slower float
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px hsla(var(--primary-hsl, 210 90%), 50%, 0.2)' },
          '50%': { boxShadow: '0 0 20px hsla(var(--primary-hsl, 210 90%), 50%, 0.5)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        pulseGlowSubtle: { // More subtle glow pulse
          '0%, 100%': { boxShadow: '0 0 5px hsla(210, 90%, 50%, 0.1)' },
          '50%': { boxShadow: '0 0 12px hsla(210, 90%, 50%, 0.3)' }
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}