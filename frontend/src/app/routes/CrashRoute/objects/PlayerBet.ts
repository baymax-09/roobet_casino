import * as PIXI from 'pixi.js'
import { gsap, Power4 } from 'gsap'

import { getWalletImageUri } from 'app/util'
import { type ExchangeAndFormatCurrencyString } from 'app/hooks'
import { type ActiveBet } from 'common/types/bets'

export const PlayerBetHeight = 30

const OrbSize = 18
const BigPayoutValue = 100

export class PlayerBet extends PIXI.Container {
  multiplierText: PIXI.Text | null
  formatCurrency: ExchangeAndFormatCurrencyString
  bet: ActiveBet
  constructor(playerBets, bet, initialName, textStyles, formatCurrency) {
    super()

    this.app = playerBets.app
    this.bet = bet
    this.state = 'undetermined'
    this.initialName = initialName
    this.textStyles = textStyles
    this.formatCurrency = formatCurrency
    this.multiplierText = null

    this.updateBetData(bet, playerBets, initialName, textStyles)
  }

  updateCurrencyFormat(newCurrencyFormat: ExchangeAndFormatCurrencyString) {
    this.formatCurrency = newCurrencyFormat
    this.updateAmountText()
  }

  updateBetData(bet: any, playerBets: any, initialName: any, textStyles: any) {
    if (!bet.incognito) {
      this.buttonMode = true
      this.interactive = true

      this.on('pointerdown', () => {
        playerBets.emit('userClicked', bet.user.name)
      })
    }

    const nameText = (this.nameText = new PIXI.Text(
      initialName,
      textStyles.nameText,
    ))
    nameText.x = 8
    nameText.y = PlayerBetHeight / 2
    nameText.anchor.set(0, 0.5)

    if (bet.incognito) {
      nameText.alpha = 0.5
    }
    // nameText.alpha = 0.7
    // nameText.cacheAsBitmap = true

    const amountText = (this.amountText = new PIXI.Text(
      this.formatCurrency(bet.betAmount),
      textStyles.amountText.normal,
    ))

    amountText.y = PlayerBetHeight / 2
    amountText.anchor.set(1, 0.5)
    // amountText.cacheAsBitmap = true

    const currency = (this.currency = PIXI.Sprite.from(
      getWalletImageUri(bet.balanceType),
    ))
    currency.anchor.set(1, 0.5)
    currency.width = OrbSize
    currency.height = OrbSize
    currency.y = PlayerBetHeight / 2

    this.updateBet(bet, true)
    this.addChild(nameText, currency, amountText)
  }

  updateAmountText() {
    if (this.bet.cashoutCrashPoint) {
      this.amountText._style = this.textStyles.amountText.won
      this.amountText.text = `+${this.formatCurrency(this.bet.payoutValue)}`
    } else if (this.bet.closedOut && !this.bet.payoutValue) {
      this.showLoss()
    } else {
      this.amountText.text = this.formatCurrency(
        Number(this.bet.betAmount.toFixed(2)),
      )
    }
  }

  updateNameText() {
    this.nameText.text = this.initialName
    if (this.bet.incognito) {
      this.nameText.alpha = 0.5
    }
  }

  updateBet(bet, instant = false) {
    this.bet = bet

    if (bet.cashoutCrashPoint) {
      this.updateState('won', instant)
    }
  }

  enter() {
    if (this.visible) {
      return
    }

    if (this.enterTimeline) {
      this.enterTimeline.kill()
    }

    this.alpha = 1
    // this.x = -20
    this.visible = true

    // this.enterTimeline = gsap.timeline({
    //   defaults: {
    //     ease: Power4
    //   },
    //   onComplete: () => {
    //     this.enterTimeline = null
    //   }
    // })
    //
    // this.enterTimeline
    //   .to(this, {
    //     delay: 0.05,
    //     alpha: 1,
    //     x: 0
    //   })
  }

  exit() {
    if (this.enterTimeline) {
      this.enterTimeline.kill()
    }

    this.visible = false
  }

  onResize(width, height) {
    this.amountText.x = width - 8 - OrbSize - 5
    this.currency.x = width - 8
  }

  showLoss() {
    this.alpha = 0.5
    this.amountText.text = `-${this.formatCurrency(this.bet.betAmount)}`
  }

  updateLayoutWithCrashPoint(instant = false, initialize = false) {
    if (!this.orb) {
      const orb = (this.orb = PIXI.Sprite.from(
        this.bet.payoutValue >= BigPayoutValue ? 'point_yellow' : 'point_green',
      ))
      orb.alpha = !instant ? 0 : 1
      orb.anchor.set(0.5)
      orb.x = 14
      orb.y = PlayerBetHeight / 2
      orb.width = orb.height = !instant ? 0 : OrbSize
      this.addChild(orb)
    }
    if (initialize) {
      this.amountText._style = this.textStyles.amountText.won
      this.amountText.text = `+${this.formatCurrency(this.bet.payoutValue)}`
    }

    this.alpha = 1

    const multiplierText = (this.multiplierText =
      this.multiplierText ??
      new PIXI.Text(
        this.bet.cashoutCrashPoint.toFixed(2) + 'x',
        this.textStyles.amountText.won,
      ))
    multiplierText.x = this.amountText.x - this.amountText.width - 15
    multiplierText.y = PlayerBetHeight / 2
    multiplierText.anchor.set(1, 0.5)
    multiplierText.alpha = 0.5
    if (initialize) {
      this.addChild(multiplierText)
    }

    if (instant) {
      this.nameText.x = this.orb.x + 14
      return
    }

    if (initialize) {
      this.flash()
    }
    this.timeline = gsap.timeline({
      defaults: {
        ease: Power4,
      },

      onComplete: () => {
        this.timeline = null
      },
    })

    this.timeline

      .to(this.nameText, 0.2, {
        x: this.orb.x + 14,
        // width: 0,
        // height: 0,
        onComplete: () => {
          // this.orb.texture = PIXI.Texture.from(state === 'lost' ? 'point_red' : 'point_green')
        },
      })

      .to(this.orb, {
        alpha: 1,
        width: OrbSize,
        height: OrbSize,
      })
  }

  updateState(state, instant = false) {
    if (this.state === state) {
      return
    }

    if (!this.visible) {
      instant = true
    }

    this.state = state
    this.killTweens()

    this.updateLayoutWithCrashPoint(instant, true)
  }

  getColor() {
    return this.bet.payoutValue >= BigPayoutValue ? 0xffee6b : 0xabda74
  }

  flash() {
    if (this.flashTimeline) {
      this.flashTimeline.progress(1).kill()
      this.flashTimeline = null
    }

    const flash = new PIXI.Graphics()
    flash.beginFill(this.getColor())
    flash.drawRect(0, 0, this.app.screen.width, PlayerBetHeight)
    flash.endFill()
    this.addChild(flash)

    this.flashTimeline = gsap.timeline()

    this.flashTimeline.to(flash, {
      alpha: 0,

      onComplete: () => {
        this.removeChild(flash)
        this.flashTimeline = null
      },
    })
  }

  tick() {
    // intentionally empty, but unsure why
  }

  killTweens() {
    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }

    if (this.enterTimeline) {
      this.enterTimeline.kill()
      this.enterTimeline = null
    }
  }

  onDestroy() {
    if (this.flashTimeline) {
      this.flashTimeline.kill()
      this.flashTimeline = null
    }

    this.killTweens()
  }
}
