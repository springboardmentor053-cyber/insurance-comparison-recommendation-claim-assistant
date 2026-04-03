import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/policies': 'http://localhost:8000',
      '/claims': 'http://localhost:8000',
      '/recommendations': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/providers': 'http://localhost:8000',
      '/preferences': 'http://localhost:8000',
    }
  },
})
