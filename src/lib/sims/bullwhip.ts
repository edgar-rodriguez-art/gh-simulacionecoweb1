import { fmt } from '@/lib/format'
import { cv, normals } from '@/lib/stats'
import { DARK, GREY, INK, RED, RED_D, mergeSeries, type Simulator } from './types'

export type BullwhipParams = {
  sd: number
  jump: number
  L: number
  alpha: number
  z: number
}

export const LINKS = ['Minorista', 'Mayorista', 'Distribuidor', 'Fábrica'] as const
export const LINK_COLORS = [DARK, GREY, RED, RED_D]

/** Propaga la demanda del consumidor a través de `stages` eslabones. */
export function chain(p: BullwhipParams, T: number, stages: number, seed: number) {
  const nz = normals(seed, T)
  const base = 100
  const dem: number[] = []
  for (let t = 0; t < T; t++) {
    dem.push(Math.max(0, base + (t >= 10 ? p.jump : 0) + p.sd * nz[t]))
  }

  const st = Array.from({ length: stages }, () => ({
    inv: base * (p.L + 1),
    pipe: [] as { q: number; eta: number }[],
    f: base,
    orders: [] as number[],
  }))

  for (let t = 0; t < T; t++) {
    for (let k = 0; k < stages; k++) {
      const s = st[k]
      s.pipe = s.pipe.filter((o) => {
        if (o.eta === t) {
          s.inv += o.q
          return false
        }
        return true
      })
      const incoming = k === 0 ? dem[t] : st[k - 1].orders[t]
      const ship = Math.min(s.inv, incoming)
      s.inv -= ship
      s.f = p.alpha * incoming + (1 - p.alpha) * s.f
      const target = s.f * (p.L + 1) + p.z * p.sd * Math.sqrt(p.L + 1)
      const pos = s.inv + s.pipe.reduce((a, o) => a + o.q, 0)
      const order = Math.max(0, target - pos)
      s.orders[t] = order
      s.pipe.push({ q: order, eta: t + p.L })
    }
  }

  return { dem, st }
}

export const bullwhip: Simulator<BullwhipParams> = {
  id: 'efecto-latigo',
  route: '/efecto-latigo',
  num: '06',
  area: 'Cadena',
  title: 'Efecto látigo',
  blurb: 'Cuatro eslabones amplifican una demanda estable hasta volverla una oscilación violenta.',

  defaults: { sd: 8, jump: 20, L: 2, alpha: 0.6, z: 1.6 },

  params: [
    {
      key: 'sd',
      label: 'σ — variabilidad de la demanda final',
      min: 0,
      max: 40,
      step: 1,
      help: 'Ruido semanal del consumidor.',
    },
    {
      key: 'jump',
      label: 'Salto de demanda en la semana 10',
      min: 0,
      max: 60,
      step: 5,
      help: 'Cambio permanente de nivel.',
    },
    {
      key: 'L',
      label: 'L — retraso entre eslabones (semanas)',
      min: 1,
      max: 6,
      step: 1,
      help: 'El combustible del látigo.',
    },
    {
      key: 'alpha',
      label: 'α — reactividad del pronóstico',
      min: 0.05,
      max: 1,
      step: 0.05,
      help: 'Alto = cree cada dato reciente y sobrerreacciona.',
      format: (v) => fmt(v, 2),
    },
    {
      key: 'z',
      label: 'z — agresividad del colchón',
      min: 0,
      max: 3,
      step: 0.1,
      help: 'Protección adicional que pide cada eslabón.',
      format: (v) => fmt(v, 1),
    },
  ],

  run(p, ctx) {
    const T = 52
    const r = chain(p, T, 4, ctx.seed)

    const cvD = cv(r.dem)
    const amps = r.st.map((s) => cv(s.orders) / Math.max(0.001, cvD))
    const demMedia = r.dem.reduce((a, b) => a + b, 0) / T

    return {
      chart: {
        kind: 'line',
        title: 'Pedidos por eslabón, 52 semanas',
        note: 'La línea punteada es la demanda real del consumidor. Cuanto más arriba en la cadena, más violenta la oscilación.',
        xLabel: 'Semana',
        yLabel: 'Unidades pedidas',
        data: mergeSeries([
          { key: 'demanda', pts: r.dem.map((v, t) => [t, v] as [number, number]) },
          ...r.st.map((s, k) => ({
            key: 'e' + k,
            pts: s.orders.map((v, t) => [t, v] as [number, number]),
          })),
        ]),
        series: [
          { key: 'demanda', label: 'Demanda final', color: INK, width: 2.2, dashed: true },
          ...LINKS.map((n, k) => ({
            key: 'e' + k,
            label: n,
            color: LINK_COLORS[k],
            width: 2,
          })),
        ],
      },
      chart2: {
        kind: 'bar',
        title: 'Amplificación de la variabilidad por eslabón',
        note: 'CV de los pedidos del eslabón dividido entre el CV de la demanda del consumidor.',
        xLabel: 'Eslabón',
        yLabel: 'CV relativo al consumidor',
        data: LINKS.map((n, k) => ({
          name: n,
          v: amps[k],
          note: fmt(amps[k], 2) + '×',
          color: LINK_COLORS[k],
        })),
        series: [{ key: 'v', label: 'Amplificación', color: RED }],
      },
      metrics: [
        ...LINKS.map((n, k) => ({
          label: n,
          value: fmt(amps[k], 2) + '×',
          note:
            'Pico de ' +
            fmt(Math.max(...r.st[k].orders), 0) +
            ' u contra demanda media de ' +
            fmt(demMedia, 0) +
            '.',
        })),
        {
          label: 'CV de la demanda final',
          value: fmt(cvD * 100, 1) + '%',
          note: 'Variabilidad de origen.',
        },
        {
          label: 'Amplificación total',
          value: fmt(amps[3], 2) + '×',
          note: 'Lo que ve la fábrica frente al mostrador.',
        },
      ],
    }
  },
}
