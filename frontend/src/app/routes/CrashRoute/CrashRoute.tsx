import React from 'react'
import * as PIXI from 'pixi.js'
import { useImmer } from 'use-immer'
import {
  Tabs,
  Tab,
  useMediaQuery,
  Tooltip,
  CircularProgress,
  Skeleton,
} from '@mui/material'
import { Helmet } from 'react-helmet'
import { useSelector } from 'react-redux'
import * as TimSort from 'timsort'
import ResizeObserver from 'resize-observer-polyfill'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type SxThemedPropsRecord, theme as uiTheme } from '@project-atl/ui'
import { useQuery } from '@apollo/client'

import {
  GameContainer,
  Leaderboard,
  KOTHBanner,
  RecentlyPlayed,
  GameDesc,
  normalizeGame,
} from 'app/components'
import { api, getCachedSrc } from 'common/util'
import { useTranslate, useCurrencyFormatter } from 'app/hooks'
import btc from 'assets/images/newDesignIcons/BTC.svg'
import eth from 'assets/images/newDesignIcons/ETH.svg'
import ltc from 'assets/images/newDesignIcons/LTC.svg'
import flag from 'assets/images/icons/flag.png'
import { NUM_GAMES } from 'app/constants'
import { type TPGameData, TPGameQuery } from 'app/gql'

import { BetControls } from './BetControls'
import { CrashEngine } from './CrashEngine'
import { ScreenFlash } from './ScreenFlash'
import { CrashHistory } from './CrashHistory'
import { ViewManager, LoadingView, ActiveView, StartingView } from './views'
import { CrashSocket } from './CrashSocket'
import crashRocketsConfig from './resources/crash-rockets-config.json'
import { type CashoutPoint } from './objects'
import { useGameRouteStyles } from '../GameRoute/GameRoute.styles'

import { useCrashRouteStyles } from './CrashRoute.styles'

const PlayerList = React.lazy(() =>
  import('./PlayerList').then(module => ({ default: module.PlayerList })),
)

const styles = {
  controlTabs: {
    minWidth: 'unset',
    fontWeight: theme => theme.typography.fontWeightBold,
    textTransform: 'uppercase',
    '&.Mui-disabled': {
      color: theme => theme.palette.neutral[700],
    },
  },
  subTabs: {
    minWidth: 'unset',
    textTransform: 'none',
    color: '#5b5c69',
    '&.Mui-selected': {
      color: '#7d7f90',
    },
  },
} satisfies SxThemedPropsRecord

export const CrashRoute = React.memo(() => {
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const userId = useSelector(({ user }) => (user ? user.id : null))

  const { data: gameInfo } = useQuery<TPGameData>(TPGameQuery, {
    variables: {
      type: !isTabletOrDesktop ? 'mobile' : 'desktop',
      gameIdentifier: 'housegames:crash',
    },
  })

  const game = React.useMemo(() => {
    return gameInfo?.tpGame ? normalizeGame(gameInfo.tpGame, 'game') : null
  }, [gameInfo?.tpGame])

  const [mode, setMode] = React.useState(0)
  const [subTab, setSubTab] = React.useState(0)

  const userIdRef = React.useRef(userId)
  const autoCashoutRef = React.useRef(null)
  const socketRef = React.useRef<CrashSocket | null>(null)

  if (socketRef.current === null) {
    socketRef.current = new CrashSocket()
  }

  const playerBetsRef = React.useRef()
  const crashEngineRef = React.useRef(null)
  const readyRef = React.useRef(false)
  const lastCrashUpdate = React.useRef(null)
  const viewManagerRef = React.useRef(null)

  const playerBetsAppRef = React.useRef()
  const containerRef = React.useRef()
  const canvasRef = React.useRef()
  const flashRef = React.useRef()
  const crashBetsRef = React.useRef({})
  const classes = useCrashRouteStyles()
  const gameRouteClasses = useGameRouteStyles({
    // These do not matter, we only taking specific classes
    realMode: true,
    favorited: false,
  })

  const [ready, setReady] = React.useState(false)
  const [userBet, setUserBet] = React.useState(null)
  const [crashGame, updateGame] = useImmer(null)

  const translate = useTranslate()
  const formatCurrency = useCurrencyFormatter()

  function updateCrashBet(bet, animated = true) {
    if (!crashBetsRef.current[bet.userId]) {
      crashBetsRef.current[bet.userId] = bet
    } else {
      crashBetsRef.current[bet.userId] = {
        ...crashBetsRef.current[bet.userId],
        ...bet,
      }
    }

    const isUser =
      bet.userId === 'demo' ||
      (!!userIdRef.current && userIdRef.current === bet.userId)

    if (isUser) {
      setUserBet(crashBetsRef.current[bet.userId])
    }

    const b = crashBetsRef.current[bet.userId]
    b._displayBet =
      (!!b.betAmount && !!b.balanceType && b.betAmount >= 0.5) || isUser

    if (playerBetsRef.current) {
      playerBetsRef.current.addPlayer(b.userId, b, true, b._displayBet)
    }

    if (viewManagerRef.current.currentViewKey === 'active') {
      if (!!b.cashoutCrashPoint && b._displayBet) {
        if (isUser) {
          crashEngineRef.current.betAmount = 0
          viewManagerRef.current.currentView.hideProfitText()
        }

        viewManagerRef.current.currentView.addCashout(
          b.cashoutCrashPoint,
          b,
          isUser,
          animated,
        )
      }
    }
  }

  function processGame(game) {
    if (['NotStarted', CrashEngine.States.Starting].includes(game.state)) {
      crashBetsRef.current = {}
      setUserBet(null)

      if (playerBetsRef.current) {
        playerBetsRef.current.reset()
      }
    }

    updateGame(draftState => {
      if (draftState === null) {
        return game
      }

      return {
        ...draftState,
        ...game,
      }
    })
  }

  function fetchActiveGame(initialFetch = false) {
    return api.get('crash/getActiveGame').then(({ game, bets }) => {
      if (game.state !== CrashEngine.States.Starting) {
        if (bets.length > 1) {
          try {
            TimSort.sort(
              bets,
              (a, b) => a.cashoutCrashPoint - b.cashoutCrashPoint,
            )
          } catch (err) {}
        }
      }

      processGame(game)

      for (const b of bets) {
        updateCrashBet(b, false)
      }

      if (playerBetsRef.current) {
        playerBetsRef.current.updatePlayers()
      }

      readyRef.current = true
      flashRef.current.flash()
    })
  }

  React.useEffect(() => {
    if (mode === 1 && subTab === 1 && !!playerBetsRef.current) {
      const keys = Object.keys(crashBetsRef.current)

      for (const key of keys) {
        const b = crashBetsRef.current[key]
        playerBetsRef.current.addPlayer(b.userId, b, true, b._displayBet)
      }
    }
  }, [mode, subTab])

  React.useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  React.useEffect(() => {
    if (!crashGame) {
      return
    }

    crashEngineRef.current.clearTickTimeouts()

    if (crashGame.state === CrashEngine.States.Starting) {
      crashEngineRef.current.state = CrashEngine.States.Starting

      viewManagerRef.current.switchView('starting', {
        id: crashGame.id,
        startingTime: Date.now() + crashGame.countdown.bettingEndTime,
      })
      crashEngineRef.current.cashedOut = false
    } else if (CrashEngine.RocketVisibleStates.includes(crashGame.state)) {
      if (crashGame.state === CrashEngine.States.Active) {
        crashEngineRef.current.startTime =
          Date.now() + crashGame.countdown.runningStartTime + 800
        crashEngineRef.current.lastGameTick = crashEngineRef.current.startTime
        crashEngineRef.current.state = CrashEngine.States.Active
      } else {
        flashRef.current.flash()
        crashEngineRef.current.finalMultiplier = crashGame.crashPoint
        crashEngineRef.current.finalElapsed = CrashEngine.getMultiplierElapsed(
          crashGame.crashPoint,
        )
        crashEngineRef.current.state = CrashEngine.States.Over

        if (playerBetsRef.current) {
          playerBetsRef.current.showLosses()
        }
      }

      if (
        viewManagerRef.current.currentViewKey !== 'active' ||
        viewManagerRef.current.currentView.params.id !== crashGame.id
      ) {
        viewManagerRef.current.switchView('active', {
          id: crashGame.id,
          demoMode: !!crashBetsRef.current.demo,
          formatCurrency,
        })
      }

      if (
        !!userId &&
        !!crashBetsRef.current[userId] &&
        !crashBetsRef.current[userId].cashoutCrashPoint
      ) {
        crashEngineRef.current.betAmount =
          crashBetsRef.current[userId].betAmount
      } else {
        crashEngineRef.current.betAmount = 0
      }

      viewManagerRef.current.currentView.autoCashoutMultiplier =
        autoCashoutRef.current

      if (crashEngineRef.current.state === CrashEngine.States.Over) {
        viewManagerRef.current.currentView.crash()
      }
    } else if (crashGame.state !== 'NotStarted') {
      viewManagerRef.current.switchView('loading')
    }
  }, [userId, crashGame ? crashGame.state : CrashEngine.States.Loading])

  React.useEffect(() => {
    const socket = socketRef.current

    if (!socket) {
      return
    }

    const onReady = () => {
      fetchActiveGame(true)
    }

    const onTick = ([elapsed]) => {
      const { current: crashEngine } = crashEngineRef

      if (!readyRef.current) {
        return
      }
      crashEngine.state = CrashEngine.States.Active
      crashEngine.onGameTick(elapsed)
    }

    const onReconnect = () => {
      if (socketRef.current.outdated) {
        return
      }

      viewManagerRef.current.switchView('loading')
      fetchActiveGame()
    }

    const onDisconnect = () => {
      crashEngineRef.current.clearTickTimeouts()

      readyRef.current = false
      updateGame(() => null)

      viewManagerRef.current.switchView('loading', {
        disconnected: true,
      })
    }

    const onCrashGameUpdate = update => {
      if (!readyRef.current) {
        lastCrashUpdate.current = update
        return
      }

      if (update.state === 'Over') {
        crashEngineRef.current.finalMultiplier = update.crashPoint
        crashEngineRef.current.crashPoint = update.crashPoint
      }

      processGame(update)
    }

    const onCrashBet = crashBet => {
      if (!readyRef.current) {
        return
      }

      updateCrashBet(crashBet)
    }

    socket.on('ready', onReady)
    socket.on('tick', onTick)
    socket.on('reconnect', onReconnect)
    socket.on('disconnect', onDisconnect)
    socket.on('crashGameUpdate', onCrashGameUpdate)
    socket.on('crashBet', onCrashBet)

    return () => {
      socket.off('ready', onReady)
      socket.off('tick', onTick)
      socket.off('reconnect', onReconnect)
      socket.off('disconnect', onDisconnect)
      socket.off('crashGameUpdate', onCrashGameUpdate)
      socket.off('crashBet', onCrashBet)
      socket.disconnect()
    }
  }, [])

  React.useEffect(() => {
    const { clientWidth, clientHeight } = containerRef.current

    PIXI.settings.PRECISION_FRAGMENT = 'highp'

    const app = new PIXI.Application({
      width: clientWidth,
      height: clientHeight,
      resolution: window.devicePixelRatio || 1,
      view: canvasRef.current,
      resizeTo: containerRef.current,
      autoStart: false,
      transparent: true,
      antialias: false,
      autoDensity: true,
      preserveDrawingBuffer: false,
      clearBeforeRender: true,
      powerPreference: isTabletOrDesktop ? 'high-performance' : undefined,
      sharedLoader: true,
    })

    // Allow touch scrolling on mobile devices.
    app.renderer.plugins.interaction.autoPreventDefault = false
    app.renderer.view.style.touchAction = 'auto'

    const crashEngine = (crashEngineRef.current =
      crashEngineRef.current ?? new CrashEngine(app, crashRocketsConfig))

    const viewManager = (viewManagerRef.current =
      viewManagerRef.current ?? new ViewManager(app, crashEngine))

    viewManager.setAttachment('crashEngine', crashEngine)
    viewManager.registerView('loading', LoadingView)
    viewManager.registerView('starting', StartingView)
    viewManager.registerView('active', ActiveView)
    viewManager.switchView('loading')

    app.ticker.add(() => {
      try {
        if (CrashEngine.RocketVisibleStates.includes(crashEngine.state)) {
          crashEngine.tick()
        }

        viewManager.tick()
      } catch (err) {
        // when the browser is not visible, '.tick()' will always log an error
        // auto recovers when the browser is back in focus
      }
    })

    const { renderer } = app
    crashEngine.onResize(
      renderer.width / renderer.resolution,
      renderer.height / renderer.resolution,
    )

    // app.start()

    // Preload any rocket resources, so make sure all rockets in the config are needed!
    const rocketResources = Object.values(crashRocketsConfig.rockets).reduce(
      (images, rocket) => [...images, ...rocket.skins, rocket.background],
      [],
    )

    app.loader
      .add(rocketResources)
      .add('btc', btc)
      .add('eth', eth)
      .add('ltc', ltc)
      .add('flag', getCachedSrc({ src: flag }))
      .add('explosions', '/resources/effects/explosions.json')
      .add('point_red', getCachedSrc({ src: '/resources/point_red.png' }))
      .add('point_green', getCachedSrc({ src: '/resources/point_green.png' }))
      .add('point_yellow', getCachedSrc({ src: '/resources/point_yellow.png' }))
      .load(() => {
        // https://sentry.io/share/issue/0a56de2d6c9c4050ad4ec5780b21637e/
        if (app) {
          app.start()
          setReady(true)

          socketRef.current.connect()
        }
      })

    let resizeTimeout = null

    const observer = new ResizeObserver(entries => {
      clearTimeout(resizeTimeout)
      const entry = entries[0]

      if (entry) {
        const { width, height } = entry.contentRect

        resizeTimeout = setTimeout(() => {
          if (!app || !viewManagerRef.current) {
            return
          }

          app.resize()
          crashEngine?.onResize(width, height)
          viewManagerRef.current.onResize(width, height)
          if (typeof playerBetsAppRef.current?.resize === 'function') {
            playerBetsAppRef.current.resize()
          }
        }, 250)
      }
    })

    observer.observe(containerRef.current)

    return () => {
      clearTimeout(resizeTimeout)
      observer.disconnect()

      app?.destroy()
      crashEngine.destroy()

      PIXI.utils.clearTextureCache()
      PIXI.Loader.shared.destroy()
      PIXI.Loader.shared.reset()
    }
  }, [setReady])

  React.useEffect(() => {
    if (viewManagerRef.current?.currentViewKey === 'active') {
      const activeView = viewManagerRef.current.currentView as ActiveView
      activeView.updateCurrency(formatCurrency)
      if (activeView?.cashoutPoint) {
        const cashoutPoint = activeView.cashoutPoint as CashoutPoint
        cashoutPoint.updateCashoutAmount()
      }
    }
  }, [formatCurrency])

  const onAutoCashoutChange = React.useCallback(autoCashout => {
    autoCashoutRef.current = autoCashout

    if (viewManagerRef.current?.currentViewKey === 'active') {
      viewManagerRef.current.currentView.autoCashoutMultiplier =
        autoCashoutRef.current
    }
  }, [])

  React.useEffect(() => {
    if (!crashEngineRef.current) {
      return
    }

    if (!!userBet && !userBet.cashoutCrashPoint) {
      crashEngineRef.current.betAmount = userBet.betAmount
    } else {
      crashEngineRef.current.betAmount = 0
    }
  }, [userBet])

  const onCashout = React.useCallback(() => {
    flashRef.current.flash()
  }, [userId, crashGame])

  const crashState = crashGame ? crashGame.state : null
  const activeBet =
    !!userBet &&
    !userBet.cashoutCrashPoint &&
    crashState !== CrashEngine.States.Over
      ? userBet
      : null

  const maxProfitRef = React.useRef()

  return (
    <div>
      <Helmet>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <title>Crash</title>
        <meta
          name="description"
          content={translate('gameRoute.description', {
            title: 'Crash',
            provider: 'Roobet',
            numGames: NUM_GAMES,
          })}
        />
      </Helmet>
      <div>
        <KOTHBanner
          page="crash"
          containerClassname={classes.koth}
          whichRoo="astro"
        />
        <div className={gameRouteClasses.GameRoute}>
          <div className={gameRouteClasses.GameRouteContainer}>
            <GameContainer
              title="Crash"
              rightHeaderContent={
                <div>
                  <div ref={maxProfitRef} />
                  <Tooltip
                    title={translate('crashRoute.convertedMaxProfitText', {
                      convertedMax: formatCurrency(1000000, '0,0,0'),
                    })}
                    PopperProps={{ container: maxProfitRef.current }}
                  >
                    <div className={classes.maxProfit}>
                      <FontAwesomeIcon icon={['fas', 'info-circle']} />{' '}
                      {translate('crashRoute.maxProfit')}
                    </div>
                  </Tooltip>
                </div>
              }
              rightActions={
                isTabletOrDesktop && (
                  <CrashHistory readyRef={readyRef} socketRef={socketRef} />
                )
              }
            >
              <div className={classes.container}>
                <div className={classes.history}>
                  <CrashHistory readyRef={readyRef} socketRef={socketRef} />
                </div>
                <div className={classes.controlsContainer}>
                  <Tabs
                    className={classes.tabs}
                    variant="fullWidth"
                    color="secondary"
                    value={mode}
                    onChange={(_, newMode) => {
                      setSubTab(0)
                      setMode(newMode)
                    }}
                  >
                    <Tab
                      disabled={!!activeBet}
                      sx={styles.controlTabs}
                      label={translate('crashRoute.manual')}
                    />
                    <Tab
                      disabled={!!activeBet}
                      sx={styles.controlTabs}
                      label={translate('crashRoute.auto')}
                    />
                  </Tabs>

                  <div className={classes.innerControlsContainer}>
                    {mode === 1 && (
                      <Tabs
                        className={classes.tabs}
                        indicatorColor="secondary"
                        variant="fullWidth"
                        color="secondary"
                        value={subTab}
                        onChange={(_, value) => setSubTab(value)}
                      >
                        <Tab
                          label={translate('crashRoute.controls')}
                          sx={styles.subTabs}
                        />
                        <Tab
                          label={translate('crashRoute.leaderboard')}
                          sx={styles.subTabs}
                        />
                      </Tabs>
                    )}

                    <BetControls
                      socketRef={socketRef}
                      activeBet={activeBet}
                      mode={mode}
                      onCashout={onCashout}
                      userBet={userBet}
                      onAutoCashoutChange={onAutoCashoutChange}
                      crashEngineRef={crashEngineRef}
                      crashState={crashGame ? crashGame.state : null}
                    />

                    {mode === 0 && (
                      <React.Suspense
                        fallback={
                          <div className={classes.lazyLoader}>
                            <CircularProgress
                              size={20}
                              className={classes.lazyLoaderProgress}
                              color="secondary"
                            />
                          </div>
                        }
                      >
                        <PlayerList
                          playerBetsAppRef={playerBetsAppRef}
                          playerBetsRef={playerBetsRef}
                          readyRef={readyRef}
                          socketRef={socketRef}
                          formatCurrency={formatCurrency}
                        />
                      </React.Suspense>
                    )}

                    {mode === 1 && subTab === 1 && (
                      <div className={classes.leaderboard}>
                        <React.Suspense
                          fallback={
                            <div className={classes.lazyLoader}>
                              <CircularProgress
                                size={20}
                                className={classes.lazyLoaderProgress}
                                color="secondary"
                              />
                            </div>
                          }
                        >
                          <PlayerList
                            playerBetsAppRef={playerBetsAppRef}
                            playerBetsRef={playerBetsRef}
                            readyRef={readyRef}
                            socketRef={socketRef}
                            formatCurrency={formatCurrency}
                          />
                        </React.Suspense>
                      </div>
                    )}
                  </div>
                </div>
                <div className={classes.crashContainer} ref={containerRef}>
                  <ScreenFlash actionsRef={flashRef} />
                  <div className={classes.canvasContainer}>
                    {!ready && (
                      <div className={classes.crashLoader}>
                        <Skeleton
                          className={classes.loader}
                          style={{ maxWidth: 250 }}
                          variant="rectangular"
                          width="50%"
                          height={50}
                        />
                        <Skeleton
                          className={classes.loader}
                          style={{ maxWidth: 400, marginTop: 8 }}
                          variant="rectangular"
                          width="60%"
                          height={30}
                        />
                      </div>
                    )}
                    <canvas ref={canvasRef} />
                  </div>
                </div>
              </div>
            </GameContainer>
            <div className={gameRouteClasses.descDesktop}>
              <GameDesc game={game} />
              <Leaderboard gameId="crash" />
            </div>
          </div>
        </div>
        <RecentlyPlayed />
      </div>
    </div>
  )
})
