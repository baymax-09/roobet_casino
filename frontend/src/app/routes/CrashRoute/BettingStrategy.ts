class BettingStrategy {
  constructor(engine, state, options) {
    this.engine = engine
    this.options = options
    this.state = state
  }

  start() {
    // if (!this.willBet()) {
    //   this.stop()
    //   return
    // }

    this.running = false
    this.stopping = false
    this.totalBets = 0
    this.profit = 0
    this.winStreak = 0
    this.lossStreak = 0
    this.startingBetAmount = this.options.betAmount
    this.placingBet = false
    this.lastBetAmount = 0
    this.rolls = 0

    this.roll()
  }

  stop() {
    this.stopping = true

    // if (!this.running) {
    // return
    // }

    if (this._onStop) {
      this._onStop()
    }
  }

  update(state) {
    this.state = state
    if (!this.running) {
      return
    }

    // if (this.placingBet) {
    if (state === 'TakingBets') {
      this.placingBet = false
      this.rolls += 1
      this.roll()
    }

    // return
    // }
  }

  onWon(payoutValue) {
    this.profit += payoutValue - this.lastBetAmount
    this.winStreak++
    this.lossStreak = 0
  }

  onLoss(bet) {
    this.profit -= this.lastBetAmount
    this.winStreak = 0
    this.lossStreak++
  }

  async roll() {
    if (this.stopping || !this.willBet()) {
      this.stop()
      return
    }

    this.running = true

    if (this.state !== 'TakingBets') {
      this.placingBet = true
      return
    }

    try {
      if (!this._onRoll) {
        throw new Error('Roll callback required')
      }

      this.totalBets++
      const { maxNumberOfBets } = this.options
      const amount = this.getNextBetAmount()

      const response = await this._onRoll({
        betAmount: amount,
      })

      if (!response || !response.success) {
        throw new Error('Invalid response')
      }

      this.lastBetAmount = amount

      // this.running = false
      //
      // const won = rollOver ? response.roll >= roll : response.roll < roll
      // this.profit += response.bet.profit
      //
      // if (won) {
      //   this.winStreak++
      //   this.lossStreak = 0
      // } else {
      //   this.winStreak = 0
      //   this.lossStreak++
      // }
      //
      if (this.stopping) {
        this.stop()
        return
      }

      if (this._onBet) {
        this._onBet({
          remainingBets:
            !!maxNumberOfBets && maxNumberOfBets > 0
              ? maxNumberOfBets - this.totalBets
              : 0,
        })
      }
      //
      // this._rollTimeout = setTimeout(() => this.roll(), 700)
    } catch (error) {
      this.running = false

      if (this._onError) {
        this._onError(error)
      }

      this.stop()
    }
  }

  willBet() {
    return false
  }

  getNextBetAmount() {
    return null
  }

  onRoll(cb) {
    this._onRoll = cb
  }

  onError(cb) {
    this._onError = cb
  }

  onStop(cb) {
    this.rolls = 0
    this._onStop = cb
  }

  onBet(cb) {
    this._onBet = cb
  }
}

export class AutomatedBettingStrategy extends BettingStrategy {
  override willBet() {
    const { stopOnLoss, stopOnProfit, maxNumberOfBets } = this.options

    if (
      !!maxNumberOfBets &&
      maxNumberOfBets > 0 &&
      this.totalBets >= maxNumberOfBets
    ) {
      return false
    } else if (
      !!stopOnProfit &&
      stopOnProfit > 0 &&
      this.profit >= stopOnProfit
    ) {
      return false
    } else if (!!stopOnLoss && stopOnLoss > 0 && this.profit <= -stopOnLoss) {
      return false
    }

    return true
  }

  override getNextBetAmount() {
    if (this.winStreak > 0) {
      const { onWinModifier } = this.options

      if (onWinModifier !== null && onWinModifier > 0) {
        const modifier = 1 + onWinModifier / 100
        return this.startingBetAmount * Math.pow(modifier, this.winStreak)
      }
    } else if (this.lossStreak > 0) {
      const { onLossModifier } = this.options

      if (onLossModifier !== null && onLossModifier > 0) {
        const modifier = 1 + onLossModifier / 100
        return this.startingBetAmount * Math.pow(modifier, this.lossStreak)
      }
    }

    return this.startingBetAmount
  }
}
