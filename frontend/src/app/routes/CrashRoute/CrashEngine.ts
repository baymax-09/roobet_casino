import random from 'random-seed'

import { Rocket } from './objects'

export class CrashEngine {
  static CrashSpeed = 0.00006
  static PredictingLapse = 500

  // TODO: Seperate constants into it's own file
  static States = {
    Loading: 'Loading',
    Starting: 'TakingBets',
    Active: 'Running',
    Over: 'Over',
  }

  static RocketVisibleStates = [
    CrashEngine.States.Active,
    CrashEngine.States.Over,
  ]

  static getMultiplierElapsed(multiplier) {
    return (
      Math.ceil(
        Math.log(multiplier) / Math.log(Math.E) / CrashEngine.CrashSpeed / 100,
      ) * 100
    )
  }

  static getElapsedPayout(elapsed) {
    const payout = ~~(100 * Math.E ** (CrashEngine.CrashSpeed * elapsed)) / 100

    if (!Number.isFinite(payout)) {
      throw new Error('Infinite payout')
    }

    return Math.max(payout, 1)
  }

  constructor(app, rocketsConfig = []) {
    this.rocketsConfig = rocketsConfig
    this.currentRocketConfig = null
    this.app = app

    this.state = CrashEngine.States.Loading
    this.gameId = null
    this.startTime = 0
    this.elapsedTime = 0
    this.finalElapsed = 0
    this.finalMultiplier = 0
    this.crashPoint = null
    this.betAmount = 0

    this.graphWidth = 0
    this.graphHeight = 0

    this.plotWidth = 0
    this.plotHeight = 0

    this.plotOffsetX = 0
    this.plotOffsetY = 0

    this.xAxis = 0
    this.yAxis = 0

    this.xIncrement = 0
    this.yIncrement = 0

    this.xAxisMinimum = 1000
    this.yAxisMinimum = -1
    this.elapsedOffset = 0

    this.yAxisMultiplier = 1.5

    this.lastGameTick = null
    this.tickTimeout = null

    this.lag = false
    this.lastGameTick = null
    this.lagTimeout = null

    this.updateRocketConfig()
  }

  updateRocketConfig() {
    this.currentRocketConfig = this.getRocketConfig()
  }

  getRocketConfig() {
    const {
      rocketsConfig: {
        rockets: { default: defaultRocket },
      },
    } = this

    const config = defaultRocket

    return {
      ...config,

      emitter: {
        ...defaultRocket.emitter,
      },
    }
  }

  createSeededRocket(seed) {
    const { skins, emitter } = this.currentRocketConfig
    return new Rocket(
      skins[~~(random.create(seed).random() * skins.length)],
      emitter,
    )
  }

  onGameTick(elapsed) {
    this.lastGameTick = Date.now()

    if (this.lag) {
      this.lag = false
    }

    const latency = this.lastGameTick - elapsed

    if (this.startTime > latency) {
      this.startTime = latency
    }

    if (this.lagTimeout) {
      clearTimeout(this.lagTimeout)
    }

    this.lagTimeout = setTimeout(this.checkForLag, CrashEngine.PredictingLapse)
  }

  checkForLag = () => {
    this.lag = true
  }

  tick() {
    this.elapsedTime = this.getElapsedTime()
    this.multiplier =
      this.state !== CrashEngine.States.Over
        ? CrashEngine.getElapsedPayout(this.elapsedTime)
        : this.finalMultiplier

    this.yAxisMinimum = this.yAxisMultiplier
    this.yAxis = this.yAxisMinimum
    this.xAxis = Math.max(
      this.elapsedTime + this.elapsedOffset,
      this.xAxisMinimum,
    )

    if (this.multiplier > this.yAxisMinimum) {
      this.yAxis = this.multiplier
    }

    this.xIncrement = this.plotWidth / this.xAxis
    this.yIncrement = this.plotHeight / this.yAxis
  }

  clearTickTimeouts() {
    clearTimeout(this.tickTimeout)
    clearTimeout(this.lagTimeout)
  }

  destroy() {
    this.clearTickTimeouts()
  }

  getElapsedTime() {
    if (this.state === CrashEngine.States.Over) {
      return this.finalElapsed
    } else if (this.state !== CrashEngine.States.Active) {
      return 0
    }

    // if (this.lag) {
    //   return this.lastGameTick - this.startTime + CrashEngine.PredictingLapse
    // }

    return Date.now() - this.startTime
  }

  getElapsedPosition(elapsedTime) {
    const payout = CrashEngine.getElapsedPayout(elapsedTime) - 1
    const x = elapsedTime * this.xIncrement // + this.plotOffsetX
    const y = this.plotHeight - payout * this.yIncrement

    return {
      x,
      y,
    }
  }

  getYMultiplier(y) {
    return (
      Math.ceil(
        (1 + (this.yAxis - (y / this.plotHeight) * this.yAxis)) * 1000,
      ) / 1000
    )
  }

  getMultiplierY(multiplier) {
    return this.plotHeight - (multiplier - 1) * this.yIncrement
    // return Math.ceil((1 + (this.yAxis - ((y / this.plotHeight) * this.yAxis))) * 1000) / 1000
  }

  onResize(width, height) {
    this.graphWidth = width
    this.graphHeight = height

    this.plotOffsetX = 50
    this.plotOffsetY = 40

    this.plotWidth = width - this.plotOffsetX
    this.plotHeight = height - this.plotOffsetY
  }
}
