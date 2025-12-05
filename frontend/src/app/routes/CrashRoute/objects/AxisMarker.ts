import * as PIXI from 'pixi.js'
import { DropShadowFilter } from 'pixi-filters'
import { TweenMax } from 'gsap'

import { drawDashedGraphicsLine } from 'app/util/pixi'

import { lerp } from '../util'

export class AxisMarker extends PIXI.Container {
  constructor(crashEngine, tooltipFill = 0x4b4c5c, options = {}) {
    super()

    this.options = Object.assign(
      {
        isMobile: false,
      },
      options,
    )

    this.tooltipFill = tooltipFill
    this.crashEngine = crashEngine
    this.targetMultiplier = null
    this.visible = false
    this.targetY = 0
    this.lastY = 0
    this.lastYAxis = 0

    this.tooltipHeight = 18

    this.graphics = new PIXI.Graphics()
    this.graphics.cacheAsBitmap = true

    this.label = new PIXI.Text('0.00x', {
      fontFamily: 'Roboto',
      fontSize: 11,
      fontWeight: '800',
      fill: 0xffffff,
      dropShadow: true,
      dropShadowAngle: Math.PI / 2,
      dropShadowAlpha: 0.5,
      dropShadowDistance: 2,
    })

    // this.label.alpha = 0.8
    this.label.y = this.tooltipHeight / 2
    this.label.anchor.set(0, 0.5)

    if (this.options.isMobile) {
      this.filters = [
        new DropShadowFilter({
          alpha: 0.6,
          blur: 6,
          quality: 6,
          distance: 1,
          color: 0x000000,
        }),
      ]
    }

    this.targetGraphics = new PIXI.Graphics()

    this.addChild(this.targetGraphics, this.graphics, this.label)
  }

  setTargetMultiplier(targetMultiplier) {
    this.targetMultiplier = targetMultiplier
    this.label.text = `${targetMultiplier.toFixed(2)}x`
    this.alpha = 0
    this.visible = true

    TweenMax.to(this, 1, {
      alpha: 1,
    })
  }

  tick() {
    if (this.visible) {
      if (this.targetMultiplier !== null) {
        this.y =
          this.crashEngine.getMultiplierY(this.targetMultiplier) -
          this.tooltipHeight / 2

        this.targetGraphics.clear()
        this.targetGraphics.beginFill(this.tooltipFill, 0.04)
        this.targetGraphics.drawRect(
          0,
          this.tooltipHeight / 2 + 1,
          this.crashEngine.plotWidth,
          this.crashEngine.plotHeight - this.y - 10,
        )
        // this.targetGraphics.moveTo(0, this.y)
        // this.targetGraphics.lineTo(this.crashEngine.plotWidth, this.y)
        // this.targetGraphics.lineTo(this.crashEngine.plotWidth, this.crashEngine.plotHeight)
        // this.targetGraphics.lineTo(0, this.crashEngine.plotHeight)
        // this.targetGraphics.lineTo(0, this.y)
        this.targetGraphics.endFill()

        return
      }

      // Animate closer to the y-marker
      if (Math.abs(this.targetY - this.y) > 0.1) {
        const target =
          Math.min(
            this.targetY,
            this.crashEngine.plotHeight + this.tooltipHeight / 2 + 3,
          ) - this.height
        this.y = lerp(this.y, target, 0.1)
      }

      if (
        ~~this.y !== this.lastY ||
        !this.lastYAxis !== this.crashEngine.yAxis
      ) {
        let multiplier = this.crashEngine.getYMultiplier(
          this.y + this.tooltipHeight / 2,
        )

        if (multiplier < 1) {
          multiplier = 1
        }

        this.label.text = `${multiplier.toFixed(2)}x`

        this.lastY = ~~this.y
        this.lastYAxis = this.crashEngine.yAxis
      }
    }
  }

  drawTooltip(fill, alpha = 1, offsetY = 0) {
    const tx = this.crashEngine.plotWidth // - 14
    const twidth = this.crashEngine.plotOffsetX // + 15

    this.graphics.beginFill(fill, alpha)
    this.graphics.moveTo(tx, this.tooltipHeight / 2 + offsetY)
    this.graphics.lineTo(tx + 10, offsetY)
    this.graphics.lineTo(tx + twidth, offsetY)
    this.graphics.lineTo(tx + twidth, this.tooltipHeight + offsetY)
    this.graphics.lineTo(tx + 10, this.tooltipHeight + offsetY)
    this.graphics.closePath()
    this.graphics.endFill()

    this.graphics.beginFill(0xffffff, 0.08)
    this.graphics.moveTo(tx, this.tooltipHeight / 2 + offsetY)
    this.graphics.lineTo(tx + 10, offsetY)
    this.graphics.lineTo(tx + twidth, offsetY)
    this.graphics.lineTo(tx + twidth, this.tooltipHeight / 2 + offsetY)
    this.graphics.lineTo(tx, this.tooltipHeight / 2 + offsetY)
    // this.graphics.lineTo(tx + twidth, this.tooltipHeight + offsetY)
    // this.graphics.lineTo(tx + 10, this.tooltipHeight + offsetY)
    this.graphics.closePath()

    this.graphics.endFill()
  }

  onResize() {
    const markerWidth = this.crashEngine.plotWidth - 15
    const lineY = this.tooltipHeight / 2

    this.label.x = this.crashEngine.plotWidth + 16

    this.graphics.cacheAsBitmap = false
    this.graphics.clear()

    this.graphics.lineStyle(2, this.tooltipFill, 0.8)
    this.graphics.moveTo(0, lineY)

    drawDashedGraphicsLine(
      this.graphics,
      this.crashEngine.graphWidth,
      lineY,
      3,
      3,
    )
    this.graphics.lineStyle(0)

    // this.drawTooltip(0x000000, 0.2, 4)
    this.drawTooltip(this.tooltipFill)
    this.graphics.cacheAsBitmap = true
  }
}
