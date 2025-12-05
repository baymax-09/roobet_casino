import React from 'react'
import numeral from 'numeral'

import style from './style.scss'

export class CrashGraph extends React.PureComponent {
  static plotOffsetX = 50
  static plotOffsetY = 50

  constructor(props) {
    super(props)

    this._engine = props.engine
    this._rendering = true

    this.__onAnimationFrame = this._onAnimationFrame.bind(this)
    this.__onResize = this._onResize.bind(this)
  }

  override componentDidMount() {
    const { canvas, container } = this.refs

    if (!canvas.getContext) {
      throw new Error('Cannot get canvas context')
    }

    this._ctx = canvas.getContext('2d')

    this._onResize()

    window.addEventListener('resize', this.__onResize)
    window.requestAnimationFrame(this.__onAnimationFrame)
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 200)
  }

  override componentWillUnmount() {
    this._rendering = false
    window.removeEventListener('resize', this.__onResize)
  }

  override componentDidUpdate(prevProps) {
    if (this.props.manualBetting !== prevProps.manualBetting) {
      this._onResize()
    }
  }

  override render() {
    return (
      <div ref="container" className={style.crashGraph}>
        <canvas ref="canvas" />
      </div>
    )
  }

  _onAnimationFrame() {
    if (!this._rendering) {
      return
    }

    window.requestAnimationFrame(this.__onAnimationFrame)

    // Update

    this._engine.update()
    this._ctx.clearRect(0, 0, this._engine.graphWidth, this._engine.graphHeight)

    // this._ctx.lineJoin = this._ctx.lineCap = 'round'

    // if (this._engine.state !== 'Over') {
    this._renderAxis()
    // }

    // if(this._engine.state === 'Running') {
    if (this._engine.state !== 'TakingBets') {
      const { userBet, activeBet } = this._engine

      if (!!userBet && userBet.cashedOut) {
        this._renderPlotLine(
          Math.max(0, userBet.cashoutElapsed),
          this._engine.elapsedTime,
          'rgba(177, 179, 210, 0.4)',
        )
        const { lastX } = this._renderPlotLine(
          0,
          userBet.cashoutElapsed,
          '#a9e466',
        )

        // const { lastX } = this._engine.getElapsedPlotPosition(userBet.cashoutElapsed)

        if (lastX > 0) {
          this._ctx.beginPath()
          this._ctx.moveTo(50, 0)
          this._ctx.lineTo(lastX, 0)
          this._ctx.lineTo(lastX, this._engine.plotHeight)
          this._ctx.lineTo(50, this._engine.plotHeight)
          this._ctx.closePath()
          this._ctx.fillStyle = 'rgba(169, 228, 102, 0.05)'
          this._ctx.fill()

          this._ctx.lineWidth = 2
          this._ctx.setLineDash([3, 3])
          this._ctx.strokeStyle = '#a9e466'
          this._ctx.beginPath()
          this._ctx.moveTo(lastX, 0)
          this._ctx.lineTo(lastX, this._engine.plotHeight)
          this._ctx.stroke()
          this._ctx.setLineDash([])

          this._ctx.font = `700 ${this._fontSizePx(5, 16)} Roboto,sans-serif`
          this._ctx.fillStyle = '#a9e466'

          const text = '+' + numeral(userBet.payoutValue).format('$0,0.00')
          const textWidth = this._ctx.measureText(text).width
          let x = lastX - 10

          if (x - textWidth < 60) {
            this._ctx.textAlign = 'left'
            x = lastX + 10
          } else {
            this._ctx.textAlign = 'right'
          }

          this._ctx.fillText(text, x, 20)

          this._ctx.font = `700 ${this._fontSizePx(5, 13)} Roboto,sans-serif`
          this._ctx.fillStyle = 'rgba(169, 228, 102, 0.70)'
          this._ctx.fillText(`${userBet.cashoutCrashPoint.toFixed(2)}x`, x, 36)
        }
      } else {
        // eslint-disable-next-line no-extra-boolean-cast
        const color = !!userBet
          ? this._engine.state === 'Over'
            ? '#f44336'
            : '#a9e466'
          : '#b1b3d2'
        this._renderPlotLine(0, this._engine.elapsedTime, color)
      }
    }

    // this._renderPlotLine(
    //   Math.max(0, this._engine.elapsedTime - this._engine.elapsedGap),
    //   this._engine.elapsedTime + this._engine.elapsedGap, 'rgba(0, 0, 0, 0.1)'
    // )
    // this._renderPlotLine(0, this._engine.elapsedTime, '#b1b3d2')
    // this._renderAxis()
    // this._renderPlayer()
    // }

    this._renderData()
  }

  _renderAxis() {
    const { _ctx } = this

    _ctx.font = '700 12px Roboto,sans-serif'
    _ctx.strokeStyle = '#616161'
    _ctx.textBaseline = 'middle'
    _ctx.fillStyle = '#b1b3d2'
    _ctx.textAlign = 'right'

    _ctx.beginPath()

    const currentMultiplier = this._engine.currentMultiplier
    const payoutSeparation = this._stepValues(
      !currentMultiplier ? 1 : currentMultiplier,
    )
    const heightIncrement = this._engine.plotHeight / this._engine.yAxis

    for (
      let payout = payoutSeparation, i = 0;
      payout < this._engine.yAxis;
      payout += payoutSeparation, i++
    ) {
      const y = this._engine.plotHeight - payout * heightIncrement

      _ctx.fillText((payout + 1).toFixed(2) + 'x', 40, y)
      _ctx.rect(50, y - 1, 10, 2)

      if (i > 100) {
        break
      }
    }

    // Calculate X Axis
    const milisecondsSeparation = this._stepValues(this._engine.xAxis)
    const xAxisValuesSeparation =
      this._engine.plotWidth / (this._engine.xAxis / milisecondsSeparation)

    // Draw X Axis Values
    for (
      let miliseconds = 0, counter = 0, i = 0;
      miliseconds < this._engine.xAxis;
      miliseconds += milisecondsSeparation, counter++, i++
    ) {
      const seconds = miliseconds / 1000
      const textWidth = this._ctx.measureText(seconds).width
      const x =
        counter * xAxisValuesSeparation +
        this._engine.plotOffsetX -
        textWidth / 2

      _ctx.textAlign = i === 0 ? 'left' : 'center'
      _ctx.fillText(seconds + 's', x, this._engine.plotHeight + 18)

      if (i !== 0) {
        _ctx.rect(x - 1, this._engine.plotHeight - 10, 2, 10)
      }

      if (i > 100) {
        break
      }
    }

    _ctx.fill()

    // yellow lines
    this._ctx.lineWidth = 5
    // this._ctx.setLineDash([5, 5])
    this._ctx.strokeStyle = '#b1b3d2'

    this._ctx.beginPath()
    this._ctx.moveTo(this._engine.plotOffsetX, 0)
    this._ctx.lineTo(this._engine.plotOffsetX, this._engine.plotHeight)
    this._ctx.lineTo(
      this._engine.plotWidth + this._engine.plotOffsetX,
      this._engine.plotHeight,
    )
    this._ctx.stroke()
  }

  _renderData() {
    const { _ctx, _engine } = this
    const y = _engine.graphHeight / 2

    _ctx.textAlign = 'center'
    _ctx.textBaseline = 'middle'
    _ctx.fillStyle = '#d9dbfd'

    if (_engine.state === 'TakingBets') {
      const timeLeft = _engine.startTime / 1000 - Date.now() / 1000

      _ctx.font = `500 ${this._fontSizePx(8, 40)} Roboto,sans-serif`

      if (timeLeft > 0) {
        _ctx.fillText(
          `Starting round in ${Math.max(0, timeLeft).toFixed(1)}s`,
          _engine.graphWidth / 2,
          y,
        )
      } else {
        _ctx.fillText('Starting round soon...', _engine.graphWidth / 2, y)
      }
    } else if (_engine.state === 'Running' || _engine.state === 'Over') {
      const currentMultiplier =
        _engine.state !== 'Over'
          ? _engine.currentMultiplier
          : _engine.crashPoint
      const fontSize = 20

      if (_engine.state === 'Over') {
        _ctx.fillStyle = '#da736b'
      } else if (this._engine.activeBet) {
        _ctx.fillStyle = '#a9e466'
      }

      _ctx.font = `700 ${this._fontSizePx(15, 130)} Roboto,sans-serif`
      _ctx.fillText(
        currentMultiplier.toFixed(2) + 'x',
        _engine.graphWidth / 2,
        y,
      )

      if (this._engine.activeBet) {
        const payoutValue = numeral(
          currentMultiplier * this._engine.activeBet.betAmount,
        ).format('$0,0.00')
        _ctx.font = `500 ${this._fontSizePx(8, 40)} Roboto,sans-serif`
        _ctx.fillStyle = '#fff'
        _ctx.fillText(
          '\u2191 ' + payoutValue,
          this._engine.graphWidth / 2,
          y + 80,
        )
      }
    } else {
      _ctx.font = `700 ${this._fontSizePx(8, 40)} Roboto,sans-serif`
      _ctx.fillStyle = '#fff'
      _ctx.fillText('Loading', _engine.graphWidth / 2, y)
    }
  }

  _renderPlayer() {
    const { x, y } = this._engine.getElapsedPlotPosition(
      this._engine.elapsedTime - 100,
    )

    // Cursor
    this._ctx.lineWidth = 1
    this._ctx.setLineDash([2, 2])
    this._ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'

    this._ctx.beginPath()
    this._ctx.moveTo(x, 0)
    this._ctx.lineTo(x, this._engine.plotHeight)

    this._ctx.moveTo(this._engine.plotOffsetX + 3, y)
    this._ctx.lineTo(this._engine.graphWidth, y)
    this._ctx.stroke()

    this._ctx.setLineDash([])

    this._ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)'

    this._ctx.beginPath()
    this._ctx.arc(this._engine.plotOffsetX - 3, y, 3, 0, 2 * Math.PI)
    this._ctx.stroke()

    this._ctx.beginPath()
    this._ctx.arc(x, this._engine.plotHeight + 3, 3, 0, 2 * Math.PI)
    this._ctx.stroke()

    // this._ctx.beginPath()
    // this._ctx.moveTo(this._engine.plotOffsetX - 9, y - 4)
    // this._ctx.lineTo(this._engine.plotOffsetX - 9, y + 4)
    // this._ctx.lineTo(this._engine.plotOffsetX - 3, y)
    // this._ctx.lineTo(this._engine.plotOffsetX - 9, y - 4)
    // this._ctx.stroke()
    //
    // this._ctx.beginPath()
    // this._ctx.moveTo(x, this._engine.plotHeight + 5)
    // this._ctx.lineTo(x, this._engine.plotHeight + 15)
    // this._ctx.stroke()

    // Sperm
    //
    this._ctx.strokeStyle = '#ccc'
    this._ctx.lineWidth = 6
    this._ctx.fillStyle = '#fff'

    this._ctx.beginPath()
    this._ctx.arc(
      this._engine.plotOffsetX,
      this._engine.plotHeight,
      3,
      0,
      2 * Math.PI,
    )
    this._ctx.stroke()
    this._ctx.fill()

    this._ctx.beginPath()
    this._ctx.arc(x, y, 3, 0, 2 * Math.PI)
    this._ctx.stroke()
    this._ctx.fill()
  }

  _renderPlotLine(elapsedStart, elapsedEnd, color) {
    // main line
    this._ctx.strokeStyle = color
    this._ctx.fillStyle = color
    this._ctx.lineWidth = 3
    this._ctx.beginPath()

    let lastX = -1
    let lastY = -1

    for (let t = elapsedStart, i = 0; t <= elapsedEnd; t += 100, i++) {
      const { x, y } = this._engine.getElapsedPlotPosition(t)

      if (x - lastX < 3) {
        continue
      }

      if (t === elapsedStart) {
        this._ctx.moveTo(x, y)
      } else {
        this._ctx.lineTo(x, y)
        // const midPoint = this._getMidpoint({
        //   x: lastX,
        //   y: lastY
        // }, {
        //   x,
        //   y
        // });

        // this._ctx.quadraticCurveTo(lastX, lastY, midPoint.x, midPoint.y)
      }

      lastX = x
      lastY = y

      if (i > 5000) {
        break
      }
    }

    this._ctx.stroke()
    this._ctx.closePath()
    return {
      lastX,
      lastY,
    }
  }

  _onResize() {
    const { canvas, container } = this.refs
    this._engine.setGraphSize(container.clientWidth, container.clientHeight)

    canvas.width = this._engine.graphWidth
    canvas.height = this._engine.graphHeight
  }

  _getMidpoint(p1, p2) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    }
  }

  _stepValues(x) {
    console.assert(Number.isFinite(x))

    // eslint-disable-next-line id-length
    let c = 0.4
    let r = 0.1

    while (true) {
      if (x < c) {
        return r
      }

      c *= 5
      r *= 2

      if (x < c) {
        return r
      }

      c *= 2
      r *= 5
    }
  }

  _fontSizeNum = times => (times * this._engine.plotWidth) / 100

  _fontSizePx = (times, max = 0) => {
    let px = this._fontSizeNum(times)

    if (max > 0) {
      px = Math.min(px, max)
    }

    return px.toFixed(2) + 'px'
  }
}
