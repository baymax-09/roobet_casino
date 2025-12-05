import { inverseGrowth } from './lib/util/hash'

const TickRate = 150

// CrashTicker is used as an interface to processes crash tick events in classes
export abstract class CrashTicker {
  startedAt: Date | null
  duration: number | null
  ticking: boolean
  timeout: ReturnType<typeof setTimeout> | null

  constructor() {
    this.startedAt = null
    this.duration = null
    this.ticking = false
    this.timeout = null
  }

  stopTicks() {
    this.ticking = false

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  startTicks(startedAt: CrashTicker['startedAt'], crashPoint: number) {
    this.startedAt = startedAt
    this.duration = Math.ceil(inverseGrowth(crashPoint * 100 + 1))
    this.ticking = true

    const elapsed = startedAt ? Date.now() - startedAt.getTime() : 0
    this.scheduleTick(elapsed)
  }

  scheduleTick(elapsed: number) {
    const left = this.duration ? this.duration - elapsed : 0
    const nextTick = Math.max(0, Math.min(left, TickRate))
    this.timeout = setTimeout(() => {
      this.tick()
    }, nextTick)
  }

  tick() {
    if (!this.ticking) {
      return
    }

    const elapsed = this.startedAt ? Date.now() - this.startedAt.getTime() : 0

    this.onTick(elapsed)
    this.scheduleTick(elapsed)
  }

  abstract onTick(_elapsed: number): void
}
