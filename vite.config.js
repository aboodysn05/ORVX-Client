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
  preview: {
    // `npm start` serves the production build with `vite preview`, which
    // rejects any Host header it doesn't recognise and answers 403 —
    // "Blocked request. This host is not allowed." A deployed app is reached
    // through the platform's own domain, never localhost, so that domain has
    // to be allowed explicitly or every request to the live site fails.
    //
    // A leading dot matches the domain and all of its subdomains, so this
    // covers whatever hostname Railway generates for the service. Add your
    // own domain here too if you attach one later.
    allowedHosts: ['.up.railway.app'],
  },
})
