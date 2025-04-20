/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config = {
  darkMode: ['class', '.dark'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        fill: {
          1: 'rgba(255, 255, 255, 0.10)',
        },
        // bankGradient: '#0179FE',
        'bank-gradient': '#0179FE',
        indigo: {
          500: '#6172F3',
          700: '#3538CD',
        },
        success: {
          25: '#F6FEF9',
          50: '#ECFDF3',
          100: '#D1FADF',
          600: '#039855',
          700: '#027A48',
          900: '#054F31',
        },
        pink: {
          25: '#FEF6FB',
          100: '#FCE7F6',
          500: '#EE46BC',
          600: '#DD2590',
          700: '#C11574',
          900: '#851651',
        },
        blue: {
          25: '#F5FAFF',
          100: '#D1E9FF',
          500: '#2E90FA',
          600: '#1570EF',
          700: '#175CD3',
          900: '#194185',
        },
        sky: {
          1: '#F3F9FF',
        },
        black: {
          1: '#00214F',
          2: '#344054',
        },
        gray: {
          25: '#FCFCFD',
          200: '#EAECF0',
          300: '#D0D5DD',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          900: '#101828',
        },
      },
      backgroundImage: {
        'bank-gradient': 'linear-gradient(90deg, #0179FE 0%, #4893FF 100%)',
        'gradient-mesh': "url('/icons/gradient-mesh.svg')",
        'bank-green-gradient':
          'linear-gradient(90deg, #01797A 0%, #489399 100%)',
      },
      boxShadow: {
        form: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
        chart:
          '0px 1px 3px 0px rgba(16, 24, 40, 0.10), 0px 1px 2px 0px rgba(16, 24, 40, 0.06)',
        profile:
          '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)',
        // creditCard: '8px 10px 16px 0px rgba(0, 0, 0, 0.05)',
        'credit-card': '8px 10px 16px 0px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        inter: 'var(--font-inter)',
        'ibm-plex-serif': 'var(--font-ibm-plex-serif)',
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
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plugin(function ({ addBase, addUtilities, addComponents, matchUtilities }) {
      // Add custom utilities
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.no-scrollbar': {
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        },
        '.custom-scrollbar::-webkit-scrollbar': {
          width: '3px',
          height: '3px',
          borderRadius: '2px',
        },
        '.custom-scrollbar::-webkit-scrollbar-track': {
          background: '#dddddd',
        },
        '.custom-scrollbar::-webkit-scrollbar-thumb': {
          background: '#5c5c7b',
          borderRadius: '50px',
        },
        '.custom-scrollbar::-webkit-scrollbar-thumb:hover': {
          background: '#7878a3',
        },
        '.flex-center': {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        },
        '.text-10': {
          fontSize: '10px',
          lineHeight: '14px',
        },
        '.text-12': {
          fontSize: '12px',
          lineHeight: '16px',
        },
        '.text-14': {
          fontSize: '14px',
          lineHeight: '20px',
        },
        '.text-16': {
          fontSize: '16px',
          lineHeight: '24px',
        },
        '.text-18': {
          fontSize: '18px',
          lineHeight: '22px',
        },
        '.text-20': {
          fontSize: '20px',
          lineHeight: '24px',
        },
        '.text-24': {
          fontSize: '24px',
          lineHeight: '30px',
        },
        '.text-26': {
          fontSize: '26px',
          lineHeight: '32px',
        },
        '.text-30': {
          fontSize: '30px',
          lineHeight: '38px',
        },
        '.text-36': {
          fontSize: '36px',
          lineHeight: '44px',
        },
      });
      // addComponents({
      //   '.input-class': {

      //   }
      // })
    }),
  ],
} satisfies Config;

export default config;
