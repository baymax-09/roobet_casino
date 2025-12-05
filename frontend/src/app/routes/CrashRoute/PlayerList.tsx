import React from 'react'
import * as PIXI from 'pixi.js'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { useDialogsOpener } from 'app/hooks'

import { PlayerBets } from './objects'

import { usePlayerListStyles } from './PlayerList.styles'

const PlayerListView = ({
  playerBetsRef,
  playerBetsAppRef,
  formatCurrency,
}) => {
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const openDialog = useDialogsOpener()

  const containerRef = React.useRef()
  const canvasRef = React.useRef()
  const classes = usePlayerListStyles()

  React.useEffect(() => {
    const { clientWidth, clientHeight } = containerRef.current
    let app = null

    const loadTimeout = setTimeout(() => {
      app = playerBetsAppRef.current = new PIXI.Application({
        width: clientWidth,
        height: clientHeight,
        view: canvasRef.current,
        resizeTo: containerRef.current,
        transparent: true,
        antialias: true,
        sharedLoader: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      updatePlayerBets(app)
    }, 100)

    return () => {
      clearTimeout(loadTimeout)
      playerBetsRef.current = null

      if (app) {
        app.stop()
        app.destroy(true)
      }
    }
  }, [])

  const updatePlayerBets = (app: PIXI.Application) => {
    const playerBets: PlayerBets = (playerBetsRef.current =
      playerBetsRef.current ??
      new PlayerBets(app, !isTabletOrDesktop, formatCurrency))
    const checkChild = (app, child) => {
      try {
        return app.stage.getChildIndex(child)
      } catch {
        return -1
      }
    }
    if (checkChild(app, playerBets) === -1) {
      app.stage.addChild(playerBets)
      app.ticker.add(delta => {
        playerBets.tick(delta)
      })
    } else {
      for (const playerKey of Object.keys(playerBets.players)) {
        const player = playerBets.players[playerKey]
        player.updateCurrencyFormat(formatCurrency)
        if (player.bet.cashoutCrashPoint) {
          player.updateLayoutWithCrashPoint(true, false)
        }
      }
      playerBets.updateTexts()
    }

    playerBets.onResize(app.screen.width, app.screen.height)
  }

  React.useEffect(() => {
    if (playerBetsRef.current) {
      updatePlayerBets(playerBetsAppRef.current)
      playerBetsRef.current.isMobile = !isTabletOrDesktop
      playerBetsRef.current.formatCurrency = formatCurrency
    }
  }, [isTabletOrDesktop, formatCurrency])

  return (
    <div ref={containerRef} className={classes.root}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export const PlayerList = React.memo(PlayerListView)
