import { config } from 'src/system'

export function getPayoutMultiplier(
  currentRow: number,
  poopPerRow: number,
  columns: number,
) {
  const houseEdge = config.cashdash.edge / 100
  const denominator = columns - poopPerRow

  const edgeMultiplier = 1 - houseEdge
  const rowMultiplier = edgeMultiplier * (columns / denominator)
  const payoutMultiplier = Math.pow(rowMultiplier, currentRow + 1)

  return payoutMultiplier
}
