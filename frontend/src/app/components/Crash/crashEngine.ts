export class CrashEngine {
  static growthRate = 0.00006

  constructor() {
    this.startTime = Date.now()

    this.state = 'loading'
    this.graphWidth = -1
    this.graphHeight = -1

    this.plotWidth = -1
    this.plotHeight = -1

    this.plotOffsetX = -1
    this.plotOffsetY = -1

    this.xAxis = -1
    this.yAxis = -1

    this.xIncrement = -1
    this.yIncrement = -1

    this.xAxisMinimum = 1000
    this.yAxisMinimum = -1
    this.elapsedOffset = 0

    this.yAxisMultiplier = 1.5

    this.currentBet = null
    this.catalog = []
  }

  update() {
    this.elapsedTime = Math.max(this.getElapsedTime(), 0)
    this.currentMultiplier = this.getMultiplier(this.elapsedTime) // : 1

    this.yAxisMinimum = this.yAxisMultiplier
    this.yAxis = this.yAxisMinimum
    this.xAxis = Math.max(
      this.elapsedTime + this.elapsedOffset,
      this.xAxisMinimum,
    )

    if (this.currentMultiplier > this.yAxisMinimum) {
      this.yAxis = this.currentMultiplier
    }

    this.xIncrement = this.plotWidth / this.xAxis
    this.yIncrement = this.plotHeight / this.yAxis
  }

  setGraphSize(width, height) {
    this.graphWidth = width
    this.graphHeight = height

    this.plotWidth = width - 50
    this.plotHeight = height - 30

    this.plotOffsetX = width - this.plotWidth
    this.plotOffsetY = height - this.plotHeight
  }

  getElapsedPlotPosition(elapsedTime) {
    const payout = this.getMultiplier(elapsedTime) - 1
    const x = elapsedTime * this.xIncrement + this.plotOffsetX
    const y = this.plotHeight - payout * this.yIncrement

    return {
      x,
      y,
    }
  }

  getMultiplier(ms) {
    const multiplier = Math.floor(100 * this.getGrowth(ms)) / 100
    console.assert(Number.isFinite(multiplier))
    return Math.max(multiplier, 1)
  }

  getMultiplierElapsed(multiplier) {
    return (
      Math.ceil(
        Math.log(multiplier) / Math.log(Math.E) / CrashEngine.growthRate / 100,
      ) * 100
    )
  }

  getElapsedTime() {
    if (this.state === 'Over') {
      return this.getMultiplierElapsed(this.crashPoint)
    }

    return Date.now() - this.startTime
  }

  getGrowth(ms) {
    return Math.pow(Math.E, CrashEngine.growthRate * ms)
  }
}
