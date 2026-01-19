/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware colors via CSS variables
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        ink: 'var(--text-primary)',
        accent: 'var(--color-accent)',
        border: 'var(--border-line)',
      },
    },
  },
  plugins: [],
};
