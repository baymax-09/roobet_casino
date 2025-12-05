import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import * as TimSort from 'timsort'
import i18n, { type TFunction } from 'i18next'

import { PlayerBet, PlayerBetHeight } from './PlayerBet'

const TextHeight = 30

export class PlayerBets extends PIXI.Container {
  app: PIXI.Application
  orbRotation: number
  isMobile: boolean
  translate: TFunction
  background: PIXI.Graphics
  players: Record<string, PlayerBet>
  playersContainer: PIXI.Container
  playersText: PIXI.Text
  playerAmounts: Record<string, number>
  textBackground: PIXI.Graphics
  amountText: PIXI.Text
  emptyText: PIXI.Text
  viewport: Viewport
  formatCurrency: any

  constructor(app, isMobile = false, formatCurrency) {
    super()

    this.app = app
    this.orbRotation = 0
    this.isMobile = isMobile
    this.translate = i18n.t
    this.formatCurrency = formatCurrency

    this.players = {}
    this.playerAmounts = {}

    this.background = new PIXI.Graphics()
    this.playersContainer = new PIXI.Container()

    const emptyText = (this.emptyText = new PIXI.Text(
      this.translate('playerBets.noBetsText'),
      {
        fontFamily: 'Roboto',
        fontSize: 13,
        fontWeight: '400',
        fill: 0xffffff,
      },
    ))

    emptyText.alpha = 0.5
    emptyText.anchor.set(0.5, 0.5)
    emptyText.y = PlayerBetHeight + PlayerBetHeight / 2

    const textContainer = new PIXI.Container()
    this.textBackground = new PIXI.Graphics()

    const playersText = (this.playersText = new PIXI.Text('0 Players', {
      fontFamily: 'Roboto',
      fontSize: 12,
      fontWeight: '500',
      fill: 0xffffff,
    }))

    playersText.anchor.set(0, 0.5)
    playersText.y = TextHeight / 2
    playersText.x = 8
    playersText.alpha = 0.5

    const amountText = (this.amountText = new PIXI.Text('$0.00', {
      fontFamily: 'Roboto',
      fontSize: 12,
      fontWeight: '500',
      fill: 0xffffff,
    }))

    amountText.anchor.set(1, 0.5)
    amountText.y = TextHeight / 2
    amountText.alpha = 0.5

    this.viewport = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: app.screen.width,
      worldHeight: app.screen.height,
      interaction: app.renderer.plugins.interaction,
      disableOnContextMenu: true,
      divWheel: app._resizeTo,
      passiveWheel: false,
    })

    this.viewport
      .drag({
        // reverse: true,
        clampWheel: true,
      })
      .clamp({ direction: 'x' })
      .bounce({
        friction: 0.3,
        time: 400,
      })
      .decelerate()

    this.resetTextStyles()
    this.updateTexts()

    this.viewport.addChild(this.background, emptyText, this.playersContainer)
    textContainer.addChild(this.textBackground, playersText, amountText)
    this.addChild(this.viewport, textContainer)
  }

  resetTextStyles() {
    this.textStyles = {
      nameText: new PIXI.TextStyle({
        fontFamily: 'Roboto',
        fontSize: 13,
        fontWeight: '500',
        fill: 0xffffff,
        padding: 5,
        wordWrap: true,
        wordWrapWidth: this.getMaxNameWidth(),
        breakWords: true,
      }),

      amountText: {
        normal: new PIXI.TextStyle({
          fontFamily: 'Roboto',
          fontSize: 13,
          fontWeight: 500,
          fill: 0xffffff,
        }),

        won: new PIXI.TextStyle({
          fontFamily: 'Roboto',
          fontSize: 13,
          fontWeight: 500,
          fill: 0xabda74,
        }),
      },
    }
  }

  showLosses() {
    this.textStyles.amountText.normal.fill = 0xf44336

    const players = this.playersContainer.children

    for (const player of players) {
      if (!player.bet.cashoutCrashPoint) {
        player.showLoss()
      }
    }
  }

  tick(delta) {
    if (this.viewport.dirty) {
      this.cull()
      this.viewport.dirty = false
    }

    if (!this.isMobile) {
      const players = this.playersContainer.children

      for (let i = this.startIndex; i < this.endIndex; i++) {
        if (!players[i]) {
          continue
        }

        if (players[i].state !== 'undetermined') {
          players[i].orb.rotation = this.orbRotation
        }
      }

      this.orbRotation += 0.02 * delta
    }
  }

  cull() {
    const { top, screenHeight } = this.viewport

    this.maxVisible = Math.ceil(screenHeight / 30)
    this.startIndex = Math.max(Math.floor(top / 30), 0)
    this.endIndex = Math.min(
      Math.ceil(this.startIndex + this.maxVisible) + 1,
      this.playersContainer.children.length - 1,
    )

    const players = this.playersContainer.children

    for (let i = 0; i < players.length; i++) {
      const isVisible = this.isPlayerIndexVisible(i)
      players[i].y = PlayerBetHeight * i + PlayerBetHeight

      if (players[i].visible !== isVisible) {
        if (isVisible) {
          players[i].enter()
        } else {
          players[i].exit()
        }
      }
    }
  }

  isPlayerIndexVisible(i) {
    return i >= this.startIndex && i <= this.endIndex
  }

  addPlayer(id, bet, update = true, display = true) {
    if (bet.betAmount) {
      this.playerAmounts[id] = bet.betAmount
    }

    // if (!display) {
    //   return
    // }

    if (this.players[id]) {
      this.players[id].updateBet(bet)
      this.sortPlayers()
      this.cull()
      this.updateTexts()
      return
    }

    // bet.user = null
    const { app } = this
    const originalName = bet.incognito
      ? `(${this.translate('generic.hiddenName')})`
      : bet.user.name
    const newPlayerBet = new PlayerBet(
      this,
      bet,
      this.getTruncatedName(originalName),
      this.textStyles,
      this.formatCurrency,
    )

    newPlayerBet.visible = false
    newPlayerBet.onResize(app.screen.width, app.screen.height)

    this.players[id] = newPlayerBet
    this.playersContainer.addChild(newPlayerBet)

    if (this.emptyText.visible) {
      this.emptyText.visible = false
    }

    // newPlayerBet.visible = true

    if (update) {
      this.updatePlayers()
    }

    this.updateTexts()
  }

  updatePlayers() {
    this.sortPlayers()
    this.resizeViewport()
    this.cull()
    this.updateBackground()
  }

  updateTexts() {
    const playerIds = Object.keys(this.playerAmounts)
    const players = playerIds.length
    const amount = playerIds.reduce(
      (sum, playerId) => sum + this.playerAmounts[playerId],
      0,
    )

    this.playersText.text =
      players > 0
        ? `${players} ${
            players === 1
              ? this.translate('playerBets.player')
              : this.translate('playerBets.players')
          }`
        : this.translate('playerBets.noPlayers')
    this.amountText.text = this.formatCurrency(
      amount.toFixed(2),
      amount < 1 ? '0,0.00[0]' : '0,0.00',
    )
  }

  reset() {
    this.emptyText.visible = true
    this.viewport.moveCorner(0, 0)

    const players = this.playersContainer.children

    for (const player of players) {
      player.onDestroy()
    }

    this.resetTextStyles()
    this.players = {}
    this.playerAmounts = {}
    this.playersContainer.removeChildren(0, players.length)
    this.updatePlayers()
    this.updateBackground()
    this.updateTexts()
  }

  sortPlayers() {
    if (this.playersContainer.children.length <= 1) {
      return
    }

    try {
      TimSort.sort(this.playersContainer.children, (a, b) => {
        const aValue = a.bet.payoutValue || a.bet.betAmount
        const bValue = b.bet.payoutValue || b.bet.betAmount

        return bValue - aValue
      })
    } catch (err) {}
  }

  getMaxNameWidth() {
    return ~~(this.app.screen.width * 0.5)
  }

  getTruncatedName(originalName) {
    const metrics = PIXI.TextMetrics.measureText(
      originalName,
      this.textStyles.nameText,
    )
    let name = metrics.lines[0]

    if (metrics.lines.length > 1) {
      name = `${name.substring(0, name.length - 3)}...`
    }

    return name
  }

  updateBackground() {
    this.background.clear()
    this.background.beginFill(0xffffff, 0.03)

    for (let i = 0; i < this.playersContainer.children.length; i += 2) {
      this.background.drawRect(
        0,
        PlayerBetHeight * i,
        this.app.screen.width,
        PlayerBetHeight,
      )
    }

    this.background.endFill()
  }

  onResize(width, height) {
    this.emptyText.x = width / 2
    this.amountText.x = width - 8

    this.textBackground.cacheAsBitmap = false
    this.textBackground.clear()
    this.textBackground.beginFill(0x0d0e20)
    this.textBackground.drawRect(0, 0, width, TextHeight)
    this.textBackground.endFill()
    this.textBackground.cacheAsBitmap = true

    const maxNameWidth = this.getMaxNameWidth()
    const updatePlayerNames =
      maxNameWidth !== this.textStyles.nameText.wordWrapWidth

    if (updatePlayerNames) {
      this.textStyles.nameText.wordWrapWidth = maxNameWidth
    }

    for (const key in this.players) {
      const player = this.players[key]

      if (updatePlayerNames) {
        player.nameText.cacheAsBitmap = false
        player.nameText.text = this.getTruncatedName(player.initialName)
        player.nameText.cacheAsBitmap = true
      }

      player.onResize(width, height)
    }

    this.resizeViewport()
    this.cull()
    this.updateBackground()
  }

  getPlayerBetsHeight() {
    return (
      PlayerBetHeight * this.playersContainer.children.length + PlayerBetHeight
    )
  }

  resizeViewport() {
    const { app } = this
    const worldHeight = Math.max(app.screen.height, this.getPlayerBetsHeight())

    this.viewport.resize(
      app.screen.width,
      app.screen.height,
      app.screen.width,
      worldHeight,
    )
  }
}
