/**
 * Prueba de humo end-to-end sobre el build de producción.
 *
 * Levanta `vite preview`, recorre las nueve rutas con Chromium y verifica que
 * cada una renderiza sin errores de consola, que dibuja sus gráficos y sus seis
 * tarjetas de resultado, que la pestaña Explicación tiene contenido, que mover
 * un slider recalcula, que los botones del Beer Game avanzan la semana y que
 * un enlace profundo recargado no da 404.
 *
 *   npm run build && npm run e2e
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

// En entornos con un Chromium ya provisto (CI, contenedores), usarlo en vez de
// descargar uno. CHROMIUM_PATH lo fija a mano si hace falta.
const CHROMIUM =
  process.env.CHROMIUM_PATH ??
  ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(
    (p) => existsSync(p),
  )

// Debe coincidir con el `base` que usó el build: `vite preview` sirve bajo esa
// ruta. Por defecto la raíz; con BASE_PATH se prueba el build de GitHub Pages.
const BASE_PATH = process.env.BASE_PATH ?? '/'

// Puerto libre pedido al sistema: un puerto fijo hace que dos corridas
// seguidas (o dos jobs de CI en la misma máquina) se pisen, y la segunda
// acabe hablando con el `preview` de la primera, que sirve otro `base`.
const PORT = await freePort()
const ORIGIN = `http://127.0.0.1:${PORT}`
const ROOT = ORIGIN + BASE_PATH

async function freePort() {
  const { createServer } = await import('node:net')
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

const ROUTES = [
  { path: '', name: 'Índice general', cards: 0 },
  { path: 'oferta-demanda', name: 'Oferta y demanda', cards: 6 },
  { path: 'interes-compuesto', name: 'Interés compuesto', cards: 6 },
  { path: 'eoq', name: 'Cantidad económica de pedido', cards: 6 },
  { path: 'punto-reorden', name: 'Punto de reorden con demanda variable', cards: 6 },
  { path: 'revision', name: 'Revisión continua vs. periódica', cards: 6 },
  { path: 'efecto-latigo', name: 'Efecto látigo', cards: 6 },
  { path: 'beer-game', name: 'Beer Game simplificado', cards: 6 },
  { path: 'colas', name: 'Teoría de colas y cuellos de botella', cards: 6 },
]

const failures = []
function check(ok, label, detail = '') {
  if (ok) console.log('  ✓', label)
  else {
    console.log('  ✗', label, detail)
    failures.push(label + (detail ? ' — ' + detail : ''))
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url)
      // Además de responder, el HTML debe apuntar a los assets bajo el `base`
      // que se está probando: así un servidor ajeno en el puerto no pasa por
      // bueno y se detecta un build hecho con otra ruta base.
      if (r.ok) {
        const html = await r.text()
        if (html.includes(`${BASE_PATH}assets/`)) return
        throw new Error(
          `El servidor en ${url} no sirve el build con base "${BASE_PATH}". ` +
            `Reconstruye con BASE_PATH="${BASE_PATH}" antes de correr las pruebas.`,
        )
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('El servidor')) throw e
      /* todavía no levanta */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  throw new Error('El servidor de preview no respondió a tiempo: ' + url)
}

const server = spawn(
  'npx',
  ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1', '--strictPort'],
  { cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore' },
)

let browser
try {
  await waitForServer(ROOT)
  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })

  const consoleErrors = []
  const failedRequests = []
  context.on('page', (page) => {
    page.on('console', (m) => {
      // Los fallos de red se auditan aparte, con su URL, en `failedRequests`.
      if (m.type() === 'error' && !m.text().includes('Failed to load resource')) {
        consoleErrors.push(`[${page.url()}] ${m.text()}`)
      }
    })
    page.on('pageerror', (e) => consoleErrors.push(`[${page.url()}] ${e.message}`))
    page.on('requestfailed', (r) => failedRequests.push(r.url()))
  })

  const page = await context.newPage()

  /* ── 1. Cada ruta carga por enlace directo ──────────────────────────── */
  for (const route of ROUTES) {
    console.log(`\n▸ ${BASE_PATH}${route.path}`)
    const res = await page.goto(ROOT + route.path, { waitUntil: 'networkidle' })

    check(res?.status() === 200, 'responde 200 al recargar', 'status ' + res?.status())
    check(
      (await page.locator('h1').first().innerText()).length > 0,
      'renderiza un encabezado',
    )
    check(
      await page.getByRole('navigation', { name: 'Módulos' }).isVisible(),
      'muestra la sidebar de módulos',
    )

    if (route.path === '') {
      const links = await page.locator('main a[href]').count()
      check(links === 8, 'la portada lista 8 tarjetas', 'encontradas ' + links)
      continue
    }

    check(
      (await page.locator('h1').first().innerText()) === route.name,
      'el título del módulo es el esperado',
    )

    const svgs = await page.locator('.recharts-surface').count()
    check(svgs >= 1, 'dibuja al menos un gráfico', svgs + ' svg')

    const cards = await page.locator('[data-testid="result-card"]').count()
    check(cards === route.cards, `muestra ${route.cards} tarjetas de resultado`, 'vi ' + cards)

    const nan = await page.locator('main').innerText()
    check(!/NaN|undefined|Infinity/.test(nan), 'no hay NaN/undefined en pantalla')

    /* Pestaña Explicación */
    await page.getByRole('tab', { name: 'Explicación' }).click()
    await page.waitForTimeout(120)
    const doc = await page.locator('main article').innerText()
    check(doc.includes('¿Qué hace esta simulación?'), 'la pestaña Explicación tiene contenido')
    check(doc.includes('Utilidad en los negocios'), 'incluye el bloque de utilidad en negocios')
    await page.getByRole('tab', { name: 'Simulador' }).click()
    await page.waitForTimeout(120)

    /* Mover el primer slider recalcula y queda en la URL */
    const results = () =>
      page.locator('[data-testid="result-card"]').allInnerTexts().then((t) => t.join('|'))

    const before = await results()
    const slider = page.locator('[data-slot="slider-thumb"]').first()
    await slider.focus()
    for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    const after = await results()
    check(before !== after, 'mover un slider recalcula los resultados')
    check(page.url().includes('?'), 'el escenario queda serializado en la URL')

    /* El escenario compartido se restaura al recargar */
    const shared = page.url()
    await page.goto(shared, { waitUntil: 'networkidle' })
    check(
      (await results()) === after,
      'recargar el enlace compartido restaura el escenario',
    )
  }

  /* ── 2. Botones por turnos del Beer Game ────────────────────────────── */
  console.log('\n▸ Beer Game — acciones por turnos')
  await page.goto(ROOT + 'beer-game', { waitUntil: 'networkidle' })
  const week = () => page.locator('[data-testid="result-card"]').first().innerText()
  check((await week()).includes('8'), 'arranca en la semana 8')
  await page.getByRole('button', { name: 'Avanzar 1 semana' }).click()
  await page.waitForTimeout(120)
  check((await week()).includes('9'), 'avanza una semana')
  await page.getByRole('button', { name: '+5 semanas' }).click()
  await page.waitForTimeout(120)
  check((await week()).includes('14'), 'avanza cinco semanas')
  await page.getByRole('button', { name: 'Correr a 40' }).click()
  await page.waitForTimeout(200)
  check((await week()).includes('40'), 'corre hasta la semana 40')
  await page.getByRole('button', { name: 'Reiniciar' }).click()
  await page.waitForTimeout(120)
  check((await week()).includes('8'), 'reinicia a la semana 8')

  /* ── 3. Cola saturada: ∞ en vez de NaN ──────────────────────────────── */
  console.log('\n▸ Colas — saturación')
  await page.goto(ROOT + 'colas?lam=90&mu=1&c=1', { waitUntil: 'networkidle' })
  const colas = await page.locator('main').innerText()
  check(colas.includes('∞'), 'la saturación se muestra como ∞')
  check(colas.includes('saturado'), 'aparece el aviso de saturación')
  check(!colas.includes('NaN'), 'sin NaN en saturación')

  /* ── 4. Navegación por la sidebar ───────────────────────────────────── */
  console.log('\n▸ Navegación')
  await page.goto(ROOT, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: /Efecto látigo/ }).first().click()
  await page.waitForTimeout(400)
  check(page.url().includes('/efecto-latigo'), 'la sidebar navega al módulo')
  check(
    (await page.locator('h1').first().innerText()) === 'Efecto látigo',
    'el módulo destino renderiza',
  )

  /* ── 5. Ruta inexistente ────────────────────────────────────────────── */
  await page.goto(ROOT + 'no-existe', { waitUntil: 'networkidle' })
  check((await page.locator('main').innerText()).includes('404'), 'una ruta inválida da la página 404')

  /* ── 6. Ancho de teléfono ───────────────────────────────────────────── */
  console.log('\n▸ Responsivo (390 px)')
  const phone = await context.newPage()
  await phone.setViewportSize({ width: 390, height: 844 })
  await phone.goto(ROOT + 'eoq', { waitUntil: 'networkidle' })
  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  check(overflow <= 1, 'no hay scroll horizontal a 390 px', 'desborde ' + overflow + 'px')
  check(
    await phone.getByRole('button', { name: 'Módulos' }).isVisible(),
    'la sidebar se convierte en menú superior',
  )
  await phone.getByRole('button', { name: 'Módulos' }).click()
  await phone.waitForTimeout(150)
  check(
    await phone.getByRole('navigation', { name: 'Módulos' }).isVisible(),
    'el menú superior se despliega',
  )

  /* ── 7. Consola y red limpias ───────────────────────────────────────── */
  console.log('\n▸ Consola y red')
  check(consoleErrors.length === 0, 'ningún error de consola', consoleErrors.slice(0, 5).join(' | '))

  const own = [...new Set(failedRequests.filter((u) => u.startsWith(ORIGIN)))]
  check(own.length === 0, 'ningún asset propio falló al cargar', own.slice(0, 5).join(' | '))

  const external = [...new Set(failedRequests.filter((u) => !u.startsWith(ORIGIN)))]
  if (external.length) {
    // La hoja de Google Fonts no es alcanzable desde este sandbox; en producción
    // sí lo es, y la pila de respaldo (system-ui) mantiene la página legible.
    console.log('  ⚠ recursos externos no alcanzables desde este entorno:')
    for (const u of external) console.log('      ', u)
  }
} finally {
  await browser?.close()
  server.kill('SIGTERM')
}

console.log('\n' + '─'.repeat(60))
if (failures.length) {
  console.log(`FALLARON ${failures.length} comprobaciones:`)
  for (const f of failures) console.log('  ·', f)
  process.exit(1)
}
console.log('Todas las comprobaciones de humo pasaron.')
