import anime from 'animejs'
import * as PIXI from 'pixi.js'
import * as particles from '@pixi/particle-emitter'

import rainIcon from 'assets/images/textures/rain.png'

export class ViewManager {
  constructor(app, crashEngine) {
    this.app = app
    this.crashEngine = crashEngine
    this.registeredViews = {}
    this.attachments = {}
    this.currentView = null
    this.currentViewKey = null

    this.background = PIXI.Sprite.from(PIXI.Texture.EMPTY)
    this.background.alpha = 0.05
    this.background.anchor.set(0.5)
    app.stage.addChild(this.background)

    this.createRainEmitter()
  }

  setAttachment(key, value) {
    this.attachments[key] = value
  }

  registerView(key, ViewClass) {
    this.registeredViews[key] = ViewClass
  }

  switchView(key, params = {}) {
    if (typeof this.registeredViews[key] === 'undefined') {
      throw new Error(`View "${key}" does not exist`)
    }

    const { renderer } = this.app
    const width = (this.width = renderer.width / renderer.resolution)
    const height = (this.height = renderer.height / renderer.resolution)

    if (this.currentView !== null) {
      const previousView = this.currentView
      const animation = {
        alpha: 1,
      }

      anime({
        targets: previousView,
        alpha: 0,
        easing: 'linear',
        duration: 200,
        complete() {
          previousView?.onDestroy()
          previousView?.destroy({
            children: true,
          })

          this.app?.stage?.removeChild(previousView)
        },
      })
    }

    this.currentViewKey = key

    this.crashEngine.updateRocketConfig()
    // this.background.texture = PIXI.Texture.from(this.crashEngine.currentRocketConfig.background)

    this.updateRain()

    const view = (this.currentView = new this.registeredViews[key](
      this,
      this.app,
      params,
    ))
    view.onCreate()
    this.onResize(width, height)

    this.app.stage.addChild(view)
  }

  tick() {
    if (this.currentView !== null) {
      this.currentView.tick()
    }

    if (this.rainEmitter.emit) {
      this.rainEmitter?.update(this.app.ticker.elapsedMS * 0.001)
    }
  }

  onResize(width, height) {
    if (this.currentView !== null) {
      this.currentView.onResize(width, height)
    }

    this.background?.position?.set(width / 2, height / 2)
    this.updateRain()
  }

  createRainEmitter() {
    this.rainContainer = new PIXI.Container()
    this.rainEmitter = new particles.Emitter(this.rainContainer, {
      lifetime: {
        min: 1,
        max: 1,
      },
      frequency: 0.008,
      emitterLifetime: 0,
      maxParticles: 200,
      addAtBack: false,
      pos: {
        x: 0,
        y: 0,
      },
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                {
                  time: 0,
                  value: 0,
                },
                {
                  time: 0.6,
                  value: 0.02,
                },
                {
                  time: 1,
                  value: 0,
                },
              ],
            },
          },
        },
        {
          type: 'moveSpeedStatic',
          config: {
            min: 100,
            max: 100,
          },
        },
        {
          type: 'scaleStatic',
          config: {
            min: 1,
            max: 1,
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 90,
            max: 90,
          },
        },
        {
          type: 'textureRandom',
          config: {
            textures: [rainIcon],
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: 0,
              y: -600,
              // eslint-disable-next-line id-length
              w: 800,
              // eslint-disable-next-line id-length
              h: 600,
            },
          },
        },
      ],
    })

    this.app.stage.addChild(this.rainContainer)
  }

  updateRain() {
    const { width, height, rainEmitter, rainContainer } = this
    const isInGame = this.currentViewKey === 'active'

    const spawnShape = rainEmitter.getBehavior('spawnShape')
    spawnShape.shape.x = 0
    spawnShape.shape.y = -height
    // eslint-disable-next-line id-length
    spawnShape.shape.w = width
    // eslint-disable-next-line id-length
    spawnShape.shape.h = height * 2

    const angle = isInGame ? 60 : 0
    rainEmitter.maxParticles = isInGame ? 50 : 100
    window.rainEmitter = rainEmitter
    rainEmitter.minLifetime = rainEmitter.maxLifetime = isInGame ? 0.5 : 1

    this.updateRainSpeed(isInGame ? 500 : 50)
    this.rainAnimation?.pause()

    if (angle !== rainContainer.angle) {
      this.rainAnimation = anime({
        angle,
        targets: rainContainer,
        easing: 'easeOutExpo',
        duration: 1000,
      })
    }
  }

  updateRainSpeed(speed) {
    const moveSpeedStatic = this.rainEmitter?.getBehavior('moveSpeedStatic')
    moveSpeedStatic.min = moveSpeedStatic.max = speed
  }
}
