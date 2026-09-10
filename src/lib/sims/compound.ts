import { fmt, money } from '@/lib/format'
import { GREY, INK, RED, mergeSeries, type Simulator } from './types'

export type CompoundParams = {
  p0: number
  ap: number
  r: number
  m: number
  n: number
  inf: number
}

export const compound: Simulator<CompoundParams> = {
  id: 'interes-compuesto',
  route: '/interes-compuesto',
  num: '02',
  area: 'Finanzas',
  title: 'Interés compuesto',
  blurb:
    'Proyecte un capital con aportes, capitalización e inflación, separando aporte de interés generado.',

  defaults: { p0: 20000, ap: 2000, r: 9, m: 12, n: 20, inf: 4 },

  params: [
    {
      key: 'p0',
      label: 'P₀ — capital inicial',
      min: 0,
      max: 500000,
      step: 5000,
      help: 'Punto de partida de la inversión.',
      format: (v) => money(v),
    },
    {
      key: 'ap',
      label: 'A — aporte mensual',
      min: 0,
      max: 20000,
      step: 250,
      help: 'Ahorro periódico constante.',
      format: (v) => money(v),
    },
    {
      key: 'r',
      label: 'r — tasa nominal anual (%)',
      min: 0,
      max: 25,
      step: 0.25,
      help: 'Rendimiento antes de capitalizar.',
      format: (v) => fmt(v, 2) + '%',
    },
    {
      key: 'm',
      label: 'm — capitalizaciones por año',
      min: 1,
      max: 12,
      step: 1,
      help: '1 = anual, 12 = mensual.',
    },
    {
      key: 'n',
      label: 'n — plazo (años)',
      min: 1,
      max: 40,
      step: 1,
      help: 'La palanca más poderosa del modelo.',
    },
    {
      key: 'inf',
      label: 'Inflación anual (%)',
      min: 0,
      max: 15,
      step: 0.25,
      help: 'Descuenta el saldo a poder de compra de hoy.',
      format: (v) => fmt(v, 2) + '%',
    },
  ],

  run(p) {
    const im = Math.pow(1 + p.r / 100 / p.m, p.m / 12) - 1
    const N = Math.round(p.n * 12)

    const nom: [number, number][] = []
    const real: [number, number][] = []
    const apor: [number, number][] = []

    let bal = p.p0
    let cont = p.p0
    for (let t = 0; t <= N; t++) {
      if (t > 0) {
        bal = bal * (1 + im) + p.ap
        cont += p.ap
      }
      const yr = t / 12
      nom.push([yr, bal])
      apor.push([yr, cont])
      real.push([yr, bal / Math.pow(1 + p.inf / 100, yr)])
    }

    const tea = Math.pow(1 + p.r / 100 / p.m, p.m) - 1

    return {
      chart: {
        kind: 'line',
        title: 'Trayectoria del capital',
        note: 'El área sombreada es dinero aportado; la distancia hasta la curva superior es interés generado.',
        xLabel: 'Años',
        yLabel: 'Saldo ($)',
        data: mergeSeries([
          { key: 'aportado', pts: apor },
          { key: 'real', pts: real },
          { key: 'nominal', pts: nom },
        ]),
        series: [
          { key: 'aportado', label: 'Aportado', color: GREY, area: true, width: 1.5 },
          { key: 'real', label: 'Saldo real (hoy)', color: INK, dashed: true },
          { key: 'nominal', label: 'Saldo nominal', color: RED },
        ],
        legend: [
          { label: 'Saldo nominal', color: RED },
          { label: 'Saldo real (hoy)', color: INK },
          { label: 'Aportado', color: GREY },
        ],
      },
      metrics: [
        { label: 'Saldo final nominal', value: money(bal), note: 'Al cierre del año ' + p.n + '.' },
        { label: 'Total aportado', value: money(cont), note: 'Capital inicial más aportes.' },
        {
          label: 'Interés generado',
          value: money(bal - cont),
          note: fmt(((bal - cont) / bal) * 100, 0) + '% del saldo final.',
        },
        {
          label: 'Saldo en pesos de hoy',
          value: money(bal / Math.pow(1 + p.inf / 100, p.n)),
          note: 'Ajustado por inflación.',
        },
        {
          label: 'Tasa efectiva anual',
          value: fmt(tea * 100, 2) + '%',
          note: 'Efecto de capitalizar ' + p.m + ' veces al año.',
        },
        {
          label: 'Duplica el capital en',
          value: fmt(72 / Math.max(0.1, p.r), 1) + ' años',
          note: 'Regla del 72, sin aportes.',
        },
      ],
    }
  },
}
