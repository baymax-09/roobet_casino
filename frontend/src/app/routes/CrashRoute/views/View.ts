import * as PIXI from 'pixi.js'
import i18n from 'i18next'

export class View extends PIXI.Container {
  constructor(viewManager, app, params) {
    super()

    this.viewManager = viewManager
    this.app = app
    this.params = params

    this.renderer = app.renderer
  }

  // _ simplifies using i18n translations inside of views
  __ = i18n.t

  override get width() {
    return this.app.screen.width
  }

  override get height() {
    return this.app.screen.height
  }

  getSize(size) {
    let ratio =
      Math.sqrt(this.width * this.width + this.height * this.height) / 1800

    if (ratio > 1) {
      ratio = 1
    } else if (ratio < 0.4) {
      ratio = 0.4
    }

    return size * ratio
  }

  tick() {
    // intentionally left empty, but unsure why
  }

  onResize(width, height) {
    // intentionally left empty, but unsure why
  }

  onCreate() {
    // intentionally left empty, but unsure why
  }

  onDestroy() {
    // intentionally left empty, but unsure why
  }
}
