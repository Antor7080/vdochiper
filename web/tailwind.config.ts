import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F47920',
          hover: '#D4691C',
          light: '#FEF3E8',
          border: '#F4792033',
        },
      },
      boxShadow: {
        modal: '0 20px 60px -10px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
