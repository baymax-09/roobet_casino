export function exponentialDelay(retryNumber = 0) {
  return Math.min(10000, Math.pow(2, retryNumber) * 500)
}
