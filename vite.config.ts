import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/hk-inspect-admin/', // Nombre del repo en GitHub
})
