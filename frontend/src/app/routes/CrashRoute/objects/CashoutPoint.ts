import * as PIXI from 'pixi.js'
import { gsap, Power4 } from 'gsap'

import { getWalletImageUri } from 'app/util'
import { type ActiveBet } from 'common/types/bets'
import { type ExchangeAndFormatCurrencyString } from 'app/hooks'

export class CashoutPoint extends PIXI.Container {
  amount: PIXI.Text | null
  crashBet: ActiveBet
  formatCurrency: ExchangeAndFormatCurrencyString
  constructor(
    multiplier,
    elapsed,
    crashBet,
    minimized = true,
    userCashout = false,
    flipped = false,
    formatCurrency: ExchangeAndFormatCurrencyString,
    options = {},
  ) {
    super()

    this.options = Object.assign(
      {
        animated: true,
        isLarge: false,
        isMobile: false,
      },
      options,
    )

    const { animated } = this.options

    this.targetSize = this.getTargetSize()
    this.hovered = false
    this.minimized = minimized // crashBet.betAmount <= 10
    this.hidden = options.isMobile
    this.elapsed = elapsed
    this.multiplier = multiplier
    this.userCashout = userCashout
    this.flipped = flipped
    this.targetPosition = null
    this.formatCurrency = formatCurrency
    this.amount = null
    this.crashBet = crashBet

    // const point = this.point = PIXI.Sprite.from(userCashout ? 'point_green.png' : 'point_purple.png')
    const point = (this.point = PIXI.Sprite.from(
      getWalletImageUri(crashBet.balanceType),
    ))
    point.alpha = animated ? 0 : 1
    // point.blendMode = PIXI.BLEND_MODES.ADD
    point.anchor.set(0.5)
    point.width = point.height = animated
      ? this.targetSize * 3
      : this.targetSize

    this.addChild(point)

    if (!this.hidden) {
      const name = (this.name = new PIXI.Text(
        this.multiplier.toFixed(2) + 'x',
        {
          fontFamily: 'Roboto',
          fontSize: 14,
          fontWeight: '800',
          fill: 0xffffff,
        },
      ))

      name.visible = !this.minimized

      const amount = (this.amount =
        this.amount ??
        new PIXI.Text(
          crashBet.payoutValue === 0
            ? 'Demo'
            : this.formatCurrency(crashBet.payoutValue),
          {
            fontFamily: 'Roboto',
            fontSize: 14,
            fontWeight: '400',
            fill: 0x8bc34a,
          },
        ))

      amount.visible = !this.minimized

      this.updateFlipped()
      this.addChild(name, amount)
    }

    this.onResize()

    if (animated) {
      gsap.to(point, 0.5, {
        ease: Power4,
        alpha: 1,
        width: this.targetSize,
        height: this.targetSize,
      })
    }
  }

  get isLarge() {
    return this.options.isLarge
  }

  set isLarge(isLarge) {
    this.options.isLarge = isLarge
    this.onResize()
  }

  updateCashoutAmount() {
    if (this.amount?.text) {
      this.amount.text = this.formatCurrency(this.crashBet.payoutValue)
    }
  }

  updateCurrencyFormat(newCurrencyFormat: ExchangeAndFormatCurrencyString) {
    this.formatCurrency = newCurrencyFormat
    this.updateCashoutAmount()
  }

  getTargetSize() {
    const { isLarge, isMobile } = this.options

    if (isMobile) {
      return 15
    }

    return isLarge ? 40 : 25
  }

  onResize() {
    this.targetSize = this.getTargetSize()
    this.point.width = this.point.height = this.targetSize

    if (!this.hidden) {
      const fontSize = this.options.isLarge ? 18 : 14
      this.name.style.fontSize = fontSize
      this.amount.style.fontSize = fontSize
      this.updateFlipped()
    }
  }

  updateFlipped() {
    if (this.hidden) {
      return
    }

    const { name, amount } = this

    if (this.flipped) {
      name.y = -this.targetSize + 3
      name.anchor.set(0.5, 1)

      amount.y = name.y - name.height
      amount.anchor.set(0.5, 1)
    } else {
      name.y = this.targetSize - 3
      name.anchor.set(0.5, 0)

      amount.y = name.y + name.height
      amount.anchor.set(0.5, 0)
    }
  }

  onDestroy() {
    gsap.killTweensOf(this.point)
  }

  setHovered(hovered) {
    if (this.hidden) {
      return
    }

    this.hovered = hovered

    if (hovered) {
      this.name.visible = true
      this.amount.visible = true
    } else if (this.minimized) {
      this.name.visible = false
      this.amount.visible = false
    }
  }

  minimize() {
    if (this.minimized || this.hidden) {
      return
    }

    this.minimized = true
    this.name.visible = false
    this.amount.visible = false
  }

  unminimize() {
    if (this.hidden) {
      return
    }

    this.minimized = false
    this.name.visible = true
    this.amount.visible = true
  }
}
