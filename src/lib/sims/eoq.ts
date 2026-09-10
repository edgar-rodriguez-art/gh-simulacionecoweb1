import { fmt, money } from '@/lib/format'
import { GREY, INK, RED, RED_D, mergeSeries, type Simulator } from './types'

export type EoqParams = {
  D: number
  S: number
  H: number
  Q: number
}

export const eoq: Simulator<EoqParams> = {
  id: 'eoq',
  route: '/eoq',
  num: '03',
  area: 'Inventarios',
  title: 'Cantidad económica de pedido',
  blurb:
    'Equilibre el costo de pedir contra el costo de mantener y compare su lote actual con el óptimo.',

  defaults: { D: 24000, S: 900, H: 35, Q: 1600 },

  params: [
    {
      key: 'D',
      label: 'D — demanda anual (unidades)',
      min: 1000,
      max: 100000,
      step: 1000,
      help: 'Volumen que se venderá en el año.',
    },
    {
      key: 'S',
      label: 'S — costo por pedido ($)',
      min: 50,
      max: 5000,
      step: 50,
      help: 'Flete, gestión e inspección por orden.',
      format: (v) => money(v),
    },
    {
      key: 'H',
      label: 'H — costo de mantener ($/unidad/año)',
      min: 2,
      max: 200,
      step: 1,
      help: 'Almacén, seguro, merma y costo del capital.',
      format: (v) => money(v),
    },
    {
      key: 'Q',
      label: 'Q — lote que usa hoy (unidades)',
      min: 100,
      max: 10000,
      step: 50,
      help: 'Para medir la penalización de no estar en el óptimo.',
    },
  ],

  run(p) {
    const q0 = Math.sqrt((2 * p.D * p.S) / p.H)
    const tc = (q: number) => (p.D / q) * p.S + (q / 2) * p.H
    const qmax = Math.max(q0 * 2.6, p.Q * 1.25)

    const hold: [number, number][] = []
    const ord: [number, number][] = []
    const tot: [number, number][] = []
    for (let i = 1; i <= 80; i++) {
      const q = (qmax * i) / 80
      hold.push([q, (q / 2) * p.H])
      ord.push([q, (p.D / q) * p.S])
      tot.push([q, tc(q)])
    }

    return {
      chart: {
        kind: 'line',
        title: 'Costo anual según el tamaño de lote',
        note: 'La curva total es plana alrededor del óptimo: hay margen para redondear a empaque o camión completo.',
        xLabel: 'Tamaño de lote Q',
        yLabel: 'Costo anual ($)',
        yDomain: [0, tc(q0) * 3],
        data: mergeSeries([
          { key: 'mantener', pts: hold },
          { key: 'pedir', pts: ord },
          { key: 'total', pts: tot },
        ]),
        // Orden de dibujo: las dos curvas punteadas debajo, el total encima.
        series: [
          { key: 'mantener', label: 'Mantener', color: INK, dashed: true, width: 2 },
          { key: 'pedir', label: 'Pedir', color: GREY, dashed: true, width: 2 },
          { key: 'total', label: 'Costo total', color: RED },
        ],
        legend: [
          { label: 'Costo total', color: RED },
          { label: 'Mantener', color: INK },
          { label: 'Pedir', color: GREY },
        ],
        refLines: [{ y: tc(q0), color: RED_D, label: 'Costo mínimo ' + money(tc(q0)) }],
        refDots: [{ x: q0, y: tc(q0), color: RED }],
      },
      metrics: [
        {
          label: 'EOQ óptimo',
          value: fmt(q0, 0) + ' u',
          note: 'Donde el costo de pedir iguala el de mantener.',
        },
        {
          label: 'Pedidos por año',
          value: fmt(p.D / q0, 1),
          note: 'Un ciclo cada ' + fmt(365 / (p.D / q0), 0) + ' días.',
        },
        { label: 'Costo total óptimo', value: money(tc(q0)), note: 'Sin contar el costo de compra.' },
        {
          label: 'Costo con su lote actual',
          value: money(tc(p.Q)),
          note: 'Con Q = ' + fmt(p.Q, 0) + ' unidades.',
        },
        {
          label: 'Sobrecosto por no optimizar',
          value: money(tc(p.Q) - tc(q0)),
          note: '+' + fmt((tc(p.Q) / tc(q0) - 1) * 100, 1) + '% sobre el mínimo.',
        },
        {
          label: 'Inventario promedio',
          value: fmt(q0 / 2, 0) + ' u',
          note: 'Capital inmovilizado: ' + money((q0 / 2) * p.H) + '/año de costo.',
        },
      ],
    }
  },
}
