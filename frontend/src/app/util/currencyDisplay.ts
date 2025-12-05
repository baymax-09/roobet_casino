export const truncateCurrency = (amount: number, digits: number): number => {
  const multiplier = Math.pow(10, digits)
  return Math.floor(amount * multiplier) / multiplier
}
