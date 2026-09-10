import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/*
 * La ruta base depende de dónde se publique, y equivocarla deja la página en
 * blanco: el HTML pediría el JS bajo un prefijo que no existe.
 *
 * Por defecto la raíz, que es donde sirven casi todos los hosts (Cloudflare
 * Workers, Cloudflare Pages, Netlify, Vercel, un dominio propio). El único
 * caso especial es GitHub Pages, que publica en la subcarpeta /<repo>/, y su
 * workflow pasa BASE_PATH explícito — no se adivina por variables de entorno,
 * que cambian entre productos del mismo proveedor.
 */
const base = process.env.BASE_PATH ?? '/'

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
