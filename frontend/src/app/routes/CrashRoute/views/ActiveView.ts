import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import { DropShadowFilter } from 'pixi-filters'
import { gsap, Power4 } from 'gsap'
import anime from 'animejs'
import { LeonSans } from 'src/vendors/leon'

import { type ExchangeAndFormatCurrencyString } from 'app/hooks'

import { View } from './View'
import { CrashEngine } from '../CrashEngine'
import { lerp, getDistance } from '../util'
import { AxisMarker, CashoutPoint } from '../objects'
import { MobileWidth } from '../constants'

const AxisTickWidth = 2

const YAxisLabelFontSize = 12
const YAxisLabelFontSizeSmall = 11
const YAxisLabelColor = 0x5f6175
const YAxisLabelColorHint = 0x35364c

export class ActiveView extends View {
  cashoutPoint: PIXI.Container | null
  formatCurrency: ExchangeAndFormatCurrencyString
  cashouts: CashoutPoint[]

  constructor(viewManager, app, params) {
    super(viewManager, app, params)

    this.xTickWidth = 10
    this.xLabelIndex = 0
    this.yTickWidth = 15
    this.yLabelIndex = 1

    this.demoMode = this.params.demoMode || false
    this.betAmount = this.params.betAmount || 0
    this.autoCashoutMultiplier = null
    this.flipCashout = false

    this.cashoutsAngle = 0
    this.cashouts = []
    this.crashEngine = this.viewManager.attachments.crashEngine
    this.lastCashoutTick = null

    this.isMobile = this.width <= MobileWidth
    this.cashoutPoint = null
    this.formatCurrency = this.params.formatCurrency

    if (!this.isMobile) {
      this.interactive = true
      this.cursor = 'crosshair'
      this.mousemove = this.onMouseMove
    }
  }

  onMouseMove = event => {
    const { x, y } = event.data.global
    const { graphWidth, graphHeight } = this.crashEngine
    const inAppBounds = y >= 0 && x >= 0 && x <= graphWidth && y < graphHeight

    this.yAxisMarker.visible = inAppBounds
    this.yAxisMarker.targetY = y + this.yAxisMarker.tooltipHeight / 2

    // After going out of view, reset the Y so we can have a nice animation
    // next time it enters back in, starting from the top or bottom half
    if (!this.yAxisMarker.visible) {
      this.yAxisMarker.y = y > graphHeight / 2 ? graphHeight : 0
    }
  }

  addCashout(multiplier, crashBet, userCashout = false, animated = true) {
    if (this.width <= MobileWidth) {
      animated = false
    }

    this.flipCashout = !this.flipCashout

    const elapsed = CrashEngine.getMultiplierElapsed(multiplier)
    const newCashout = (this.cashoutPoint = new CashoutPoint(
      multiplier,
      elapsed,
      crashBet,
      this.cashoutsContainer.children.length > 2,
      userCashout,
      this.flipCashout,
      this.formatCurrency,
      {
        animated,
        isLarge: this.isLarge,
        isMobile: this.width <= 500,
      },
    ))

    newCashout.point.interactive = true
    newCashout.point.buttonMode = true

    newCashout.point
      .on('pointerover', () => {
        newCashout.setHovered(true)

        for (const child of this.cashoutsContainer.children) {
          if (child === newCashout) {
            continue
          }

          child.alpha = 0.1
        }
      })
      .on('pointerout', () => {
        newCashout.setHovered(false)

        for (const child of this.cashoutsContainer.children) {
          child.alpha = 1
        }
      })

    const position = this.crashEngine.getElapsedPosition(elapsed)
    newCashout.x = position.x
    newCashout.y = position.y

    this.cashouts.push(newCashout)
    this.cashouts.sort((a, b) => a.elapsed - b.elapsed)

    this.cashoutsContainer.addChild(newCashout)

    if (userCashout) {
      this.cashoutYAxisMarker.setTargetMultiplier(
        CrashEngine.getElapsedPayout(elapsed),
      )
    }
  }

  override onCreate() {
    this.gameContainer = new PIXI.Container()
    this.labelsContainer = new PIXI.Container()

    this.flag = PIXI.Sprite.from('flag')
    this.flag.anchor.set(1, 0.5)
    this.flag.alpha = 0
    this.flag.width = this.flag.height = 0
    this.flag.visible = false

    if (this.width > MobileWidth) {
      this.flag.filters = [
        new DropShadowFilter({
          alpha: 0.15,
          blur: 2,
          quality: 4,
          distance: 1,
          color: 0xffffff,
        }),
      ]
    }

    this.textGraphics = new PIXI.Graphics()
    // this.textGraphics.alpha = 0.7

    this.lagText = new PIXI.Text(this.__('crash.lagDetected'), {
      fontFamily: 'Roboto',
      fontWeight: '500',
      fontSize: 14,
      fill: 0xe6be4b,
    })

    this.lagText.visible = this.crashEngine.lag
    this.lagText.anchor.set(0)
    this.lagText.x = 5
    this.lagText.y = 5
    this.lagText.alpha = 0.5

    this.multiplierHeader = new LeonSans({
      text: this.__('crash.currentPayout'),
      color: [0x7a7a9a],
      size: this.getSize(45),
      weight: 800,
    })

    this.multiplierTextContainer = new PIXI.Container()
    this.multiplierText = new PIXI.Text('0.00x', {
      fontFamily: 'Roboto',
      fontWeight: '800',
      fill: 0xffffff,
      dropShadow: true,
      dropShadowAngle: Math.PI / 2,
      dropShadowAlpha: 0.15,
      dropShadowDistance: 6,
      // padding: 400
    })

    this.multiplierText.anchor.set(0.5)

    this.multiplierTextJumpAnimation = anime.timeline({
      autoplay: false,
    })

    this.multiplierTextJumpAnimation.add({
      targets: this.multiplierText.scale,
      easing: 'easeOutElastic',
      x: [1, 1.15],
      y: [1, 1.15],
    })

    this.xLabels = Array.from(
      {
        length: 20,
      },
      (_, i) => {
        const xLabel = new PIXI.Text('0s', {
          fontFamily: 'Roboto',
          fontSize: YAxisLabelFontSize,
          fontWeight: '500',
          fill: YAxisLabelColor,
        })

        xLabel.visible = false
        xLabel.anchor.set(0.5, 0)
        this.labelsContainer.addChild(xLabel)
        return xLabel
      },
    )

    this.yLabels = Array.from(
      {
        length: 50,
      },
      (_, i) => {
        const yLabel = new PIXI.Text(i === 0 ? '1.00x' : '', {
          fontFamily: 'Roboto',
          fontSize: YAxisLabelFontSize,
          fontWeight: '500',
          fill: YAxisLabelColor,
        })

        yLabel.visible = false
        yLabel.anchor.set(0, 0.5)
        yLabel.y = 100
        this.labelsContainer.addChild(yLabel)
        return yLabel
      },
    )

    this.mainLine = new PIXI.Graphics()
    this.xGraphics = new PIXI.Graphics()
    this.yGraphics = new PIXI.Graphics()

    const rocket = (this.rocket = this.crashEngine.createSeededRocket(
      this.params.id,
    ))
    rocket.angle = 90
    rocket.x = 0
    rocket.y = this.crashEngine.plotHeight

    this.profitText =
      this.profitText ??
      new PIXI.Text(
        this.demoMode
          ? this.__('crash.demoMode')
          : `+ ${this.formatCurrency(0)}`,
        {
          fontFamily: 'Roboto',
          fontWeight: '600',
          fontSize: this.getSize(70),
          fill: 0x8bc34a,
          dropShadow: true,
          dropShadowAngle: Math.PI / 2,
          dropShadowAlpha: 0.15,
          dropShadowDistance: 6,
          letterSpacing: 2,
          // padding: 400
        },
      )

    this.profitText.visible = false // this.betAmount > 0
    this.profitText.anchor.set(0.5)
    this.profitText.scale.set(0)

    const explosions = (this.explosions = new Spine(
      this.app.loader.resources.explosions.spineData,
    ))
    explosions.visible = this.crashEngine.getElapsedTime() <= 2000
    explosions.scale.set(0.5)

    explosions.state.addListener({
      start: () => {
        explosions.visible = true
      },

      complete: () => {
        explosions.visible = false
      },
    })

    this.cashoutsContainer = new PIXI.Container()

    if (!this.isMobile) {
      this.yAxisMarker = new AxisMarker(this.crashEngine)
    }

    this.cashoutYAxisMarker = new AxisMarker(this.crashEngine, 0x4caf50)
    this.cashoutYAxisMarker.visible = false

    this.gameContainer.addChild(
      this.xGraphics,
      this.yGraphics,
      this.labelsContainer,
      this.mainLine,
      this.flag,
      this.cashoutYAxisMarker,
      this.cashoutsContainer,
      this.rocket,
      this.lagText,
      explosions,
    )

    if (this.yAxisMarker) {
      this.gameContainer.addChild(this.yAxisMarker)
    }

    this.addChild(
      this.gameContainer,
      this.textGraphics,
      this.multiplierText,
      this.profitText,
    )

    if (explosions.visible) {
      explosions.x = -15
      explosions.y = this.crashEngine.plotHeight
      explosions.state.setAnimation(0, 'Fx04')
    }
  }

  crash() {
    this.hideProfitText()
    this.multiplierText.style.fill = 0xf44336

    this.rocket.crashed = true

    this.explosions.visible = true
    this.explosions.x = this.rocket.x - 25
    this.explosions.y = this.rocket.y + 5
    this.explosions.state.setAnimation(0, 'Fx03_text')

    this.textGraphics.alpha = 0.5
    this.multiplierHeader.text = this.__('crash.roundOver')

    this.drawText()
  }

  getRocketAngle(x, y) {
    const previousPosition = this.crashEngine.getElapsedPosition(
      this.crashEngine.elapsedTime - 1000,
    )
    let rocketAngle =
      (Math.atan2(previousPosition.x - x, previousPosition.y - y) * 180) /
      Math.PI

    if (rocketAngle < 0) {
      rocketAngle = Math.abs(rocketAngle)
    } else {
      rocketAngle = 360 - rocketAngle
    }

    return rocketAngle
  }

  updateProfitText() {
    const profit = this.crashEngine.betAmount * this.crashEngine.multiplier
    this.profitText.text = `+ ${this.formatCurrency(
      profit,
      profit < 1 ? '0,0.000' : '0,0.00',
    )}`
  }

  updateCurrency(newCurrencyFormat: ExchangeAndFormatCurrencyString) {
    this.formatCurrency = newCurrencyFormat
    this.updateProfitText()
    for (const cashoutPoint of this.cashouts) {
      cashoutPoint.updateCurrencyFormat(newCurrencyFormat)
    }
  }

  updateCashouts() {
    const { cashouts } = this
    const now = Date.now()

    const updateVisiblePoints =
      this.lastCashoutTick === null || now - this.lastCashoutTick > 300

    const lastCashout = null

    for (let i = 0; i < cashouts.length; i++) {
      const cashout = cashouts[i]
      const prev = cashouts[i - 1]

      if (i > 0) {
        const targetFlipped = !prev.flipped

        if (cashout.flipped !== targetFlipped) {
          cashout.flipped = targetFlipped
          cashout.updateFlipped()
        }
      }

      const position = this.crashEngine.getElapsedPosition(cashout.elapsed)
      cashout.x = lerp(cashout.x, position.x, 0.15)
      cashout.y = lerp(cashout.y, position.y, 0.15)

      if (cashout.hovered) {
        continue
      }

      if (updateVisiblePoints) {
        let last = cashouts[i - 2]

        for (let j = i - 2; j >= 0; j -= 2) {
          if (cashouts[j].flipped === cashout.flipped && cashouts[j].visible) {
            last = cashouts[j]
            break
          }
        }

        cashout.unminimize()

        if (last) {
          const distance = getDistance(cashout.x, cashout.y, last.x, last.y)

          if (distance > 60) {
            if (cashout.minimized) {
              cashout.unminimize()
            }
          } else {
            if (!cashout.minimized) {
              cashout.minimize()
            }
          }
        }
      }
    }

    if (updateVisiblePoints) {
      this.lastCashoutTick = now
    }
  }

  hideProfitText() {
    if (this.demoMode) {
      return
    }

    gsap.killTweensOf(this.profitText.scale)
    gsap.to(this.profitText.scale, 0.5, {
      x: 0,
      y: 0,
      ease: Power4.out,
      onComplete: () => {
        this.profitText.visible = false
      },
    })
  }

  override tick() {
    const { x, y } = this.crashEngine.getElapsedPosition(
      this.crashEngine.elapsedTime,
    )

    if (this.crashEngine.lag && !this.lagText.visible) {
      this.lagText.visible = true
    } else if (!this.crashEngine.lag && this.lagText.visible) {
      this.lagText.visible = false
    }

    this.updateCashouts()
    this.updateMultiplier()

    if (
      this.crashEngine.state === CrashEngine.States.Active &&
      (this.crashEngine.betAmount > 0 || this.demoMode)
    ) {
      if (!this.profitText.visible) {
        this.profitText.visible = true

        gsap.to(this.profitText.scale, 0.5, {
          x: 1,
          y: 1,
          ease: Power4.out,
        })
      }

      if (!this.demoMode) {
        this.updateProfitText()
      }
    }

    // if (this.profitText.visible) {
    //   const profit = this.betAmount * this.crashEngine.multiplier
    //   this.profitText.text = `+ ${numeral(profit).format(profit < 1 ? '$0,0.0000' : '$0,0.00')}`
    // }

    this.drawX()
    this.drawY()
    this.drawLine(this.mainLine, 0x8a73c4, 0, this.crashEngine.elapsedTime)

    this.rocket.x = x
    this.rocket.y = y
    this.rocket.angle = this.getRocketAngle(x, y)
    this.rocket.tick(this.app.ticker.elapsedMS)

    this.viewManager.rainContainer.angle = this.rocket.angle

    if (!!this.yAxisMarker && this.yAxisMarker.visible) {
      this.yAxisMarker.tick()
    }

    if (this.cashoutYAxisMarker.visible) {
      this.cashoutYAxisMarker.tick()
    }

    if (this.autoCashoutMultiplier !== null) {
      this.flag.y = this.crashEngine.getMultiplierY(this.autoCashoutMultiplier)

      if (!this.flag.visible) {
        if (this.flag.y > this.flag.height + 5) {
          this.flag.visible = true

          gsap.to(this.flag, {
            alpha: 1,
            width: 18,
            height: 18,
          })
        }
      }
    }

    // this.explosions.x = this.rocket.x
    // this.explosions.y = this.rocket.y
  }

  updateMultiplier() {
    const now = Date.now()
    const lastAnimatedMultiplierElapsed =
      now - (this.lastAnimatedMultiplierUpdate || 0)
    const multiplier = this.crashEngine.multiplier.toFixed(3)
    const animatedMultiplier = multiplier.slice(0, -3)

    this.multiplierText.text = `${multiplier.slice(0, -1)}x`

    if (
      animatedMultiplier !== this.lastAnimatedMultiplier &&
      lastAnimatedMultiplierElapsed > 500
    ) {
      // if (this.lastAnimatedMultiplierUpdate && lastAnimatedMultiplierElapsed < 300 && !this.animateWholeMultiplier) {
      //   this.animateWholeMultiplier = true
      // }

      this.multiplierTextJumpAnimation.restart()
      this.lastAnimatedMultiplier = animatedMultiplier
      this.lastAnimatedMultiplierUpdate = now
    }
  }

  drawX() {
    const { xAxis, plotWidth, plotHeight } = this.crashEngine
    const milisecondsSeparation = this.stepValues(xAxis, 5, 2)
    const xAxisValuesSeparation = plotWidth / (xAxis / milisecondsSeparation)

    this.xLabelIndex = 0
    this.xGraphics.clear()

    for (
      let i = 0, elapsed = 0, counter = 0;
      elapsed < xAxis;
      elapsed += milisecondsSeparation, counter++, i++
    ) {
      if (i > 0) {
        const seconds = elapsed / 1000
        const x = i === 0 ? 4 : counter * xAxisValuesSeparation
        const y = plotHeight

        if (this.xGraphics._lineStyle !== 0.2) {
          this.xGraphics.lineStyle(2, 0xffffff, 0.25)
        }

        this.updateXLabel(`${seconds.toFixed(0)}s`, x)

        this.xGraphics.moveTo(x, y - this.xTickWidth / 2)
        this.xGraphics.lineTo(x, y + this.xTickWidth - this.xTickWidth / 2)
      }

      if (i > 100) {
        break
      }
    }

    // Clear any used yLabels
    for (let i = this.xLabelIndex + 1; i < this.xLabels.length; i++) {
      if (this.xLabels[i].visible) {
        this.xLabels[i].visible = false
      }
    }
  }

  override onResize(width, height) {
    this.isMobile = width <= MobileWidth
    this.isLarge = width > 800

    /* eslint-disable id-length */
    for (const c of this.cashoutsContainer.children) {
      if (c.isLarge !== this.isLarge) {
        c.isLarge = this.isLarge
      }
    }
    /* eslint-enable id-length */

    const { plotWidth, plotHeight, plotOffsetX, graphWidth, graphHeight } =
      this.crashEngine

    for (const yLabel of this.yLabels) {
      yLabel.x = plotWidth + 5
    }

    for (const xLabel of this.xLabels) {
      xLabel.y = plotHeight + 10 // + (plotOffsetX / 2)
    }

    this.yLabels[0].y = plotHeight
    this.yLabels[0].visible = true

    this.multiplierText.x = (this.isMobile ? graphWidth : plotWidth) / 2
    this.multiplierText.y = (this.isMobile ? graphHeight : plotHeight) / 2
    this.multiplierText.style.fontSize = this.getSize(200)

    this.drawText()

    this.profitText.x = plotWidth / 2
    this.profitText.y =
      this.multiplierHeader.rect.y + this.multiplierHeader.rect.h + 35

    this.flag.x = plotWidth - 20

    if (this.yAxisMarker) {
      this.yAxisMarker.onResize()
    }

    this.cashoutYAxisMarker.onResize()
  }

  drawText() {
    const { plotWidth } = this.crashEngine

    const color =
      this.crashEngine.state === CrashEngine.States.Over ? 0xf44336 : 0x7a7a9a

    this.textGraphics.clear()

    this.multiplierHeader.color = [color]
    this.multiplierHeader.position(
      plotWidth / 2 - this.multiplierHeader.rect.w / 2,
      this.multiplierText.y + this.multiplierText.height / 2 - 15,
    )
    this.multiplierHeader.drawPixi(this.textGraphics)
  }

  override onDestroy() {
    this.cashouts = []

    const cashouts = this.cashoutsContainer.children

    for (const cashout of cashouts) {
      cashout.onDestroy()
    }

    if (this.yAxisMarker) {
      gsap.killTweensOf(this.yAxisMarker)
    }

    gsap.killTweensOf(this.flag)
    gsap.killTweensOf(this.profitText.scale)
    this.rocket.destroy()
  }

  stepValues(x, rm = 5, cm = 2) {
    console.assert(Number.isFinite(x))

    // eslint-disable-next-line id-length
    let c = 0.4
    let r = 0.1

    while (true) {
      if (x < c) {
        return r
      }

      c *= rm
      r *= cm

      if (x < c) {
        return r
      }

      c *= cm
      r *= rm
    }
  }

  updateXLabel(text, x) {
    this.xLabelIndex += 1

    if (this.xLabelIndex >= this.xLabels.length) {
      return false
    }

    const label = this.xLabels[this.xLabelIndex]

    if (label.text !== text) {
      label.text = text
    }

    if (label.x !== x) {
      label.x = x
    }

    if (!label.visible) {
      label.visible = true
    }

    return label
  }

  updateYLabel(text, y) {
    this.yLabelIndex += 1

    if (this.yLabelIndex >= this.yLabels.length) {
      return false
    }

    const label = this.yLabels[this.yLabelIndex]

    if (label.text !== text) {
      label.text = text
    }

    if (label.y !== y) {
      label.y = y
      label.x = this.crashEngine.plotWidth + 5
    }

    if (!label.visible) {
      label.visible = true
    }

    return label
  }

  drawYSubTicks(x, y, subTicks, subTickSpacing, payout, heightIncrement) {
    for (let i2 = 1; i2 < subTicks; i2++) {
      const subTickCentered = i2 === subTicks / 2
      const subTickWidth = subTickCentered ? 12 : 7
      const subTickY = ~~(y + (subTickSpacing / subTicks) * i2) + 0.5
      const highlighted = false
      const color = highlighted ? 0xddb43f : 0xffffff
      const alphaOffset = highlighted ? 0.5 : 0

      if (highlighted) {
        // this.yAxisMarkerWidthTarget = subTickWidth
        this.yTickWasHighlighted = true
      }

      if (subTickCentered) {
        if (this.yGraphics._lineStyle !== 0.12 + alphaOffset) {
          this.yGraphics.lineStyle(AxisTickWidth, color, 0.12 + alphaOffset)
        }

        const subTickPayout = this.crashEngine.getYMultiplier(subTickY)
        const label = this.updateYLabel(
          `${subTickPayout.toFixed(2)}x`,
          subTickY,
        )

        if (label && label.style.fontSize !== YAxisLabelFontSizeSmall) {
          label.style.fill = YAxisLabelColorHint
          label.style.fontSize = YAxisLabelFontSizeSmall
          label.style.fontWeight = 500
        }
      } else {
        if (this.yGraphics._lineStyle !== 0.07 + alphaOffset) {
          this.yGraphics.lineStyle(AxisTickWidth, color, 0.07 + alphaOffset)
        }
      }

      this.yGraphics.moveTo(x - subTickWidth, subTickY)
      this.yGraphics.lineTo(x, subTickY)
    }
  }

  drawY() {
    const { yAxis, plotWidth, plotHeight, multiplier } = this.crashEngine
    const payoutSeparation = this.stepValues(!multiplier ? 1 : multiplier)
    const heightIncrement = plotHeight / yAxis
    const subTickSpacing = payoutSeparation * heightIncrement
    let subTicks = Math.max(
      2,
      Math.min(16, ~~(subTickSpacing / Math.max(3, yAxis / payoutSeparation))),
    )

    if (subTicks % 2 !== 0) {
      subTicks += 1
    }

    this.yTickWasHighlighted = false
    this.yLabelIndex = 0
    this.yGraphics.clear()

    let payout = payoutSeparation
    let i = 0

    for (; payout < yAxis; payout += payoutSeparation, i++) {
      if (this.yGraphics._lineStyle !== 0.25) {
        this.yGraphics.lineStyle(AxisTickWidth, 0xffffff, 0.25)
      }

      const x = ~~plotWidth + 0.5
      const y = plotHeight - payout * heightIncrement

      this.yGraphics.moveTo(x - this.yTickWidth, y)
      this.yGraphics.lineTo(x, y)

      const label = this.updateYLabel(`${(payout + 1).toFixed(2)}x`, y)

      if (label && label.style.fontSize !== YAxisLabelFontSize) {
        label.style.fill = YAxisLabelColor
        label.style.fontSize = YAxisLabelFontSize
        label.style.fontWeight = 500
      }

      if (!this.isMobile) {
        this.drawYSubTicks(x, y, subTicks, subTickSpacing)
      }

      if (i > 100) {
        break
      }
    }

    if (!this.isMobile) {
      // Draw the last yAxis subticks
      this.drawYSubTicks(
        ~~plotWidth + 0.5,
        plotHeight - payout * heightIncrement,
        subTicks,
        subTickSpacing,
      )
    }

    // this.gridGraphics.moveTo(5, plotHeight)
    // this.gridGraphics.lineTo(plotWidth - this.yTickWidth - 5, plotHeight)

    this.yGraphics.lineStyle(AxisTickWidth, 0xffffff, 0.25)
    this.yGraphics.moveTo(~~plotWidth + 0.5 - this.yTickWidth, plotHeight)
    this.yGraphics.lineTo(~~plotWidth + 0.5, plotHeight)

    if (!this.yTickWasHighlighted) {
      this.yAxisMarkerWidthTarget = 0
    }

    // Clear any used yLabels
    for (let i = this.yLabelIndex + 1; i < this.yLabels.length; i++) {
      if (this.yLabels[i].visible) {
        this.yLabels[i].visible = false
      }
    }
  }

  drawLine(graphics, fill, elapsedStart, elapsedEnd) {
    graphics.clear()
    graphics.lineStyle(this.isMobile ? 2 : this.isLarge ? 5 : 3, fill)

    let lastX = null

    for (let t = elapsedStart, i = 0; t <= elapsedEnd; t += 100, i++) {
      const { x, y } = this.crashEngine.getElapsedPosition(t)

      // if (
      //   this.rocket.children.length > 0 &&
      //   this.rocket.children[0].children.length > 0 &&
      //   this.rocket.children[0].children[0].containsPoint(new PIXI.Point(x, y))
      // ) {
      //   graphics.lineTo(x, y)
      //   break
      // }

      if (t === elapsedStart) {
        graphics.moveTo(x, y)
      } else {
        if (i > 20 && lastX !== null && x - lastX < 10) {
          continue
        }

        graphics.lineTo(x, y)
        lastX = x
      }
    }
  }
}
