import { SimLayout } from '@/components/SimLayout'
import { supplyDemand } from '@/lib/sims'

export default function OfertaDemanda() {
  return <SimLayout sim={supplyDemand} />
}
