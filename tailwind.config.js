/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  '#0D1B2A',
        ink:   '#1A2B3C',
        gold:  '#C9A84C',
        cream: '#F7F3EC',
        mist:  '#8DA4B8',
        pass:  '#2E7D5A',
        fail:  '#A63228',
        warn:  '#C07A20',
        domain: {
          strategy: '#4A9EDB',
          culture:  '#E8904A',
          voc:      '#7BC67A',
          design:   '#C97AC9',
          metrics:  '#E8C94A',
          adoption: '#7AC9C9',
        },
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans:  ['"DM Sans"', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 2px 12px 0 rgba(201,168,76,0.15)',
        'gold':    '0 4px 24px 0 rgba(201,168,76,0.2)',
        'gold-lg': '0 8px 40px 0 rgba(201,168,76,0.25)',
        'ink':     '0 8px 32px 0 rgba(13,27,42,0.6)',
      },
      backgroundImage: {
        'radial-gold': 'radial-gradient(ellipse at 60% 0%, rgba(201,168,76,0.08) 0%, transparent 60%)',
        'radial-ink':  'radial-gradient(ellipse at 50% 100%, rgba(26,43,60,0.8) 0%, transparent 70%)',
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight:   '-0.02em',
        normal:  '0em',
        wide:    '0.06em',
        wider:   '0.1em',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
