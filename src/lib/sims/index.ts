import type { Simulator } from './types'
import { supplyDemand } from './supplyDemand'
import { compound } from './compound'
import { eoq } from './eoq'
import { reorderPoint } from './reorderPoint'
import { reviewPolicies } from './reviewPolicies'
import { bullwhip } from './bullwhip'
import { beerGame } from './beerGame'
import { queueing } from './queueing'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const SIMS: Simulator<any>[] = [
  supplyDemand,
  compound,
  eoq,
  reorderPoint,
  reviewPolicies,
  bullwhip,
  beerGame,
  queueing,
]

export const SIM_BY_ID = Object.fromEntries(SIMS.map((s) => [s.id, s]))

export {
  supplyDemand,
  compound,
  eoq,
  reorderPoint,
  reviewPolicies,
  bullwhip,
  beerGame,
  queueing,
}
export * from './types'
