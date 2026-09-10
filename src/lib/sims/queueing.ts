import { fmt } from '@/lib/format'
import { GREY, INK, RED, mergeSeries, type Simulator } from './types'

export type QueueParams = {
  lam: number
  mu: number
  c: number
  e1: number
  e2: number
  e3: number
}

export type MmcResult = {
  rho: number
  Lq: number
  Wq: number
  W: number
  L: number
  Pw: number
}

/** Métricas de estado estacionario de una cola M/M/c. */
export function mmc(lam: number, mu: number, c: number): MmcResult {
  const a = lam / mu
  const rho = a / c
  if (rho >= 1) {
    return { rho, Lq: Infinity, Wq: Infinity, W: Infinity, L: Infinity, Pw: 1 }
  }
  const fact = (k: number) => {
    let r = 1
    for (let i = 2; i <= k; i++) r *= i
    return r
  }
  let sum = 0
  for (let n = 0; n < c; n++) sum += Math.pow(a, n) / fact(n)
  const cfact = fact(c)
  const P0 = 1 / (sum + Math.pow(a, c) / (cfact * (1 - rho)))
  const Lq = (P0 * Math.pow(a, c) * rho) / (cfact * Math.pow(1 - rho, 2))
  const Wq = Lq / lam
  const W = Wq + 1 / mu
  return { rho, Lq, Wq, W, L: lam * W, Pw: (P0 * Math.pow(a, c)) / (cfact * (1 - rho)) }
}

export const queueing: Simulator<QueueParams> = {
  id: 'colas',
  route: '/colas',
  num: '08',
  area: 'Servicio',
  title: 'Teoría de colas y cuellos de botella',
  blurb: 'M/M/c: espera, utilización y la etapa que realmente fija el rendimiento del proceso.',

  defaults: { lam: 34, mu: 12, c: 3, e1: 40, e2: 30, e3: 45 },

  params: [
    {
      key: 'lam',
      label: 'λ — llegadas por hora',
      min: 1,
      max: 90,
      step: 1,
      help: 'Clientes u órdenes que llegan.',
    },
    {
      key: 'mu',
      label: 'μ — servicio por servidor (por hora)',
      min: 1,
      max: 40,
      step: 1,
      help: 'Cuántos atiende cada servidor.',
    },
    {
      key: 'c',
      label: 'c — número de servidores',
      min: 1,
      max: 10,
      step: 1,
      help: 'Cajas, agentes, máquinas o muelles.',
    },
    {
      key: 'e1',
      label: 'Capacidad etapa 1 (u/h)',
      min: 5,
      max: 80,
      step: 1,
      help: 'Ritmo máximo del primer paso.',
    },
    {
      key: 'e2',
      label: 'Capacidad etapa 2 (u/h)',
      min: 5,
      max: 80,
      step: 1,
      help: 'Ritmo máximo del segundo paso.',
    },
    {
      key: 'e3',
      label: 'Capacidad etapa 3 (u/h)',
      min: 5,
      max: 80,
      step: 1,
      help: 'Ritmo máximo del tercer paso.',
    },
  ],

  run(p) {
    const r = mmc(p.lam, p.mu, p.c)

    const curve: [number, number][] = []
    const lamMax = p.mu * p.c * 0.985
    for (let i = 1; i <= 70; i++) {
      const lam = (lamMax * i) / 70
      const q = mmc(lam, p.mu, p.c)
      if (isFinite(q.Wq)) curve.push([q.rho * 100, q.Wq * 60])
    }

    const caps = [p.e1, p.e2, p.e3]
    const minCap = Math.min(...caps)
    const bIdx = caps.indexOf(minCap)
    const thr = Math.min(p.lam, minCap)

    return {
      chart: {
        kind: 'line',
        title: 'Espera en fila contra utilización',
        note: 'La curva es no lineal: pasada la zona del 85 % la espera se dispara con cualquier llegada extra.',
        xLabel: 'Utilización ρ (%)',
        yLabel: 'Espera en fila (min)',
        xDomain: [0, 100],
        yDomain: [0, isFinite(r.Wq) ? Math.max(20, r.Wq * 60 * 2.2) : 60],
        data: mergeSeries([{ key: 'espera', pts: curve }]),
        series: [{ key: 'espera', label: 'Espera esperada (min)', color: RED }],
        legend: [
          { label: 'Espera esperada (min)', color: RED },
          { label: 'Su punto de operación', color: INK },
        ],
        refLines: isFinite(r.Wq)
          ? [{ y: r.Wq * 60, color: INK, label: 'Usted: ' + fmt(r.Wq * 60, 1) + ' min' }]
          : [],
        xTick: (v) => fmt(v, 0) + '%',
      },
      chart2: {
        kind: 'bar',
        title: 'Capacidad por etapa — el cuello de botella manda',
        note: 'La etapa más lenta fija el rendimiento; ampliar cualquier otra no añade una sola unidad.',
        xLabel: 'Etapa del proceso',
        yLabel: 'Unidades por hora',
        data: caps.map((v, i) => ({
          name: 'Etapa ' + (i + 1) + (i === bIdx ? ' ◄ cuello' : ''),
          v,
          note: fmt(v, 0),
          color: i === bIdx ? RED : GREY,
        })),
        series: [{ key: 'v', label: 'Capacidad', color: GREY }],
        refLines: [{ y: p.lam, color: INK, label: 'Llegadas λ = ' + fmt(p.lam, 0) }],
      },
      metrics: [
        {
          label: 'Utilización ρ',
          value: fmt(r.rho * 100, 1) + '%',
          note:
            r.rho >= 1
              ? 'Sistema saturado: la fila crece sin límite.'
              : r.rho > 0.9
                ? 'Zona crítica: cualquier variación explota la fila.'
                : 'Zona manejable.',
        },
        {
          label: 'Espera en fila (Wq)',
          value: isFinite(r.Wq) ? fmt(r.Wq * 60, 1) + ' min' : '∞',
          note: 'Antes de ser atendido.',
        },
        {
          label: 'Tiempo total en el sistema',
          value: isFinite(r.W) ? fmt(r.W * 60, 1) + ' min' : '∞',
          note: 'Espera más servicio.',
        },
        {
          label: 'Personas en fila (Lq)',
          value: isFinite(r.Lq) ? fmt(r.Lq, 1) : '∞',
          note: 'Longitud promedio de la cola.',
        },
        {
          label: 'Probabilidad de esperar',
          value: fmt(r.Pw * 100, 0) + '%',
          note: 'Clientes que no pasan directo.',
        },
        {
          label: 'Rendimiento del proceso',
          value: fmt(thr, 0) + ' u/h',
          note: 'Lo fija la etapa ' + (bIdx + 1) + '; ampliar otra etapa no sube nada.',
        },
      ],
    }
  },
}
