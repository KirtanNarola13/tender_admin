import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://tender-api.reliablesolution.in',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://tender-api.reliablesolution.in',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
