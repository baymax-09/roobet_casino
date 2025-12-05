import * as PIXI from 'pixi.js'
import { DropShadowFilter } from 'pixi-filters'
import * as particles from '@pixi/particle-emitter'

import { lerp } from '../util'

const ShipHeight = 100

export class Rocket extends PIXI.Container {
  constructor(shipTextureName, emitterConfig) {
    super()

    this._targetX = 0
    this._targetY = 0
    this._targetAngle = 0
    this._crashed = false

    const ship = (this.ship = PIXI.Sprite.from(shipTextureName))

    ship.filters = [
      new DropShadowFilter({
        alpha: 0.35,
        blur: 0,
        quality: 4,
        distance: 3,
        color: 0x000000,
      }),
    ]

    // Always ensure proper ship height
    const shipScale = ShipHeight / ship.height
    ship.y = -15
    ship.height = ShipHeight
    ship.width = ship.width * shipScale
    ship.anchor.set(0.5, 0)

    const trailContainer = new PIXI.Container()
    this.trailEmitter = new particles.Emitter(trailContainer, {
      ...emitterConfig,

      pos: {
        ...emitterConfig.pos,
        y: ship.y + ship.height + 5,
      },
    })

    this.addChild(trailContainer, ship)
  }

  // NOTE: Saving these comment snippets!! - DQ
  // set x(value) {
  //   if (Math.abs(value - super.x) > 0.5) {
  //     this._targetX = value
  //     this._updateX = true
  //   }
  // }

  // set y(value) {
  //   if (Math.abs(value - super.y) > 1) {
  //     this._targetY = value
  //     this._updateY = true
  //   }
  // }

  override get angle() {
    return super.angle
  }

  override set angle(value) {
    if (Math.abs(value - super.angle) > 0.2) {
      this._targetAngle = value
      this._updateAngle = true
    }
  }

  get crashed() {
    return this._crashed
  }

  set crashed(value) {
    this.visible = false
    this._crashed = value
    this.trailEmitter.emit = false
    this.trailEmitter.cleanup()
  }

  tick(elapsedMS) {
    // No need to update if the rocket has crashed :(
    if (this._crashed) {
      return
    }

    // Note: Saving these comment snippets! - DQ
    // if (this._updateX) {
    //   super.x = lerp(super.x, this._targetX, 0.1)
    //   this._updateX = false
    // }

    // if (this._updateY) {
    //   super.y = lerp(super.y, this._targetY, 0.25)
    //   this._updateY = false
    // }

    if (this._updateAngle) {
      super.angle = lerp(super.angle, this._targetAngle, 0.1)
      this._updateAngle = false
    }

    if (this.trailEmitter.emit) {
      this.trailEmitter?.update(elapsedMS * 0.001)
    }
  }

  override destroy() {
    super.destroy()

    this.trailEmitter.emit = false
    this.trailEmitter.cleanup()
    this.trailEmitter.destroy()
    this.trailEmitter = undefined
  }
}
