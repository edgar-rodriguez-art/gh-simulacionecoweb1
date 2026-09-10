/** Contratos de tipos compartidos por los ocho simuladores. */

export type ParamSpec<K extends string> = {
  key: K
  label: string
  min: number
  max: number
  step: number
  help: string
  format?: (v: number) => string
}

export type Metric = { label: string; value: string; note: string }

export type SeriesSpec = {
  key: string
  label: string
  color: string
  /** Trazo punteado (`strokeDasharray`). */
  dashed?: boolean
  /** Rellena el área bajo la curva (capital aportado en interés compuesto). */
  area?: boolean
  width?: number
  /** Oculta la serie de la leyenda propia bajo el gráfico. */
  hideFromLegend?: boolean
}

export type Bound = number | 'auto' | 'dataMin' | 'dataMax'

export type ChartSpec = {
  kind: 'line' | 'bar'
  title: string
  note: string
  xLabel: string
  yLabel: string
  /** Filas listas para Recharts. En `kind: 'bar'` cada fila trae `name` y `color`. */
  data: Record<string, number | string | null>[]
  series: SeriesSpec[]
  /**
   * Leyenda propia bajo el gráfico. Se declara aparte de `series` porque el
   * orden de dibujo (z-order) y el orden de lectura no siempre coinciden, y
   * porque hay entradas que no son una serie (una línea de referencia).
   * Si se omite, se deriva de `series`.
   */
  legend?: { label: string; color: string }[]
  xDomain?: [Bound, Bound]
  yDomain?: [Bound, Bound]
  refLines?: { y: number; label: string; color: string }[]
  /** Punto marcado sobre la curva (equilibrio, óptimo). */
  refDots?: { x: number; y: number; color: string }[]
  /** Formato del eje X (por defecto es-MX sin decimales). */
  xTick?: (v: number) => string
  yTick?: (v: number) => string
}

export type SimAction = { label: string; kind: 'week+1' | 'week+5' | 'week=40' | 'reset' }

export type SimResult = {
  metrics: Metric[]
  chart: ChartSpec
  chart2?: ChartSpec
  /** Botones del juego por turnos (módulo 07). */
  actions?: SimAction[]
}

export type SimContext = { seed: number; week: number }

export type Simulator<P extends Record<string, number>> = {
  id: string
  route: string
  num: string
  area: string
  title: string
  blurb: string
  defaults: P
  params: ParamSpec<Extract<keyof P, string>>[]
  run: (p: P, ctx: SimContext) => SimResult
}

/* Paleta de las series — los mismos valores que usa el prototipo. */
export const INK = '#201e1d'
export const RED = '#ec3013'
export const RED_D = '#ae1800'
export const GREY = '#9b9797'
export const DARK = '#605d5d'

/**
 * Une varias curvas (cada una con su propia rejilla en X) en filas
 * `{ x, <key>: y, … }` ordenadas por X, dejando `null` donde una serie no
 * tiene punto. Los `<Line connectNulls>` de Recharts reconstruyen la curva.
 */
export function mergeSeries(
  curves: { key: string; pts: [number, number][] }[],
): Record<string, number | null>[] {
  const rows = new Map<number, Record<string, number | null>>()
  for (const { key, pts } of curves) {
    for (const [x, y] of pts) {
      let row = rows.get(x)
      if (!row) {
        row = { x }
        rows.set(x, row)
      }
      row[key] = Number.isFinite(y) ? y : null
    }
  }
  const keys = curves.map((c) => c.key)
  const out = [...rows.values()].sort((a, b) => (a.x as number) - (b.x as number))
  for (const row of out) {
    for (const k of keys) if (!(k in row)) row[k] = null
  }
  return out
}
