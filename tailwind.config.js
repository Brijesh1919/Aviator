/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0d0f14',
        'panel': '#161a23',
        'panel-alt': '#1d222d',
        'accent': '#e4002b',
        'accent-soft': '#ff3d55',
        'success': '#2ecc71',
        'warning': '#f1c40f'
      },
      boxShadow: {
        'inner-glow': 'inset 0 0 6px 0 rgba(255,255,255,0.05)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
