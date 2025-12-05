import numeral from 'numeral'

export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end
}

export function getDistance(x1, y1, x2, y2) {
  const a = x1 - x2
  const b = y1 - y2

  return Math.sqrt(a * a + b * b)
}

export function formatAmount(amount) {
  return numeral(amount.toFixed(amount > 1 ? 2 : 4)).format('$0,0.00[0]')
}
