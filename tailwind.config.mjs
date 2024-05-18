import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  safelist: [
    'block',
    'xs:block',
    'sm:block',
    'md:block',
    'lg:block',
    'xl:block',
    'hidden',
    'xs:hidden',
    'sm:hidden',
    'md:hidden',
    'lg:hidden',
    'xl:hidden',
    'fixed',
    'xs:fixed',
    'sm:fixed',
    'md:fixed',
    'lg:fixed',
    'xl:fixed',
    'static',
    'xs:static',
    'sm:static',
    'md:static',
    'lg:static',
    'xl:static',
    'relative',
    'xs:relative',
    'sm:relative',
    'md:relative',
    'lg:relative',
    'xl:relative',
    'right-0',
    'left-0',
    'dark',
    'not-prose',
    ...[...Array(100).keys()].map((x) => `text-[${100 + x}%]`),
  ],
  darkMode: ['selector', '[data-theme-mode="dark"]'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      headings: ['Computer Modern Serif', ...defaultTheme.fontFamily.serif],
      serif: ['Merriweather', ...defaultTheme.fontFamily.serif],
      sans: ['Work Sans Variable', ...defaultTheme.fontFamily.sans],
      mono: ['JetBrains Mono Variable', ...defaultTheme.fontFamily.mono],
    },
    extend: {
      colors: {
        // This should have been included in Tailwind...
        inherit: 'inherit',

        // Dark mode
        'color-text-dark': 'var(--kdd-color-text-dark)',
        'color-heading-dark': 'var(--kdd-color-heading-dark)',
        'color-bg-dark': 'var(--kdd-color-bg-dark)',
        'classic-link-dark': 'var(--kdd-classic-link-dark)',
        'classic-link-visited-dark': 'var(--kdd-classic-link-visited-dark)',
        'classic-link-active-dark': 'var(--kdd-classic-link-active-dark)',

        // Light mode
        'color-text-light': 'var(--kdd-color-text-light)',
        'color-heading-light': 'var(--kdd-color-heading-light)',
        'color-bg-light': 'var(--kdd-color-bg-light)',
        'classic-link-light': 'var(--kdd-classic-link-light)',
        'classic-link-visited-light': 'var(--kdd-classic-link-visited-light)',
        'classic-link-active-light': 'var(--kdd-classic-link-active-light)',

        // Branding
        'konker-flash-red': 'var(--kdd-konker-flash-red)',
        'konker-flash-red-dark': 'var(--kdd-konker-flash-red-dark)',
        'konker-flash-blue': 'var(--kdd-konker-flash-blue)',
        'konker-flash-blue-light': 'var(--kdd-konker-flash-blue-light)',
        'konker-flash-blue-dark': 'var(--kdd-konker-flash-blue-dark)',
      },
      textColor: ({ theme }) => ({
        dark: theme('colors.color-text-dark'),
        light: theme('colors.color-text-light'),
        kdd: 'var(--kdd-color-text)',
        'kdd-hr': 'var(--kdd-color-hr)',
        'kdd-heading': 'var(--kdd-color-heading)',
        'kdd-link': 'var(--kdd-color-link)',
      }),
      backgroundColor: ({ theme }) => ({
        dark: theme('colors.color-bg-dark'),
        light: theme('colors.color-bg-light'),
        kdd: 'var(--kdd-color-bg)',
        'kdd-blog': 'var(--kdd-color-bg-blog)',
        'kdd-project': 'var(--kdd-color-bg-project)',
        'kdd-tag': 'var(--kdd-color-bg-tag)',
        'kdd-nav': 'var(--kdd-color-bg-nav)',
      }),
    },
  },
  plugins: [typography],
};
