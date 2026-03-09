import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/document': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/agent': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/knowledge-base': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
