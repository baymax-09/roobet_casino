export const growthRate = 0.00006

export const getMultiplierElapsed = multiplier =>
  Math.ceil(Math.log(multiplier) / Math.log(Math.E) / growthRate / 100) * 100
