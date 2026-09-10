import { fmt, money } from '@/lib/format'
import { INK, RED, RED_D, mergeSeries, type Simulator } from './types'

export type SupplyDemandParams = {
  a: number
  b: number
  c: number
  d: number
  t: number
}

export const supplyDemand: Simulator<SupplyDemandParams> = {
  id: 'oferta-demanda',
  route: '/oferta-demanda',
  num: '01',
  area: 'Economía',
  title: 'Oferta y demanda',
  blurb:
    'Encuentre el precio y la cantidad de equilibrio, y vea quién paga realmente un impuesto según la elasticidad.',

  defaults: { a: 1000, b: 8, c: 100, d: 6, t: 0 },

  params: [
    {
      key: 'a',
      label: 'a — demanda máxima (unidades)',
      min: 400,
      max: 2000,
      step: 20,
      help: 'Cuánto se compraría a precio cero.',
    },
    {
      key: 'b',
      label: 'b — sensibilidad de la demanda',
      min: 2,
      max: 30,
      step: 0.5,
      help: 'Unidades perdidas por cada $1 de aumento.',
      format: (v) => fmt(v, 1),
    },
    {
      key: 'c',
      label: 'c — oferta autónoma (unidades)',
      min: 0,
      max: 600,
      step: 10,
      help: 'Producción que existe aun a precio bajo.',
    },
    {
      key: 'd',
      label: 'd — sensibilidad de la oferta',
      min: 1,
      max: 30,
      step: 0.5,
      help: 'Reacción de los productores a un mejor precio.',
      format: (v) => fmt(v, 1),
    },
    {
      key: 't',
      label: 't — impuesto por unidad ($)',
      min: 0,
      max: 40,
      step: 1,
      help: 'Se suma al costo del productor: desplaza la oferta.',
      format: (v) => money(v),
    },
  ],

  run(p) {
    const Pstar = (p.a - p.c + p.d * p.t) / (p.b + p.d)
    const Qstar = Math.max(0, p.a - p.b * Pstar)
    const Pmax = p.a / p.b

    const dem: [number, number][] = []
    const sup: [number, number][] = []
    for (let i = 0; i <= 60; i++) {
      const P = (Pmax * i) / 60
      dem.push([Math.max(0, p.a - p.b * P), P])
      sup.push([Math.max(0, p.c + p.d * (P - p.t)), P])
    }

    const cs = 0.5 * Qstar * Math.max(0, Pmax - Pstar)
    const ps = 0.5 * Qstar * Math.max(0, Pstar - p.t - Math.max(0, -p.c / p.d))
    const P0 = (p.a - p.c) / (p.b + p.d)

    return {
      chart: {
        kind: 'line',
        title: 'Curvas de oferta y demanda',
        note: 'Cantidad en el eje horizontal, precio en el vertical. El cruce es el equilibrio.',
        xLabel: 'Cantidad',
        yLabel: 'Precio',
        data: mergeSeries([
          { key: 'demanda', pts: dem },
          { key: 'oferta', pts: sup },
        ]),
        series: [
          { key: 'demanda', label: 'Demanda', color: INK },
          { key: 'oferta', label: 'Oferta (con impuesto)', color: RED },
        ],
        refLines: [{ y: Pstar, color: RED_D, label: 'P* ' + money(Pstar, 2) }],
        refDots: [{ x: Qstar, y: Pstar, color: RED }],
      },
      metrics: [
        {
          label: 'Precio de equilibrio',
          value: money(Pstar, 2),
          note: p.t > 0 ? 'Sin impuesto sería ' + money(P0, 2) : 'Donde oferta iguala demanda.',
        },
        {
          label: 'Cantidad de equilibrio',
          value: fmt(Qstar, 0),
          note: 'Unidades transadas por periodo.',
        },
        { label: 'Ingreso total', value: money(Pstar * Qstar), note: 'Precio × cantidad.' },
        {
          label: 'Excedente del consumidor',
          value: money(cs),
          note: 'Valor que el comprador captura.',
        },
        {
          label: 'Excedente del productor',
          value: money(Math.max(0, ps)),
          note: 'Margen sobre el precio mínimo aceptable.',
        },
        {
          label: 'Recaudación fiscal',
          value: money(p.t * Qstar),
          note:
            p.t > 0
              ? 'Traslado al consumidor: ' + fmt(((Pstar - P0) / p.t) * 100, 0) + '% del impuesto.'
              : 'Sin impuesto aplicado.',
        },
      ],
    }
  },
}
