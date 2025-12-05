export function inverseGrowth(result: number) {
  const c = 16666.666667
  return c * Math.log(0.01 * result)
}
