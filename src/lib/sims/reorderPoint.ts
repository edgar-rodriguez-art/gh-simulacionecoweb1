import { fmt } from '@/lib/format'
import { invNorm, normals } from '@/lib/stats'
import { INK, RED, RED_D, mergeSeries, type Simulator } from './types'

export type ReorderParams = {
  dm: number
  sd: number
  L: number
  sl: number
}

/** Simulación día a día del inventario con demanda normal y entrega fija. */
export function simROP(p: ReorderParams, days: number, seed: number) {
  const z = invNorm(p.sl / 100)
  const ss = z * p.sd * Math.sqrt(p.L)
  const rop = p.dm * p.L + ss
  const Q = Math.max(50, Math.round(p.dm * 14))
  const nz = normals(seed, days)

  let inv = rop + Q
  let faltante = 0
  let sum = 0
  let ciclos = 0
  let cicloFalla = 0
  let pend: { q: number; eta: number }[] = []
  const trace: [number, number][] = []

  for (let t = 0; t < days; t++) {
    pend = pend.filter((o) => {
      if (o.eta === t) {
        inv += o.q
        return false
      }
      return true
    })
    const dem = Math.max(0, p.dm + p.sd * nz[t])
    const serv = Math.min(inv, dem)
    faltante += dem - serv
    inv -= serv
    if (inv <= rop && pend.length === 0) {
      pend.push({ q: Q, eta: t + p.L })
      ciclos++
      if (inv < 0.001) cicloFalla++
    }
    sum += inv
    trace.push([t, inv])
  }

  return {
    trace,
    ss,
    rop,
    Q,
    faltante,
    avg: sum / days,
    ciclos,
    cicloFalla,
    demTotal: p.dm * days,
  }
}

export const reorderPoint: Simulator<ReorderParams> = {
  id: 'punto-reorden',
  route: '/punto-reorden',
  num: '04',
  area: 'Inventarios',
  title: 'Punto de reorden con demanda variable',
  blurb:
    'Simule el diente de sierra día a día y mida qué colchón exige cada nivel de servicio.',

  defaults: { dm: 50, sd: 18, L: 7, sl: 95 },

  params: [
    {
      key: 'dm',
      label: 'd̄ — demanda diaria promedio',
      min: 5,
      max: 200,
      step: 5,
      help: 'Unidades por día.',
    },
    {
      key: 'sd',
      label: 'σ — desviación de la demanda diaria',
      min: 0,
      max: 80,
      step: 1,
      help: 'La incertidumbre: es lo que obliga a tener colchón.',
    },
    {
      key: 'L',
      label: 'L — tiempo de entrega (días)',
      min: 1,
      max: 30,
      step: 1,
      help: 'El riesgo crece con √L.',
    },
    {
      key: 'sl',
      label: 'Nivel de servicio (%)',
      min: 80,
      max: 99.5,
      step: 0.5,
      help: 'Probabilidad de no agotarse durante la entrega.',
      format: (v) => fmt(v, 1) + '%',
    },
  ],

  run(p, ctx) {
    const days = 180
    const r = simROP(p, days, ctx.seed)

    return {
      chart: {
        kind: 'line',
        title: 'Inventario simulado, 180 días',
        note: 'Cada caída es demanda diaria aleatoria; cada salto es la llegada de un pedido.',
        xLabel: 'Día',
        yLabel: 'Unidades',
        data: mergeSeries([{ key: 'inventario', pts: r.trace }]),
        series: [{ key: 'inventario', label: 'Inventario', color: INK, width: 1.8 }],
        legend: [
          { label: 'Inventario', color: INK },
          { label: 'Punto de reorden', color: RED },
        ],
        refLines: [
          { y: r.rop, color: RED, label: 'ROP ' + fmt(r.rop, 0) },
          { y: r.ss, color: RED_D, label: 'Seguridad ' + fmt(r.ss, 0) },
        ],
      },
      metrics: [
        {
          label: 'Punto de reorden',
          value: fmt(r.rop, 0) + ' u',
          note: 'd̄·L = ' + fmt(p.dm * p.L, 0) + ' + colchón ' + fmt(r.ss, 0) + '.',
        },
        {
          label: 'Inventario de seguridad',
          value: fmt(r.ss, 0) + ' u',
          note: 'z = ' + fmt(invNorm(p.sl / 100), 2) + ' para ' + fmt(p.sl, 1) + '% de servicio.',
        },
        {
          label: 'Costo del colchón',
          value: fmt(r.ss / Math.max(1, p.dm), 1) + ' días',
          note: 'Días de venta inmovilizados.',
        },
        {
          label: 'Inventario promedio',
          value: fmt(r.avg, 0) + ' u',
          note: 'Sobre la simulación de 180 días.',
        },
        {
          label: 'Unidades no surtidas',
          value: fmt(r.faltante, 0) + ' u',
          note: 'Fill rate ' + fmt((1 - r.faltante / r.demTotal) * 100, 2) + '%.',
        },
        {
          label: 'Ciclos con faltante',
          value: fmt(r.cicloFalla, 0) + ' de ' + fmt(r.ciclos, 0),
          note: 'Reposiciones que llegaron tarde.',
        },
      ],
    }
  },
}
