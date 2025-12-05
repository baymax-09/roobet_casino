import * as PIXI from 'pixi.js'
import { LeonSans } from 'src/vendors/leon'
import i18n from 'i18next'

import { View } from './View'

export class LoadingView extends View {
  constructor(viewManager, app, params) {
    super(viewManager, app, params)

    this.translate = i18n.t
    this.disconnected = this.params.disconnected || false
    this.outdated = this.params.outdated || false
  }

  override onCreate() {
    this.graphics = new PIXI.Graphics()
    this.header = new LeonSans({
      text: !this.outdated
        ? this.__('crash.loading')
        : this.__('crash.outdated'),
      color: [0xffffff],
      size: this.getSize(70),
      weight: 800,
    })

    let subText = ''

    if (this.outdated) {
      subText = this.__('crash.refreshBrowser')
    } else {
      subText = this.disconnected
        ? this.__('crash.reconnecting')
        : this.__('crash.pleaseWait')
    }

    this.subText = new PIXI.Text(subText, {
      fontFamily: 'Roboto',
      fontSize: this.getSize(40),
      fontWeight: '500',
      fill: 0xe6be4b,
    })

    this.subText.anchor.set(0.5, 0)

    this.addChild(this.graphics, this.subText)
  }

  drawText() {
    const { header, width, height } = this

    this.graphics.clear()

    header.position(
      width / 2 - header.rect.w / 2,
      height / 2 - header.rect.h / 2,
    )
    header.drawPixi(this.graphics)
  }

  override onResize(width, height) {
    this.drawText()

    this.subText.x = width / 2
    this.subText.y = this.header.rect.y + this.header.rect.h
  }

  override onDestroy() {
    // intentionally empty, but unsure why
  }
}
