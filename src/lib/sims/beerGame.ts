import { fmt, money } from '@/lib/format'
import { INK, RED, mergeSeries, type Simulator } from './types'
import { LINKS, LINK_COLORS } from './bullwhip'

export type BeerGameParams = {
  base: number
  jump: number
  L: number
  beta: number
  target: number
}

export const beerGame: Simulator<BeerGameParams> = {
  id: 'beer-game',
  route: '/beer-game',
  num: '07',
  area: 'Cadena',
  title: 'Beer Game simplificado',
  blurb: 'Juegue semana por semana con su regla de pedido y pague el costo de la oscilación.',

  defaults: { base: 8, jump: 8, L: 2, beta: 0.5, target: 24 },

  params: [
    {
      key: 'base',
      label: 'Demanda base del consumidor (u/semana)',
      min: 2,
      max: 30,
      step: 1,
      help: 'Pedido semanal estable al inicio.',
    },
    {
      key: 'jump',
      label: 'Salto de demanda en la semana 5',
      min: 0,
      max: 30,
      step: 1,
      help: 'El shock que desata el juego.',
    },
    {
      key: 'L',
      label: 'Retraso de envío (semanas)',
      min: 1,
      max: 5,
      step: 1,
      help: 'Semanas entre pedir y recibir.',
    },
    {
      key: 'beta',
      label: 'β — agresividad de corrección',
      min: 0,
      max: 1.5,
      step: 0.05,
      help: 'Fracción de la brecha que corrige en un solo pedido.',
      format: (v) => fmt(v, 2),
    },
    {
      key: 'target',
      label: 'Inventario objetivo (u)',
      min: 0,
      max: 80,
      step: 2,
      help: 'El colchón que cada eslabón quiere mantener.',
    },
  ],

  run(p, ctx) {
    const weeks = Math.max(2, ctx.week)

    const st = LINKS.map(() => ({
      inv: p.target,
      back: 0,
      pipe: [] as { q: number; eta: number }[],
      orders: [] as number[],
      invT: [] as [number, number][],
      cost: 0,
    }))

    let costTotal = 0
    let backMax = 0

    for (let t = 0; t < weeks; t++) {
      const dem = p.base + (t >= 5 ? p.jump : 0)
      for (let k = 0; k < 4; k++) {
        const s = st[k]
        s.pipe = s.pipe.filter((o) => {
          if (o.eta === t) {
            s.inv += o.q
            return false
          }
          return true
        })
        const incoming = (k === 0 ? dem : st[k - 1].orders[t]) + s.back
        const ship = Math.min(s.inv, incoming)
        s.inv -= ship
        s.back = incoming - ship
        const pos = s.inv - s.back + s.pipe.reduce((a, o) => a + o.q, 0)
        const percibida = k === 0 ? dem : st[k - 1].orders[t]
        const order = Math.max(0, percibida + p.beta * (p.target - pos))
        s.orders[t] = order
        s.pipe.push({ q: order, eta: t + p.L })
        const c = s.inv * 1 + s.back * 2
        s.cost += c
        costTotal += c
        backMax = Math.max(backMax, s.back)
        s.invT.push([t, s.inv - s.back])
      }
    }

    return {
      actions: [
        { label: 'Avanzar 1 semana', kind: 'week+1' },
        { label: '+5 semanas', kind: 'week+5' },
        { label: 'Correr a 40', kind: 'week=40' },
        { label: 'Reiniciar', kind: 'reset' },
      ],
      chart: {
        kind: 'line',
        title: 'Posición neta por eslabón — semana ' + weeks,
        note: 'Por debajo de cero son pedidos pendientes (backlog), que cuestan el doble que el inventario.',
        xLabel: 'Semana',
        yLabel: 'Inventario neto (u)',
        data: mergeSeries(st.map((s, k) => ({ key: 'e' + k, pts: s.invT }))),
        series: LINKS.map((n, k) => ({
          key: 'e' + k,
          label: n,
          color: LINK_COLORS[k],
          width: 2,
        })),
        refLines: [{ y: 0, color: INK, label: 'Cero' }],
      },
      chart2: {
        kind: 'bar',
        title: 'Costo acumulado por eslabón',
        note: '$1 por unidad en inventario y $2 por unidad pendiente, cada semana.',
        xLabel: 'Eslabón',
        yLabel: 'Costo ($)',
        data: LINKS.map((n, k) => ({
          name: n,
          v: st[k].cost,
          note: money(st[k].cost),
          color: LINK_COLORS[k],
        })),
        series: [{ key: 'v', label: 'Costo acumulado', color: RED }],
      },
      metrics: [
        { label: 'Semana actual', value: fmt(weeks, 0), note: 'Use los botones para avanzar el juego.' },
        {
          label: 'Costo total de la cadena',
          value: money(costTotal),
          note: '$1 por inventario, $2 por pendiente y semana.',
        },
        {
          label: 'Pedido de la fábrica',
          value: fmt(st[3].orders[weeks - 1] || 0, 0) + ' u',
          note: 'Contra demanda real de ' + fmt(p.base + (weeks > 5 ? p.jump : 0), 0) + ' u.',
        },
        {
          label: 'Backlog máximo',
          value: fmt(backMax, 0) + ' u',
          note: 'Peor faltante visto en la cadena.',
        },
        { label: 'Costo del minorista', value: money(st[0].cost), note: 'El más cercano al cliente.' },
        {
          label: 'Costo de la fábrica',
          value: money(st[3].cost),
          note: 'El más lejano: paga la amplificación.',
        },
      ],
    }
  },
}
