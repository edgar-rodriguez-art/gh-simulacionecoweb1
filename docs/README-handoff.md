# README-handoff.md — Laboratorio de Simuladores de Economía y Operaciones

Puente entre el diseño (Claude Design) y la implementación (Claude Code Web).
Diseño de referencia: **`Simuladores Económicos.dc.html`** en este proyecto — es un prototipo **funcional**: toda la matemática descrita aquí ya está implementada y validada en su clase lógica. Úsalo como especificación ejecutable, no solo como mockup visual.

> **Regla de mantenimiento:** si el diseño cambia (nuevo módulo, parámetro, métrica o gráfico), este archivo se actualiza en el mismo commit. La tabla de módulos y la de parámetros son el contrato.

---

## 1. Stack y decisiones fijas

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Lenguaje | TypeScript | 6.0.x |
| UI | React | 19.2.x |
| Build | Vite | 6.4.x (`@tailwindcss/vite`) |
| Estilos | Tailwind CSS | 4.3.x |
| Componentes | shadcn/ui (Radix) | CLI 4.x |
| Gráficos | Recharts | 3.10.x |
| Rutas | React Router | 7.18.x — modo **librería**, `createBrowserRouter`, sin SSR |
| Estado | `useState` / `useReducer` | — |
| Hosting | Cloudflare Pages (Free), Build System v3 | build `npm run build`, output `dist`, SPA fallback a `/index.html` |

No agregar librería de estado global, ni backend, ni base de datos. Todo el cálculo ocurre en el cliente en cada render.

---

## 2. Estructura de carpetas y rutas

```
src/
  main.tsx
  router.tsx
  App.tsx                  # shell: sidebar + <Outlet/>
  components/
    ui/                    # shadcn: slider, tabs, card, button, tooltip, badge, separator
    SimLayout.tsx          # encabezado + Tabs(Simulador|Explicación) + rejilla de paneles
    ParamSlider.tsx        # label + valor formateado + Slider + texto de ayuda
    ResultCard.tsx         # label / valor grande / nota
    ChartFrame.tsx         # título + nota + ResponsiveContainer + leyenda
    ExplainPanel.tsx       # renderiza el contenido de la pestaña Explicación
  lib/
    format.ts              # fmt(), money() — locale es-MX
    stats.ts               # invNorm(), rng(), normals(), cv()
    sims/
      supplyDemand.ts  compound.ts  eoq.ts  reorderPoint.ts
      reviewPolicies.ts  bullwhip.ts  beerGame.ts  queueing.ts
  content/
    modules.ts             # metadatos de los 8 módulos (num, área, título, blurb)
    explain/*.mdx|.ts      # texto de la pestaña Explicación por módulo
  pages/
    Index.tsx
    OfertaDemanda.tsx  InteresCompuesto.tsx  Eoq.tsx  PuntoReorden.tsx
    Revision.tsx  EfectoLatigo.tsx  BeerGame.tsx  Colas.tsx
```

Rutas (una por simulador, enlazables):

| # | Ruta | Página |
| --- | --- | --- |
| — | `/` | Índice con 8 tarjetas |
| 01 | `/oferta-demanda` | Oferta y demanda |
| 02 | `/interes-compuesto` | Interés compuesto |
| 03 | `/eoq` | Cantidad económica de pedido |
| 04 | `/punto-reorden` | Punto de reorden con demanda variable |
| 05 | `/revision` | Revisión continua vs. periódica |
| 06 | `/efecto-latigo` | Efecto látigo |
| 07 | `/beer-game` | Beer Game simplificado |
| 08 | `/colas` | Teoría de colas y cuellos de botella |

Opcional recomendado: serializar los parámetros en el query string (`?a=1000&b=8`) para compartir un escenario concreto. Un `useSearchParams` por página basta; el estado sigue siendo local.

---

## 3. Contratos de tipos

```ts
// lib/sims/types.ts
export type ParamSpec<K extends string> = {
  key: K; label: string; min: number; max: number; step: number;
  help: string; format?: (v: number) => string;
};

export type Metric = { label: string; value: string; note: string };

export type Point = { x: number; y: number };
export type SeriesSpec = { key: string; label: string; color: string; dashed?: boolean; area?: boolean };

export type SimResult = {
  metrics: Metric[];
  chart: {                        // gráfico principal
    kind: 'line' | 'bar';
    title: string; note: string;
    xLabel: string; yLabel: string;
    data: Record<string, number>[];   // filas listas para Recharts
    series: SeriesSpec[];
    refLines?: { y: number; label: string; color: string }[];
  };
  chart2?: SimResult['chart'];    // gráfico secundario (látigo, beer game, colas)
};

export type Simulator<P> = {
  id: string; route: string; num: string; area: string; title: string; blurb: string;
  defaults: P;
  params: ParamSpec<Extract<keyof P, string>>[];
  run: (p: P, ctx?: { seed?: number; week?: number }) => SimResult;
};
```

Cada archivo en `lib/sims/` exporta un `Simulator<P>` puro y sin dependencia de React. Las páginas solo hacen `useState<P>(sim.defaults)` y mapean `sim.params` → `<ParamSlider>`, `result.metrics` → `<ResultCard>`, `result.chart` → `<ChartFrame>`.

Semilla aleatoria: los módulos 04, 05 y 06 usan un LCG determinista (`rng(seed)` + Box-Muller en `normals`) para que el mismo escenario dé siempre el mismo resultado. Semilla por defecto: `7 * 7919 + 13`. **No usar `Math.random()`.**

---

## 4. Los ocho módulos

### 01 · Oferta y demanda — `/oferta-demanda`
**Fórmulas.** `Qd = a − b·P` · `Qs = c + d·(P − t)` · `P* = (a − c + d·t)/(b + d)` · `Q* = a − b·P*` · `EC = ½·Q*·(a/b − P*)` · recaudación `= t·Q*` · traslado al consumidor `= (P* − P*₍t=0₎)/t`.
**Parámetros (slider, defaults).** `a` demanda máxima 400–2000 paso 20 (1000) · `b` sensibilidad demanda 2–30 paso 0.5 (8) · `c` oferta autónoma 0–600 paso 10 (100) · `d` sensibilidad oferta 1–30 paso 0.5 (6) · `t` impuesto por unidad 0–40 paso 1 (0).
**Gráfico.** `LineChart` — eje X cantidad, eje Y precio; dos series (demanda tinta, oferta roja) muestreadas en 61 puntos sobre `P ∈ [0, a/b]`; `ReferenceLine y = P*`; punto marcado en el equilibrio.
**Resultados.** P*, Q*, ingreso total, excedente del consumidor, excedente del productor, recaudación + % de traslado.

### 02 · Interés compuesto — `/interes-compuesto`
**Fórmulas.** tasa mensual equivalente `i_m = (1 + r/m)^(m/12) − 1`; iteración mensual `bal ← bal·(1 + i_m) + A` durante `N = 12n` meses; `TEA = (1 + r/m)^m − 1`; saldo real `= bal/(1 + infl)^años`; regla del 72 `= 72/r%`.
**Parámetros.** `p0` 0–500 000 paso 5 000 (20 000) · `ap` aporte mensual 0–20 000 paso 250 (2 000) · `r` % nominal 0–25 paso 0.25 (9) · `m` capitalizaciones 1–12 (12) · `n` años 1–40 (20) · `inf` % 0–15 paso 0.25 (4).
**Gráfico.** `ComposedChart` — `Area` de capital aportado (gris), `Line` de saldo nominal (rojo), `Line` punteada de saldo real. Eje X en años.
**Resultados.** saldo nominal final, total aportado, interés generado (+ % del saldo), saldo en pesos de hoy, TEA, años para duplicar.

### 03 · EOQ — `/eoq`
**Fórmulas.** `EOQ = √(2·D·S/H)` · `CT(Q) = (D/Q)·S + (Q/2)·H` · pedidos/año `= D/Q` · ciclo `= 365/(D/Q)` · sobrecosto `= CT(Q_actual) − CT(EOQ)`.
**Parámetros.** `D` 1 000–100 000 paso 1 000 (24 000) · `S` 50–5 000 paso 50 (900) · `H` 2–200 paso 1 (35) · `Q` lote actual 100–10 000 paso 50 (1 600).
**Gráfico.** `LineChart` de tres curvas sobre `Q ∈ (0, max(2.6·EOQ, 1.25·Q)]` en 80 puntos: mantener, pedir, total; punto en el óptimo; `ReferenceLine` en el costo mínimo. Recortar el eje Y a `3·CT(EOQ)` para que la asíntota no aplaste la curva.
**Resultados.** EOQ, pedidos/año + días de ciclo, costo total óptimo, costo con el lote actual, sobrecosto (+%), inventario promedio y su costo.

### 04 · Punto de reorden — `/punto-reorden`
**Fórmulas.** `z = Φ⁻¹(nivel de servicio)` (implementar Acklam en `invNorm`) · `SS = z·σ·√L` · `ROP = d̄·L + SS` · lote de reposición `Q = round(14·d̄)` · fill rate `= 1 − faltantes/demanda total`.
**Simulación.** 180 días. Por día: recibir pedidos con `eta = t`, demanda `max(0, d̄ + σ·Z_t)`, surtir lo que haya, acumular faltante, y si `inv ≤ ROP` y no hay pedido en tránsito, lanzar `Q` con `eta = t + L`.
**Parámetros.** `dm` 5–200 paso 5 (50) · `sd` 0–80 paso 1 (18) · `L` 1–30 (7) · `sl` 80–99.5 paso 0.5 (95).
**Gráfico.** `LineChart` del diente de sierra (180 puntos) + `ReferenceLine` en ROP y en el inventario de seguridad.
**Resultados.** ROP (descompuesto en demanda del lead time + colchón), SS, colchón en días de venta, inventario promedio, unidades no surtidas + fill rate, ciclos con faltante.

### 05 · Revisión continua vs. periódica — `/revision`
**Fórmulas.** continua `s = d̄·L + z·σ·√L`, pide `Q` fijo; periódica `R = d̄·(T + L) + z·σ·√(T + L)`, pide `R − posición` cada `T` días. Ambas corren sobre **la misma serie de choques** `Z_t` (misma semilla) para que la comparación sea válida.
**Parámetros.** `dm` 5–200 (50) · `sd` 0–80 (18) · `L` 1–21 (7) · `T` 3–45 (14) · `Q` 100–3 000 paso 50 (700) · `sl` 80–99.5 (95).
**Gráfico.** dos trazas de inventario superpuestas (continua tinta, periódica roja) + `ReferenceLine` en `s` y en `R`.
**Resultados.** inventario promedio de cada política y número de pedidos, inventario extra de la periódica (+%), los dos colchones, fill rate comparado.

### 06 · Efecto látigo — `/efecto-latigo`
**Modelo.** 52 semanas, 4 eslabones (Minorista, Mayorista, Distribuidor, Fábrica), demanda base 100 con salto en la semana 10.
`f_t = α·o_t + (1 − α)·f_(t−1)` · `objetivo = f_t·(L + 1) + z·σ·√(L + 1)` · `posición = inv + en tránsito` · `pedido = max(0, objetivo − posición)`; el pedido de un eslabón es la demanda entrante del siguiente, con retraso `L`.
**Amplificación.** `CV(pedidos del eslabón)/CV(demanda final)`, con `CV = σ/μ`.
**Parámetros.** `sd` 0–40 (8) · `jump` 0–60 paso 5 (20) · `L` 1–6 (2) · `alpha` 0.05–1 paso 0.05 (0.6) · `z` 0–3 paso 0.1 (1.6).
**Gráficos.** (1) `LineChart` de 5 series: demanda final punteada + un pedido por eslabón. (2) `BarChart` de amplificación por eslabón, con la etiqueta `×` sobre cada barra.
**Resultados.** una tarjeta por eslabón con su amplificación y su pico de pedido, más CV de la demanda final y amplificación total.

### 07 · Beer Game simplificado — `/beer-game`
**Modelo por turnos.** Estado de juego = `week` (inicia en 8, tope 60); la simulación es pura y se recalcula desde la semana 0 en cada render. Demanda `= base + (t ≥ 5 ? jump : 0)`.
Por eslabón y semana: recibir en tránsito → `entrante = pedido del cliente + backlog` → `envío = min(inv, entrante)` → `backlog = entrante − envío` → `posición = inv − backlog + en tránsito` → `pedido = max(0, demanda percibida + β·(objetivo − posición))` → costo `= 1·inv + 2·backlog`.
**Parámetros.** `base` 2–30 (8) · `jump` 0–30 (8) · `L` 1–5 (2) · `beta` 0–1.5 paso 0.05 (0.5) · `target` 0–80 paso 2 (24).
**Acciones (botones).** Avanzar 1 semana · +5 semanas · Correr a 40 · Reiniciar (vuelve a 8).
**Gráficos.** (1) `LineChart` de posición neta (`inv − backlog`) por eslabón con `ReferenceLine y = 0`. (2) `BarChart` de costo acumulado por eslabón.
**Resultados.** semana actual, costo total de la cadena, pedido vigente de la fábrica vs. demanda real, backlog máximo, costo del minorista, costo de la fábrica.

### 08 · Colas y cuellos de botella — `/colas`
**Fórmulas M/M/c.** `a = λ/μ`, `ρ = a/(c)` con `ρ = λ/(c·μ)`;
`P₀ = 1 / (Σ_{n=0}^{c−1} aⁿ/n! + a^c/(c!·(1 − ρ)))` · `Lq = P₀·a^c·ρ/(c!·(1 − ρ)²)` · `Wq = Lq/λ` · `W = Wq + 1/μ` · `L = λ·W` · `P(esperar) = P₀·a^c/(c!·(1 − ρ))`. Si `ρ ≥ 1`, devolver `Infinity` y mostrar `∞` con el aviso de saturación.
**Cuello de botella.** `rendimiento = min(λ, min(cap₁, cap₂, cap₃))`; resaltar en rojo la etapa mínima.
**Parámetros.** `lam` 1–90 (34) · `mu` 1–40 (12) · `c` 1–10 (3) · `e1` 5–80 (40) · `e2` 5–80 (30) · `e3` 5–80 (45).
**Gráficos.** (1) `LineChart` de `Wq` en minutos contra `ρ` (%) barriendo `λ` hasta `0.985·c·μ` en 70 puntos, con `ReferenceLine` en el punto de operación. (2) `BarChart` de capacidades por etapa con `ReferenceLine` en λ.
**Resultados.** ρ (con semáforo textual: manejable / crítica / saturada), Wq, W, Lq, P(esperar), rendimiento del proceso con la etapa que lo limita.

---

## 5. Pestaña “Explicación”

Cada módulo tiene, en una **pestaña aparte** (shadcn `Tabs`: *Simulador* | *Explicación*), cinco bloques con esta estructura fija — el texto ya redactado está en el prototipo y debe migrarse literal:

1. **¿Qué hace esta simulación?** — un párrafo.
2. **Fórmulas** — bloque destacado (fondo `--color-surface`, borde izquierdo rojo de 3 px, tipografía Archivo 600).
3. **Parámetros** — lista con `<strong>símbolo — nombre:</strong>` y su significado económico, no su definición matemática.
4. **Efectos que se observan** — qué pasa al mover cada palanca (no linealidades, umbrales).
5. **Utilidad en los negocios** — decisiones reales que apoya.

Al final del artículo, nota de límites del modelo (linealidad, normalidad, estacionariedad). Ancho máximo `80ch`.

---

## 6. Decisiones visuales ya tomadas (design system Modernist)

Tokens (de `styles.css` del sistema; replicar como variables CSS y mapear en `tailwind.config`/`@theme`):

`--color-bg #f3f2f2` · `--color-surface #eae9e9` · `--color-text #201e1d` · `--color-accent #ec3013` · `--color-accent-700 #ae1800` · neutros `#d7d3d3` (reglas finas), `#9b9797`, `#605d5d`.
Tipografía única: **Archivo** (400 / 600 / 800). Títulos 800, `letter-spacing −0.015em`, `line-height 1.12`.
Espaciado 4 / 8 / 12 / 16 / 24 / 32 px. **Radio 0 en todo** (`rounded-none`; ajustar el preset de shadcn). Sin gradientes, sin sombras decorativas.

Reglas de composición del diseño:
- **Sidebar fija de 250 px** con índice general + los 8 módulos numerados; el activo se invierte (fondo tinta, texto claro); borde derecho de 2 px.
- Rejilla de paneles con separadores de 2 px (`gap: 2px` sobre fondo `--color-divider`): columna de parámetros (≈300 px) · columna de gráficos (flexible) · fila completa de resultados.
- Todo **alineado a la izquierda**, incluidas las etiquetas de los botones.
- Cada slider: etiqueta con símbolo (`d̄ — demanda diaria promedio`), valor formateado a la derecha en rojo `--color-accent-700`, texto de ayuda de una línea abajo.
- Tarjetas de resultado: etiqueta versalita 10.5 px, valor Archivo 800 a 23 px, nota de 11 px.
- Gráficos: sin curvas suavizadas (`type="linear"`), sin puntos por dato, rejilla horizontal gris 1 px, eje base tinta 2 px, líneas de referencia punteadas `5 4`. Leyenda propia debajo del gráfico (barras de 14×3 px), no la de Recharts.
- Números en `es-MX`; moneda con `$` y sin decimales salvo precios y tasas.
- Cero emoji. Iconos: Lucide, solo si son necesarios.

Componentes shadcn/ui a generar: `slider`, `tabs`, `card`, `button`, `separator`, `badge`, `tooltip`, `scroll-area`.

Accesibilidad: cada `Slider` con `aria-label` = etiqueta completa del parámetro; foco visible `outline: 2px solid var(--color-accent); outline-offset: 2px`; contraste de texto ≥ 4.5:1 (usar `--color-accent-700`, nunca `--color-accent`, para texto pequeño en rojo).

Responsivo: la rejilla colapsa a una columna por debajo de ~900 px; la sidebar pasa a `Sheet`/menú superior por debajo de ~700 px. Los `<svg>` de Recharts van en `ResponsiveContainer` con `aspect` ≈ 800/340.

---

## 7. Orden de implementación sugerido

1. Scaffold Vite + React + TS + Tailwind 4 + shadcn, tokens Modernist, shell con sidebar y rutas vacías.
2. `lib/format.ts`, `lib/stats.ts` (`invNorm`, `rng`, `normals`, `cv`) con pruebas puntuales: `invNorm(0.95) ≈ 1.6449`, `invNorm(0.99) ≈ 2.3263`.
3. Módulos cerrados (01, 02, 03, 08): solo fórmulas, sin simulación temporal.
4. Módulos con simulación (04, 05) reutilizando la misma serie de choques.
5. Cadena (06) y juego por turnos (07).
6. Contenido de la pestaña Explicación.
7. Deploy en Cloudflare Pages: `dist`, SPA fallback, dominio `*.pages.dev` público.

## 8. Criterios de aceptación

- Cada ruta carga y comparte por enlace directo; recargar `/eoq` no da 404 (fallback SPA).
- Mover cualquier slider recalcula gráfico y tarjetas sin parpadeo perceptible (< 16 ms por render; memoizar la corrida de simulación con `useMemo` sobre los parámetros).
- Los seis valores de resultado de cada módulo coinciden con el prototipo `Simuladores Económicos.dc.html` con los parámetros por defecto.
- `ρ ≥ 1` en colas muestra `∞` y el aviso de saturación, sin `NaN` en ningún módulo.
- Contraste y foco visibles; ningún borde redondeado.

---

## 9. Notas de la implementación (Claude Code Web)

Esta sección registra lo que cambió respecto al contrato de arriba, según la
regla de mantenimiento del encabezado. **Los ocho módulos, sus fórmulas, sus
parámetros y sus seis métricas se implementaron sin desviación**: hay una
prueba que los compara carácter por carácter contra la salida del prototipo.

### 9.1 Hosting: GitHub Pages en vez de Cloudflare Pages

Decisión del usuario al encargar la implementación. El contrato de build no
cambia (`npm run build`, salida `dist`, fallback SPA), sólo el destino:

- `base` de Vite = `/gh-simulacionecoweb1/`, sobreescribible con `BASE_PATH`.
- El fallback SPA se resuelve copiando `index.html` a `404.html` en el
  postbuild — GitHub Pages no tiene la regla de reescritura de Cloudflare.
- `basename` de `createBrowserRouter` = `import.meta.env.BASE_URL`.
- Publica `.github/workflows/deploy.yml` en cada push a `main`, previa
  verificación de tipos y pruebas.

### 9.2 Extensiones aditivas al contrato de tipos

`SimResult['chart']` ganó cuatro campos opcionales; ninguno rompe la forma
declarada en la sección 3:

| Campo | Por qué |
| --- | --- |
| `legend` | El orden de dibujo y el de lectura no coinciden (en EOQ el total va encima pero se lee primero), y hay entradas de leyenda que no son una serie sino una línea de referencia (ROP, punto de operación). El prototipo ya declaraba `legend` aparte de `series`. |
| `refDots` | El punto marcado en el equilibrio (01) y en el óptimo (03) — `ReferenceDot` de Recharts. |
| `xDomain` / `yDomain` | Ya estaban implícitos en el prototipo: recorte del eje Y a `3·CT(EOQ)` en el módulo 03 y eje X fijo a `[0, 100]` en el 08. |
| `xTick` / `yTick` | Formato del eje (el `%` de la utilización en el módulo 08). |

`SimResult` también lleva `actions`, que el módulo 07 usa para declarar sus
cuatro botones por turnos sin depender de React.

### 9.3 Series con rejillas de X distintas

En oferta y demanda las dos curvas se muestrean sobre precios, así que cada
una tiene su propia sucesión de cantidades y no comparten filas. Recharts
necesita un eje X común, de modo que `mergeSeries()` (en `lib/sims/types.ts`)
funde todas las curvas en filas ordenadas por X, dejando `null` donde una
serie no tiene punto, y los `<Line connectNulls>` reconstruyen cada trazo. Es
el mismo mecanismo para todos los módulos, compartan rejilla o no.

### 9.4 shadcn/ui

Los componentes (`slider`, `tabs`, `card`, `button`, `separator`, `badge`,
`tooltip`, `scroll-area`) se escribieron directamente en
`src/components/ui/` sobre los primitivos de Radix — que es exactamente lo que
el CLI deja en el proyecto — ya retunados al preset Modernist: radio 0,
tipografía Archivo 800 en los botones, etiquetas alineadas a la izquierda y
foco visible con el rojo de acento.

### 9.5 Verificación

- `src/lib/sims/__tests__/golden.json` se generó **ejecutando la lógica del
  propio `Simuladores Económicos.dc.html`** con stubs de `DCLogic`/`React`. Es
  el criterio de aceptación «los seis valores de resultado de cada módulo
  coinciden con el prototipo» convertido en prueba automática.
- Un barrido por los extremos de cada parámetro (× cuatro semanas del juego)
  comprueba que ningún módulo produce `NaN` ni en las métricas ni en los datos
  de los gráficos.
- `npm run e2e` recorre las nueve rutas en Chromium y verifica los criterios
  restantes: enlace directo sin 404, recálculo al mover un slider, `∞` en
  saturación, ausencia de scroll horizontal a 390 px y consola limpia.

### 9.6 Detalle heredado del prototipo

En el módulo 08 la etiqueta «Utilización ρ» se muestra en versalitas y la rho
griega minúscula se convierte en `Ρ` mayúscula, visualmente idéntica a una `P`
latina. El prototipo hace exactamente lo mismo (`text-transform: uppercase` y
`.toUpperCase()` sobre la etiqueta del eje), así que se conservó tal cual. Si
se prefiere ver `ρ`, basta con exceptuar esa etiqueta del `uppercase`.

### 9.7 Publicación en Cloudflare Pages (y por qué la página salía en blanco)

El contrato original apuntaba a Cloudflare Pages; la primera entrega se hizo a
GitHub Pages y el `base` de Vite quedó fijo en `/gh-simulacionecoweb1/`. Al
publicar después en Cloudflare, que sirve el sitio en la **raíz** de
`<proyecto>.pages.dev`, el HTML seguía pidiendo
`/gh-simulacionecoweb1/assets/index-*.js`: 404 en el JS y en el CSS, `#root`
vacío y **página en blanco sin ningún error a la vista**.

Es el modo de fallo típico de una SPA con el `base` equivocado, y no avisa: el
documento carga con estado 200 y sólo fallan los assets.

`vite.config.ts` ahora resuelve el caso solo:

```ts
const base = process.env.BASE_PATH ?? (process.env.CF_PAGES ? '/' : '/gh-simulacionecoweb1/')
```

Cloudflare define `CF_PAGES=1` en sus builds; GitHub Actions pasa `BASE_PATH`
explícito. Ningún host necesita configuración manual, y `BASE_PATH` sigue
mandando sobre ambos para un dominio propio.

Además se añadió `public/_redirects` con `/* /index.html 200`, que es como
Cloudflare hace el fallback SPA (el `404.html` del postbuild cubre lo mismo en
GitHub Pages). Los dos archivos conviven sin estorbarse: cada host ignora el
del otro.

Verificado en Chromium sobre los dos builds: sirviendo `dist/` en la raíz con
la regla de redirección, las seis rutas comprobadas montan la aplicación,
dibujan sus gráficos y sus seis tarjetas, sin errores de red ni de JS; y el
build por defecto sigue pasando la prueba de humo completa bajo
`/gh-simulacionecoweb1/`.
