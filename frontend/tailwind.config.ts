import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Luminous Precision surface colors
        surface: '#f9f9f9',
        'surface-dim': '#dadada',
        'surface-bright': '#f9f9f9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f4',
        'surface-container': '#eeeeee',
        'surface-container-high': '#e8e8e8',
        'surface-container-highest': '#e2e2e2',
        'on-surface': '#1a1c1c',
        'on-surface-variant': '#414755',
        'inverse-surface': '#2f3131',
        'inverse-on-surface': '#f0f1f1',
        outline: '#717786',
        'outline-variant': '#c1c6d7',
        'surface-tint': '#005bc1',

        // Primary
        primary: '#0058bc',
        'on-primary': '#ffffff',
        'primary-container': '#0070eb',
        'on-primary-container': '#fefcff',
        'inverse-primary': '#adc6ff',
        'primary-fixed': '#d8e2ff',
        'primary-fixed-dim': '#adc6ff',

        // Secondary
        secondary: '#5d5e60',
        'on-secondary': '#ffffff',
        'secondary-container': '#dfdfe1',
        'on-secondary-container': '#616365',
        'secondary-fixed': '#e2e2e4',
        'secondary-fixed-dim': '#c6c6c8',

        // Tertiary
        tertiary: '#5b5c60',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#747479',
        'on-tertiary-container': '#fefcff',
        'tertiary-fixed': '#e3e2e7',
        'tertiary-fixed-dim': '#c6c6cb',

        // Error
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        // Background
        background: '#f9f9f9',
        'on-background': '#1a1c1c',
        'background-secondary': '#F5F5F7',

        // Surface variant
        'surface-variant': '#e2e2e2',

        // Border
        'border-light': 'rgba(0, 0, 0, 0.08)',

        // Glass
        'glass-bg': 'rgba(255, 255, 255, 0.72)',

        // Tier colors
        'tier-s': '#FFD700',
        'tier-s-end': '#FF9500',
        'tier-a-crimson': '#FF3B30',
        'tier-b-electric-purple': '#AF52DE',
        'tier-c-graphite': '#48484A',
        'tier-d-soft-gray': '#AEAEB2',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      spacing: {
        'top-bar-height': '56px',
        'info-area-height': '80px',
        'status-bar-height': '32px',
        'gutter-md': '16px',
        'stack-gap': '12px',
        'margin-edge': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        'display-lg': ['Inter', 'system-ui', 'sans-serif'],
        'headline-md': ['Inter', 'system-ui', 'sans-serif'],
        'headline-sm': ['Inter', 'system-ui', 'sans-serif'],
        'body-lg': ['Inter', 'system-ui', 'sans-serif'],
        'body-md': ['Inter', 'system-ui', 'sans-serif'],
        'label-sm': ['Inter', 'system-ui', 'sans-serif'],
        'tier-marker': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['34px', { lineHeight: '41px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm': ['20px', { lineHeight: '25px', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '20px', fontWeight: '400' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
        'tier-marker': ['28px', { lineHeight: '34px', letterSpacing: '0.05em', fontWeight: '800' }],
      },
      backgroundImage: {
        'tier-s-gradient': 'linear-gradient(135deg, #FFD700 0%, #FF9500 100%)',
      },
      boxShadow: {
        'card-drag': '0 4px 24px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.15)',
      },
      backdropBlur: {
        glass: '20px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-in-out',
        'fade-out': 'fade-out 0.2s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
