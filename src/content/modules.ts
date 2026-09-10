import { SIMS } from '@/lib/sims'

export type ModuleMeta = {
  id: string
  route: string
  num: string
  area: string
  title: string
  blurb: string
}

/** Metadatos de los ocho módulos, derivados del contrato de cada simulador. */
export const MODULES: ModuleMeta[] = SIMS.map((s) => ({
  id: s.id,
  route: s.route,
  num: s.num,
  area: s.area,
  title: s.title,
  blurb: s.blurb,
}))
