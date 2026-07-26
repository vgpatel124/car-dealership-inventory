import type { Config } from 'tailwindcss';

// Design tokens live here and in DESIGN.md — keep them in sync.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14183B', // sidebar / nav
        paper: '#F6F5F1', // main canvas
        amber: '#E2A63B', // primary actions / focus / low stock
        moss: '#3E8F6F', // in-stock / healthy
        ember: '#C1443A', // sold-out / danger
      },
      fontFamily: {
        // Headings, make/model, prices (display)
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Body copy, forms
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Prices, quantities, VINs
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
