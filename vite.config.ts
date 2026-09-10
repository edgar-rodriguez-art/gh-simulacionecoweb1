import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/*
 * La ruta base depende de dónde se publique, y equivocarla deja la página en
 * blanco: el HTML pediría el JS bajo un prefijo que no existe.
 *
 *   Cloudflare Pages → raíz de <proyecto>.pages.dev            → '/'
 *   GitHub Pages     → subcarpeta github.io/<repo>/            → '/<repo>/'
 *
 * Cloudflare define CF_PAGES=1 en sus builds, así que el caso se detecta solo.
 * BASE_PATH manda sobre todo lo demás (dominio propio, otro host, `vite dev`).
 */
const base = process.env.BASE_PATH ?? (process.env.CF_PAGES ? '/' : '/gh-simulacionecoweb1/')

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
