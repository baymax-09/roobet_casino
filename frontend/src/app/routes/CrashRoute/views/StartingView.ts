import * as PIXI from 'pixi.js'
import anime from 'animejs'
import { gsap, Power4 } from 'gsap'
import { LeonSans } from 'src/vendors/leon'

import { View } from './View'
import { MobileWidth } from '../constants'

export class StartingView extends View {
  constructor(viewManager, app, params) {
    super(viewManager, app, params)

    this.crashEngine = this.viewManager.attachments.crashEngine
    this.startingTime = this.params.startingTime
    this.startingSoon = false
    this.seconds = 0
    this.isMobile = this.width <= MobileWidth
  }

  override onCreate() {
    this.container = new PIXI.Container()
    this.graphics = new PIXI.Graphics()

    if (!this.isMobile) {
      this.graphics.alpha = 0
      this.graphics.y = 20
    }

    this.header = new LeonSans({
      text: this.__('crash.preparingRound'),
      color: [0xffffff],
      size: this.getSize(85),
      weight: 800,
    })

    this.text = new PIXI.Text(this.__('crash.startingIn', { elapsed: 0 }), {
      fontFamily: 'Roboto',
      fontSize: this.getSize(40),
      fontWeight: '500',
      fill: 0xe6be4b,
    })

    this.text.anchor.set(0.5, 0)

    if (!this.isMobile) {
      this.rocket = this.crashEngine.createSeededRocket(this.params.id)
      this.rocket.x = this.rocket.ship.width / 2 - 15
      this.rocket.y = this.rocket.ship.height / 2
    }

    this.drawText()

    this.container.addChild(this.graphics, this.text)

    if (!this.isMobile) {
      this.animateIn()
      this.container.addChild(this.rocket)
    }

    this.addChild(this.container)
  }

  animateIn() {
    const { header } = this

    header.updateDrawingPaths()

    for (let i = 0; i < header.drawing.length; i++) {
      gsap.killTweensOf(header.drawing[i])
      header.drawing[i].value = 0
    }

    const tl = (this.tl = gsap.timeline({
      defaults: {
        ease: Power4.easeOut,
      },
    }))

    tl.to(this.graphics, {
      y: 0,
      alpha: 1,
      onStart: () => {
        for (let i = 0; i < header.drawing.length; i++) {
          header.drawing[i].value = 0

          gsap.fromTo(
            header.drawing[i],
            1,
            {
              value: 0,
            },
            {
              delay: i * 0.03,
              value: 1,
              ease: Power4.easeOut,
            },
          )
        }
      },
    })

    tl.to(
      this.rocket,
      1,
      {
        y: 0, // (this.rocket.height / 2),// + 40,
        alpha: 1,
      },
      '-=0.5',
    )

    // tl.to(this.blurFilter, {
    //   blur: 0
    // }, '-=0.7')

    tl.resume()
  }

  drawText() {
    const { width, height, seconds, header, text } = this

    this.graphics.clear()

    header.color = [0xffffff]
    header.position(!this.isMobile ? this.rocket.ship.width : 0, 0)
    header.drawPixi(this.graphics)

    const tX = header.rect.x + header.rect.w / 2 // - (text.rect.w / 2)

    if (this.startingSoon) {
      text.text = this.__('crash.startingSoon')
    } else {
      text.text = this.__('crash.startingIn', { elapsed: seconds.toFixed(2) })
    }

    // text.position(tX, (header.rect.y + header.rect.h + 8))
    // text.drawPixi(this.graphics)
  }

  override tick() {
    const now = Date.now()
    const elapsed = this.startingTime - now

    if (elapsed > 0) {
      if (elapsed <= 900 && !this.rocketLeaveAnimation && this.rocket) {
        this.rocketLeaveAnimation = anime({
          targets: this.rocket,
          alpha: 0,
          easing: 'easeInBack',
          y: -this.rocket.height + 100,
          duration: elapsed,
        })
      }
      this.seconds = elapsed / 1000
      this.drawText()
    } else if (!this.startingSoon) {
      this.startingSoon = true
      this.drawText()
    }

    this.rocket?.tick(this.app.ticker.elapsedMS)
  }

  override onResize(width, height) {
    this.drawText()

    this.text.x = this.header.rect.x + this.header.rect.w / 2
    this.text.y = this.header.rect.y + this.header.rect.h + 4

    const bounds = this.graphics.getBounds()
    this.container.x = width / 2 - (this.header.rect.x + this.header.rect.w / 2)
    this.container.y = height / 2 - bounds.height / 2
  }

  override onDestroy() {
    this.tl?.kill()
    this.rocketLeaveAnimation?.pause()

    const { header } = this

    for (let i = 0; i < header.drawing.length; i++) {
      gsap.killTweensOf(header.drawing[i])
    }
  }
}
