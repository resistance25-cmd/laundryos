// src: tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // Customer panel
        customer: {
          primary: '#6366F1',
          accent: '#8B5CF6',
          success: '#059669',
          warning: '#F59E0B',
          error: '#EF4444',
          'dark-bg': '#0B0D17',
          'dark-card': '#10131F',
          'dark-elevated': '#1A1E30',
          'light-bg': '#F0F2FF',
          'light-card': '#FFFFFF',
        },
        // Admin panel
        admin: {
          bg: '#0F1117',
          sidebar: '#13151C',
          card: '#13151C',
          border: '#1E2130',
          accent: '#6366F1',
          'text-primary': '#F1F5F9',
          'text-muted': '#64748B',
        },
        // Rider panel
        rider: {
          bg: '#0F172A',
          card: '#1E293B',
          accent: '#10B981',
          warning: '#F59E0B',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
