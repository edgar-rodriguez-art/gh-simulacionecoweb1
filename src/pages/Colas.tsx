import { SimLayout } from '@/components/SimLayout'
import { queueing } from '@/lib/sims'

export default function Colas() {
  return <SimLayout sim={queueing} />
}
