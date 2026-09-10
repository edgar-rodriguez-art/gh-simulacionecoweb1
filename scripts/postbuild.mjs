/**
 * GitHub Pages no reescribe rutas hacia el index. Copiar index.html a 404.html
 * hace que /eoq, /colas, … se sirvan igual al recargar o al abrir un enlace
 * compartido, en vez de dar 404. `.nojekyll` evita que Pages ignore assets.
 */
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const dist = resolve(import.meta.dirname, '..', 'dist')

copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
writeFileSync(resolve(dist, '.nojekyll'), '')

console.log('postbuild: 404.html y .nojekyll listos en dist/')
