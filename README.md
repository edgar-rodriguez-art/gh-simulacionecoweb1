# SimulacionEcoWeb1

Laboratorio web de **ocho simuladores interactivos** de economía, finanzas,
inventarios, cadena de suministro y colas. Cada módulo corre con matemática
real en el navegador, se recalcula al mover cualquier parámetro y trae una
pestaña de explicación con fórmulas, significado de cada parámetro, efectos
observables y utilidad en los negocios.

Sin backend, sin base de datos y sin cuenta de usuario: todo el cálculo ocurre
en el cliente.

## Los ocho módulos

| # | Ruta | Módulo | Área |
| --- | --- | --- | --- |
| — | `/` | Índice general | — |
| 01 | `/oferta-demanda` | Oferta y demanda | Economía |
| 02 | `/interes-compuesto` | Interés compuesto | Finanzas |
| 03 | `/eoq` | Cantidad económica de pedido | Inventarios |
| 04 | `/punto-reorden` | Punto de reorden con demanda variable | Inventarios |
| 05 | `/revision` | Revisión continua vs. periódica | Inventarios |
| 06 | `/efecto-latigo` | Efecto látigo | Cadena |
| 07 | `/beer-game` | Beer Game simplificado | Cadena |
| 08 | `/colas` | Teoría de colas y cuellos de botella | Servicio |

Los parámetros de cada módulo se serializan en el query string, así que un
escenario concreto se comparte copiando la URL:
`/eoq?D=48000&S=1200` abre el simulador con esos valores.

## Stack

| Capa | Tecnología | Versión |
| --- | --- | --- |
| Lenguaje | TypeScript | 6.0.3 |
| UI | React | 19.2.8 |
| Build | Vite | 6.4.3 (`@tailwindcss/vite`) |
| Estilos | Tailwind CSS | 4.3.3 |
| Componentes | shadcn/ui sobre Radix UI | — |
| Gráficos | Recharts | 3.10.1 |
| Rutas | React Router | 7.18.3 (modo librería, sin SSR) |
| Estado | `useState` / `useMemo` | — |
| Hosting | GitHub Pages (GitHub Actions) | — |

## Desarrollo

```bash
npm install
npm run dev          # servidor de desarrollo
npm run typecheck    # tsc --build
npm test             # pruebas unitarias (vitest)
npm run build        # dist/ listo para publicar
npm run preview      # sirve el build
npm run e2e          # prueba de humo en Chromium sobre el build
```

### La ruta base

Es el detalle que decide si el sitio se ve o queda en blanco: si el `base` no
coincide con la carpeta donde se sirve, el HTML pide el JS bajo un prefijo que
no existe, `#root` nunca se llena y la página aparece vacía **sin error
visible**. Por eso el build lo resuelve solo:

| Host | Se sirve en | `base` |
| --- | --- | --- |
| GitHub Pages | `usuario.github.io/gh-simulacionecoweb1/` | `/gh-simulacionecoweb1/` (por defecto) |
| Cloudflare Pages | raíz de `proyecto.pages.dev` | `/` (detectado por `CF_PAGES`) |

`BASE_PATH` manda sobre ambos, para un dominio propio u otro host:

```bash
BASE_PATH=/ npm run build
```

## Estructura

```
src/
  main.tsx  router.tsx  App.tsx        shell, rutas y sidebar
  components/
    ui/                                shadcn/ui sobre Radix (radio 0, tokens Modernist)
    SimLayout.tsx                      encabezado + pestañas + rejilla de paneles
    ParamSlider.tsx  ResultCard.tsx  ChartFrame.tsx  ExplainPanel.tsx
  lib/
    format.ts                          fmt(), money() en es-MX
    stats.ts                           invNorm(), rng(), normals(), cv()
    sims/                              un Simulator<P> puro por módulo, sin React
  content/
    modules.ts                         metadatos de los ocho módulos
    explain.tsx                        texto de la pestaña Explicación
  pages/                               una página por ruta
```

Cada archivo de `src/lib/sims/` exporta un `Simulator<P>` sin dependencia de
React: sus defaults, la especificación de sus sliders y una función `run(p, ctx)`
pura que devuelve métricas y gráficos. Las páginas sólo mapean esa salida a
componentes, así que la lógica se prueba sin montar la interfaz.

Las simulaciones con aleatoriedad (04, 05, 06) usan un LCG determinista con
semilla fija — nunca `Math.random()` — para que un mismo escenario dé siempre
el mismo resultado y los enlaces compartidos sean reproducibles.

## Pruebas

`npm test` corre 48 pruebas unitarias. Las más importantes comparan la salida
de cada módulo contra `src/lib/sims/__tests__/golden.json`, un archivo dorado
**generado ejecutando la lógica del prototipo original de Claude Design**: las
seis tarjetas de resultado, los rangos y valores por defecto de cada slider y
los títulos de los gráficos deben coincidir carácter por carácter con el
diseño aprobado. El resto barre cada parámetro por sus extremos para
garantizar que ningún módulo produce `NaN`, verifica la cola M/M/c contra
valores de libro y la ley de Little, y comprueba el determinismo de la semilla.

`npm run e2e` levanta el build en Chromium y recorre las nueve rutas:
comprueba que cada una carga por enlace directo, dibuja sus gráficos y sus
seis tarjetas, que la pestaña Explicación tiene contenido, que mover un slider
recalcula y queda en la URL, que los botones del Beer Game avanzan el turno,
que la saturación de la cola muestra `∞` y no `NaN`, que no hay scroll
horizontal a 390 px y que la consola queda limpia.

## Despliegue

El proyecto publica igual en los dos hosts; sólo cambia el `base` y la forma
de resolver el fallback de rutas.

### GitHub Pages

Cada push a `main` dispara `.github/workflows/deploy.yml`, que verifica tipos,
corre las pruebas, construye y publica. El workflow copia `index.html` a
`404.html` para que recargar `/eoq` o abrir un enlace compartido no dé 404
(GitHub Pages no reescribe rutas por sí solo).

Para que funcione, en **Settings → Pages** del repositorio la opción *Source*
debe estar en **GitHub Actions**.

### Cloudflare Pages

En **Workers & Pages → el proyecto → Settings → Build**:

| Campo | Valor |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(vacío)* |

No hace falta configurar variables: Cloudflare define `CF_PAGES=1` en sus
builds y `vite.config.ts` pone el `base` en `/` por eso. El fallback SPA lo da
`public/_redirects` (`/* /index.html 200`), que se copia a `dist/` en el build.

## Origen del diseño

La interfaz viene de un prototipo hecho en Claude Design
(`Simuladores Económicos.dc.html`) con el design system **Modernist**: paleta
tinta/rojo sobre gris cálido, tipografía Archivo, radio 0 en todo, sin
gradientes ni sombras decorativas, todo alineado a la izquierda. El contrato
completo entre diseño e implementación está en
[`docs/README-handoff.md`](docs/README-handoff.md).
