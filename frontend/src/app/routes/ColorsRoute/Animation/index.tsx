import React from 'react'

import { playSound } from 'app/lib/sound'

import style from './style.scss'

export default class Roulette extends React.PureComponent {
  constructor(props) {
    super(props)
    this.tileInfo = this.tileInfo.bind(this)
    this.tile = this.tile.bind(this)
    this.start = this.start.bind(this)
    this.update = this.update.bind(this)
    this.moveRouletteToStart = this.moveRouletteToStart.bind(this)
    this.rouletteEnd = this.rouletteEnd.bind(this)
    this.snapEnd = this.snapEnd.bind(this)
    this.resize = this.resize.bind(this)
    this.scheduleResize = this.scheduleResize.bind(this)
    this.recalcOffsetIntoTile = this.recalcOffsetIntoTile.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.tileContainer = React.createRef()
    this.rouletteContainer = React.createRef()
    this.ticker = React.createRef()
    this.winningTile = props.winner
    this.lastBetSelection = props.engine.lastBetSelection
    this.winningNumber = props.engine.winningNumber

    this.currentColor = 'black'
    this.tilesSinceGreen = 0
    this.tilesBetweenGreen = 14
    this.desiredTiles = 104
    this.offsetWidth = 0
    this.tileWidth = null
    this.loops = 3
    this.winningTile = 'red'
    this.winningTileIndex = 0
    this.randomOffsetIntoWinningTile = 0
    this.randomOffsetIntoTileSeed = 0
    this.running = false
    this.queuedResize = false
    this.currentCollisionTile = null
    this.tileNumbers = [1, 14, 2, 13, 3, 12, 4, 11, 5, 10, 6, 9, 7, 8, 0]
    this.redNumbers = [1, 2, 3, 4, 5, 6, 7]
    this.redIndex = 0
    this.blackNumbers = [14, 13, 12, 11, 10, 9, 8]
    this.blackIndex = 0
    this.winningPosition = null
    this.snapPosition = null
    this.animationEnded = false
    this.timerId = null
    this.hiddenProperty = null
    this.catchUp = false

    // cache previous winner
    this.previousWinner = null
    this.previousOffset = null

    this.state = {
      color: this.props.initialColor,
      tiles: Array.from({ length: this.desiredTiles }, (_, i) => {
        return this.tile(i)
      }),
    }
  }

  override componentDidMount() {
    // Set the name of the hidden property and the change event for visibility
    let visibilityChange
    if (typeof document.hidden !== 'undefined') {
      // Opera 12.10 and Firefox 18 and later support
      this.hiddenProperty = 'hidden'
      visibilityChange = 'visibilitychange'
    } else if (typeof document.msHidden !== 'undefined') {
      this.hiddenProperty = 'msHidden'
      visibilityChange = 'msvisibilitychange'
    } else if (typeof document.webkitHidden !== 'undefined') {
      this.hiddenProperty = 'webkitHidden'
      visibilityChange = 'webkitvisibilitychange'
    }
    document.addEventListener(
      visibilityChange,
      this.handleVisibilityChange,
      false,
    )
  }

  override componentWillUnmount() {
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }
  }

  handleVisibilityChange() {
    // animation events dont fire in the background
    // so start a timer that checks if we should end the animation manually based on elapsed time
    // clear interval if user returns to tab while animation running play out normally
    // clearInterval(this.timerId)
    if (document[this.hiddenProperty]) {
      // when user goes off tab remove animation
      if (this.running) {
        // stop the animation at current position
        if (this.tileContainer.current) {
          this.tileContainer.current.removeEventListener(
            'transitionend',
            this.rouletteEnd,
          )
          this.tileContainer.current.removeEventListener(
            'transitionend',
            this.snapEnd,
          )

          var style =
            'transform: translate3d(' +
            this.tileContainer.current.getBoundingClientRect().x +
            'px, 0, 0);'
          this.tileContainer.current.setAttribute('style', style)

          var timeleft = this.animationPredictedEnd + 1100 - Date.now()

          if (timeleft >= 0) {
            this.timerId = setTimeout(() => {
              this.completeStop()
            }, timeleft)
          } else {
            this.completeStop()
          }
        }
      }
      // this.completeStop()
      // this.timerId = setInterval(() => {
      //   if(!document[this.hiddenProperty]){
      //     clearInterval(this.timerId)
      //     return
      //   }
      //   if(this.running && (Date.now() >= (this.animationPredictedEnd + 1400))) {
      //     this.completeStop()
      //   }
      // }, 1000)
    } else {
      clearTimeout(this.timerId)
      if (this.running) {
        // ?? before resuming stop any animations that may have started off tab ??
        // not necessary because we're checking for tab visibility in update function,
        // animations aren't started when tab not visible
        this.catchUp = true
        this.update()
      }
      this.timerId = null
    }
  }

  tile(i) {
    const tileObj = this.tileInfo(i)
    if (i === this.desiredTiles - 1 && tileObj.color === 'red') {
      return [
        <div key={i.toString()} className="game-tile red"></div>,
        <div key={this.desiredTiles + 1} className="game-tile black"></div>,
      ]
    }
    return (
      <div key={i.toString()} className={`game-tile ${tileObj.color}`}>
        <span>{tileObj.number}</span>
      </div>
    )
  }

  tileInfo(index) {
    const trueIndex = index + 1
    const tileObj = { color: null, number: null }

    if (this.redIndex === this.redNumbers.length) {
      this.redIndex = 0
    }

    if (this.blackIndex === this.blackNumbers.length) {
      this.blackIndex = 0
    }

    if (this.tilesSinceGreen === this.tilesBetweenGreen) {
      this.tilesSinceGreen = 0
      tileObj.color = 'green'
      tileObj.number = 0
      return tileObj
    }
    if (this.currentColor === 'red') {
      this.currentColor = 'black'
      tileObj.color = 'black'
      tileObj.number = this.blackNumbers[this.blackIndex++]
    } else {
      this.currentColor = 'red'
      tileObj.color = 'red'
      tileObj.number = this.redNumbers[this.redIndex++]
    }
    this.tilesSinceGreen++
    return tileObj
  }

  recalcOffsetIntoTile(previousOffset = false) {
    let offset
    if (previousOffset) {
      offset = previousOffset
    } else {
      offset = this.props.offsetSeed
    }
    this.randomOffsetIntoWinningTile = (this.tileWidth / 10) * offset
    this.randomOffsetIntoWinningTile += this.tileWidth / 10 / 2
  }

  rouletteEnd() {
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }

    playSound('roulette', 'end')
    if (
      this.props.engine.lastBetSelection &&
      this.props.engine.winningNumber === this.props.engine.lastBetSelection
    ) {
      if (this.props.engine.winningNumber === 3) {
        // Special sound for biggest win
        playSound('roulette', 'win_long')
      } else {
        playSound('roulette', 'win')
      }
    }
    this.snapTileToWinning()
  }

  snapEnd() {
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.snapEnd,
      )
    }
    this.animationEnded = true
    this.moveRouletteToStart()
  }

  snapTileToWinning() {
    if (this.tileContainer.current) {
      this.tileContainer.current.addEventListener('transitionend', this.snapEnd)
    }
    this.snapPosition = this.winningPosition - this.tileWidth / 2
    const translate =
      'transition: all 1s ease-in 0s; transform: translate3d(' +
      this.snapPosition +
      'px, 0, 0);'
    this.tileContainer.current.setAttribute('style', translate)
  }

  moveRouletteToStart(previousWinner = false, previousOffset = false) {
    // remove transition function from dom
    this.tileContainer.current.setAttribute(
      'style',
      'transform: translate3d(' + this.snapPosition + 'px, 0, 0)',
    )
    // always get current tileWidth
    var gameTile = document.querySelector('.game-tile')
    this.tileWidth = gameTile ? gameTile.offsetWidth : null
    this.recalcOffsetIntoTile(previousOffset)
    let winner
    if (previousWinner) {
      winner = previousWinner
    } else {
      winner = this.props.winner
    }

    // add in the preloop width, as well as 1 extra tile for the green
    var seamlessStartWidth = this.tileNumbers.length * this.tileWidth
    seamlessStartWidth +=
      this.tileNumbers.indexOf(parseInt(winner)) * this.tileWidth +
      this.tileWidth / 2
    seamlessStartWidth -= Math.floor(
      document.querySelector('.tiles-wrapper').offsetWidth / 2,
    )

    this.offsetWidth = seamlessStartWidth * -1
    const translate =
      'transform: translate3d(' + this.offsetWidth + 'px, 0, 0);'
    if (this.props.instant) {
      this.tileContainer.current.setAttribute('style', translate)
    } else {
      // this timeout is here for Dom performance reasons, we just want to space out the style transitions / dom changes
      // setTimeout(() => {
      this.tileContainer.current.setAttribute('style', translate)
      if (this.queuedResize) {
        this.queuedResize = false
        if (this.running) {
          this.running = false
          this.catchUp = false
        }
      }
      this.running = false
      this.catchUp = false
      // }, 100)
    }
  }

  update() {
    if (!this.tileContainer.current) {
      return
    }

    var beziers = [
      'cubic-bezier(0.250, 0.100, 0.250, 1.000)',
      'cubic-bezier(0.12, 0.8, 0.38, 1)',
      'cubic-bezier(0, .37, .54, 1)',
      'cubic-bezier(0, .37, .67, 1)',
    ]
    if (!document.querySelector('.tiles-wrapper')) {
      return
    }
    this.offsetWidth = Math.floor(
      document.querySelector('.tiles-wrapper').offsetWidth / 2,
    )
    this.recalcOffsetIntoTile()
    this.offsetWidth =
      this.offsetWidth - this.tileNumbers.length * this.tileWidth
    this.offsetWidth -= this.tileNumbers.length * this.loops * this.tileWidth

    this.offsetWidth -=
      this.tileNumbers.indexOf(parseInt(this.props.winner)) * this.tileWidth
    // for use during the snap
    this.winningPosition = this.offsetWidth
    this.offsetWidth -= this.randomOffsetIntoWinningTile
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }
    // if the tab is currently hidden don't add listener or start css animation
    if (!document[this.hiddenProperty] && this.tileContainer.current) {
      this.tileContainer.current.addEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }
    const translate =
      'transition-timing-function: ' +
      beziers[Math.floor(Math.random() * (beziers.length - 1)) + 1] +
      '; transform: translate3d(' +
      this.offsetWidth +
      'px, 0, 0);'
    let duration = parseInt(this.props.duration)

    if (this.catchUp) {
      // voiding the offsetwidth property triggers dom reflow
      void this.tileContainer.current.offsetWidth
      this.tileContainer.current.setAttribute('style', '')
      const now = Date.now()
      if (this.animationPredictedEnd > now) {
        duration = this.animationPredictedEnd - now
      } else {
        this.completeStop()
        return
      }
    }
    const transitionduration = 'transition-duration: ' + duration + 'ms;'
    if (this.catchUp) {
      this.tileContainer.current.setAttribute(
        'style',
        translate + transitionduration,
      )
      // setTimeout(() => {this.tileContainer.current.setAttribute('style', translate + transitionduration)}, 100)
    } else {
      // only start css transition when tab is visible otherwise start a timeout to end after duration
      if (!document[this.hiddenProperty]) {
        this.tileContainer.current.setAttribute(
          'style',
          translate + transitionduration,
        )
      } else {
        this.timerId = setTimeout(() => {
          this.completeStop()
        }, duration + 1000)
      }
    }
    this.running = true
    this.animationStart = Date.now()
    this.animationPredictedEnd = this.animationStart + parseInt(duration)
  }

  start() {
    var gameTile = document.querySelector('.game-tile')
    this.tileWidth = gameTile ? gameTile.offsetWidth : null
    this.animationEnded = false
    if (this.previousWinner && this.previousOffset) {
      this.moveRouletteToStart(this.previousWinner, this.previousOffset)
    }
    if (this.props.instant) {
      return
    }
    const startTime = 0
    this.previousWinner = this.props.winner
    this.previousOffset = this.props.offsetSeed
    this.update()
    playSound('roulette', 'start')
  }

  completeStop() {
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.snapEnd,
      )
    }

    playSound('roulette', 'end')
    if (
      this.props.engine.lastBetSelection &&
      this.props.engine.winningNumber === this.props.engine.lastBetSelection
    ) {
      if (this.props.engine.winningNumber === 3) {
        // Special sound for biggest win
        playSound('roulette', 'win_long')
      } else {
        playSound('roulette', 'win')
      }
    }

    this.moveRouletteToStart()
  }

  scheduleResize() {
    if (this.running) {
      this.queuedResize = true
    }
    this.resize()
  }

  resize() {
    if (this.winningTileIndex > 0) {
      this.moveRouletteToStart()
    }
    if (this.tileContainer.current) {
      this.tileContainer.current.removeEventListener(
        'transitionend',
        this.rouletteEnd,
      )
    }
    this.queuedResize = false
  }

  handleClick() {
    this.start()
  }

  override render() {
    return (
      <div className={style.Animation}>
        <div className="roulette-container" ref={this.rouletteContainer}>
          <div className="tiles-wrapper">
            <div className="ticker " data-name="ticker"></div>
            <div className="tiles-container" ref={this.tileContainer}>
              {this.state.tiles}
            </div>
          </div>
        </div>
      </div>
    )
  }
}
