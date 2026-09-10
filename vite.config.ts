import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// GitHub Pages sirve el sitio bajo /<repo>/. BASE_PATH permite sobreescribirlo
// (por ejemplo BASE_PATH=/ para un dominio propio o para `vite dev`).
const base = process.env.BASE_PATH ?? '/gh-simulacionecoweb1/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
