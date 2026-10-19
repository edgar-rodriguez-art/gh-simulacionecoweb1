import { SIMS } from '@/lib/sims'

export type ModuleMeta = {
  id: string
  route: string
  num: string
  area: string
  title: string
  blurb: string
}

/**
 * Calculadora de ahorro (09): no es un `Simulator<P>` porque su interfaz es un
 * widget propio (campos de texto, perfiles, tabla), pero comparte la portada y
 * la sidebar con los demás módulos.
 */
export const SAVINGS_MODULE: ModuleMeta = {
  id: 'calculadora-ahorro',
  route: '/calculadora-ahorro',
  num: '09',
  area: 'Finanzas personales',
  title: 'Calculadora de ahorro',
  blurb:
    'Planee cuánto podría acumular con una inversión inicial y aportaciones mensuales, y qué necesita para llegar a su meta.',
}

/** Metadatos de los nueve módulos: los ocho simuladores más la calculadora. */
export const MODULES: ModuleMeta[] = [
  ...SIMS.map((s) => ({
    id: s.id,
    route: s.route,
    num: s.num,
    area: s.area,
    title: s.title,
    blurb: s.blurb,
  })),
  SAVINGS_MODULE,
]
