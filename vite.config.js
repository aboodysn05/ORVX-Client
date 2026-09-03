import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev-only proxy so the browser can read ZenQuotes without a CORS error.
    // `/zenquotes/today` -> `https://zenquotes.io/api/today`
    proxy: {
      '/zenquotes': {
        target: 'https://zenquotes.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zenquotes/, '/api'),
      },
    },
  },
})
