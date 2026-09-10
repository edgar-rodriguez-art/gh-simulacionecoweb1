import { fmt } from '@/lib/format'
import { invNorm, normals } from '@/lib/stats'
import { DARK, INK, RED, RED_D, mergeSeries, type Simulator } from './types'

export type ReviewParams = {
  dm: number
  sd: number
  L: number
  T: number
  Q: number
  sl: number
}

export const reviewPolicies: Simulator<ReviewParams> = {
  id: 'revision',
  route: '/revision',
  num: '05',
  area: 'Inventarios',
  title: 'Revisión continua vs. periódica',
  blurb:
    'Dos políticas de reposición sobre la misma demanda: cuánto inventario cuesta cada una.',

  defaults: { dm: 50, sd: 18, L: 7, sl: 95, T: 14, Q: 700 },

  params: [
    {
      key: 'dm',
      label: 'd̄ — demanda diaria promedio',
      min: 5,
      max: 200,
      step: 5,
      help: 'Igual para ambas políticas.',
    },
    {
      key: 'sd',
      label: 'σ — desviación diaria',
      min: 0,
      max: 80,
      step: 1,
      help: 'Misma serie aleatoria en las dos.',
    },
    {
      key: 'L',
      label: 'L — tiempo de entrega (días)',
      min: 1,
      max: 21,
      step: 1,
      help: 'Retraso del proveedor.',
    },
    {
      key: 'T',
      label: 'T — periodo de revisión (días)',
      min: 3,
      max: 45,
      step: 1,
      help: 'Sólo aplica a la política periódica.',
    },
    {
      key: 'Q',
      label: 'Q — lote fijo de la continua',
      min: 100,
      max: 3000,
      step: 50,
      help: 'Normalmente el EOQ.',
    },
    {
      key: 'sl',
      label: 'Nivel de servicio (%)',
      min: 80,
      max: 99.5,
      step: 0.5,
      help: 'Mismo objetivo para ambas.',
      format: (v) => fmt(v, 1) + '%',
    },
  ],

  run(p, ctx) {
    const days = 180
    const nz = normals(ctx.seed, days)
    const z = invNorm(p.sl / 100)
    const ssC = z * p.sd * Math.sqrt(p.L)
    const sC = p.dm * p.L + ssC
    const ssP = z * p.sd * Math.sqrt(p.T + p.L)
    const R = p.dm * (p.T + p.L) + ssP

    const run = (mode: 'c' | 'p') => {
      let inv = R
      let pend: { q: number; eta: number }[] = []
      let falt = 0
      let sum = 0
      let ord = 0
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
        falt += dem - serv
        inv -= serv
        const pos = inv + pend.reduce((s, o) => s + o.q, 0)
        if (mode === 'c') {
          if (pos <= sC) {
            pend.push({ q: p.Q, eta: t + p.L })
            ord++
          }
        } else if (t % p.T === 0) {
          const q = Math.max(0, R - pos)
          if (q > 0) {
            pend.push({ q, eta: t + p.L })
            ord++
          }
        }
        sum += inv
        trace.push([t, inv])
      }
      return { trace, falt, avg: sum / days, ord }
    }

    const C = run('c')
    const P = run('p')
    const demTotal = p.dm * days

    return {
      chart: {
        kind: 'line',
        title: 'Las dos políticas sobre la misma demanda',
        note: 'La periódica queda ciega T días, por eso necesita navegar más alto para dar el mismo servicio.',
        xLabel: 'Día',
        yLabel: 'Unidades',
        data: mergeSeries([
          { key: 'continua', pts: C.trace },
          { key: 'periodica', pts: P.trace },
        ]),
        series: [
          { key: 'continua', label: 'Continua (s,Q)', color: INK, width: 1.8 },
          { key: 'periodica', label: 'Periódica (R,T)', color: RED, width: 1.8 },
        ],
        refLines: [
          { y: sC, color: DARK, label: 's = ' + fmt(sC, 0) },
          { y: R, color: RED_D, label: 'R = ' + fmt(R, 0) },
        ],
      },
      metrics: [
        {
          label: 'Continua · inv. promedio',
          value: fmt(C.avg, 0) + ' u',
          note: fmt(C.ord, 0) + ' pedidos en 180 días.',
        },
        {
          label: 'Periódica · inv. promedio',
          value: fmt(P.avg, 0) + ' u',
          note: fmt(P.ord, 0) + ' pedidos en 180 días.',
        },
        {
          label: 'Inventario extra de la periódica',
          value: fmt(P.avg - C.avg, 0) + ' u',
          note: fmt((P.avg / Math.max(1, C.avg) - 1) * 100, 0) + '% más capital inmovilizado.',
        },
        { label: 'Colchón continua', value: fmt(ssC, 0) + ' u', note: 'z·σ·√L.' },
        { label: 'Colchón periódica', value: fmt(ssP, 0) + ' u', note: 'z·σ·√(T+L).' },
        {
          label: 'Fill rate',
          value:
            fmt((1 - C.falt / demTotal) * 100, 1) +
            '% / ' +
            fmt((1 - P.falt / demTotal) * 100, 1) +
            '%',
          note: 'Continua / periódica.',
        },
      ],
    }
  },
}
