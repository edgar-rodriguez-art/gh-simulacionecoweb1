import { SimLayout } from '@/components/SimLayout'
import { beerGame } from '@/lib/sims'

export default function BeerGame() {
  return <SimLayout sim={beerGame} />
}
