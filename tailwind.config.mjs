/* eslint-disable @typescript-eslint/naming-convention */
import typography from '@tailwindcss/typography';
import defaultTheme from 'tailwindcss/defaultTheme';
import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      fontFamily: {
        sans: ['Open Sans Variable', 'Helvetica', ...defaultTheme.fontFamily.sans],
        serif: ['Merriweather', 'Georgia', 'Times New Roman', ...defaultTheme.fontFamily.serif],
        mono: ['JetBrains Mono Variable', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        // This should have been included in Tailwind...
        inherit: 'inherit',

        // Theme
        'classic-link': '#0000ee',
        'classic-link-active': '#ee0000',
        'classic-link-visited': '#551a8b',
        'konker-flash-red': '#b70404',
        'konker-flash-red-dark': '#a00000',
        'konker-flash-blue': '#2c5aa0',
        'konker-flash-blue-light': '#5fbcd3',
        'konker-flash-blue-dark': '#214478',
      },
      width: {
        layout: 'min(1280px, 100%)',
        header: 'min(1040px, 100%)',
        footer: 'min(980px, 100%)',
        index: 'min(880px, 100%)',
        articleList: 'min(920px, 100%)',
        article: 'min(800px, 100%)',
        image: 'min(1080px, 100%)',
        wiki: 'min(1280px, 100%)',
      },
      gridTemplateColumns: {
        layout: 'minmax(0, 0.75fr) minmax(0, 3.25fr);',
        content: 'minmax(0, 4.25fr) minmax(0, 1.25fr);',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            p: {
              fontSize: '1.0rem',
            },
            '.attention-grabber': {
              fontSize: '120%',
            },
            figcaption: {
              textAlign: 'center',
            },
            hr: {
              width: '2.7rem',
              marginLeft: 'auto',
              marginRight: 'auto',
              marginTop: '1.72rem',
              marginBottom: '1.72rem',
              borderTopWidth: '0.45rem',
              borderStyle: 'dotted',
              borderColor: theme('colors.gray.300'),
            },
            h1: {
              fontWeight: '400',
              fontSize: '2.5rem',
              lineHeight: '3.25rem',
              marginTop: '1.625rem',
              marginBottom: '1.625rem',
            },
            h2: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontWeight: '400',
              fontSize: '1.6875rem',
              lineHeight: '2.4375rem',
              marginTop: '3.625rem',
              marginBottom: '0.8125rem',
            },
            h3: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontWeight: '400',
              fontSize: '1.375rem',
              lineHeight: '1.625rem',
              marginTop: '3.25rem',
              marginBottom: '0.8125rem',
            },
            h4: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontSize: '1.2rem',
              lineHeight: '1.625rem',
              marginTop: '2.4375rem',
              marginBottom: '0.8125rem',
            },
          },
        },
        lg: {
          css: {
            h1: {
              fontSize: '2.5rem',
              lineHeight: '3.4rem',
              marginTop: '1.72rem',
              marginBottom: '1.72rem',
            },
            h2: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontWeight: '400',
              fontSize: '1.6875rem',
              lineHeight: '2.4375rem',
              marginTop: '3.625rem',
              marginBottom: '0.8125rem',
            },
            h3: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontWeight: '400',
              fontSize: '1.375rem',
              lineHeight: '1.625rem',
              marginTop: '3.25rem',
              marginBottom: '0.8125rem',
            },
            h4: {
              fontFamily: ['Helvetica', 'Arial', 'sans-serif'],
              fontSize: '1.2rem',
              lineHeight: '1.625rem',
              marginTop: '2.4375rem',
              marginBottom: '0.8125rem',
            },
          },
        },
        xl: {
          css: {
            h1: {
              fontSize: '3.5rem',
              lineHeight: '4.5rem',
              marginTop: '1.72rem',
              marginBottom: '1.72rem',
            },
            h2: {
              fontSize: '2.0rem',
              lineHeight: '2.583rem',
              marginTop: '4.05rem',
              marginBottom: '1.61rem',
            },
            h3: {
              fontSize: '1.475rem',
              lineHeight: '1.72rem',
              marginTop: '3.44rem',
              marginBottom: '0.86rem',
            },
            h4: {
              fontSize: '1.2rem',
              lineHeight: '1.72rem',
              marginTop: '2.58rem',
              marginBottom: '0.86rem',
            },
          },
        },
      }),
    },
  },
  plugins: [
    typography,

    // eslint-disable-next-line fp/no-nil
    plugin(function ({ _addComponents, _addUtilities, addBase, theme }) {
      // eslint-disable-next-line fp/no-unused-expression
      addBase({
        a: {
          textDecoration: 'underline',
          color: theme('colors.classic-link'),
          '&:hover': {
            textDecoration: 'none',
            color: theme('colors.classic-link-visited'),
          },
          '&:visited': {
            color: theme('colors.classic-link-visited'),
          },
        },
        /*
        '#content p': {
          lineHeight: '1.625rem',
          marginBottom: '1.625rem',
        },
        h1: {
          fontFamily: theme('fontFamily.serif'),
          fontSize: '2.5rem',
          lineHeight: '3.25rem',
          // marginTop: '6.5rem',
          marginBottom: '1.625rem',
        },
        h2: {
          fontSize: '1.6875rem',
          lineHeight: '2.4375rem',
          marginTop: '4.0625rem',
          marginBottom: '0.8125rem',
          fontFamily: theme('fontFamily.sans'),
        },
        h3: {
          fontFamily: theme('fontFamily.sans'),
          fontSize: '1.375rem',
          lineHeight: '1.625rem',
          marginTop: '3.25rem',
          marginBottom: '0.8125rem',
        },
        h4: {
          fontFamily: theme('fontFamily.sans'),
          fontSize: '1.2rem',
          lineHeight: '1.625rem',
          marginTop: '2.4375rem',
          marginBottom: '0.8125rem',
        },
        h5: {
          fontFamily: theme('fontFamily.sans'),
          fontSize: '1rem',
          lineHeight: '1.625rem',
          marginTop: '4.0625rem',
          marginBottom: '0.8125rem',
        },
        h6: {
          fontFamily: theme('fontFamily.sans'),
          fontSize: '1rem',
          lineHeight: '1.625rem',
          marginTop: '4.0625rem',
          marginBottom: '0.8125rem',
        },
        'h1 + h2': {
          marginTop: '1.625rem',
        },
        'h2 + h3, h3 + h4, h4 + h5': {
          marginTop: '0.8125rem',
        },
        */
      });
    }),
  ],
};
