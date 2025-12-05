import React from 'react'
import { useMutation } from '@apollo/client'
import { CircularProgress, useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import { theme as uiTheme } from '@project-atl/ui'
import { useLocation } from 'react-router'

import { TPGameStartGameMutation } from 'app/gql'
import {
  useAppUpdate,
  useDialogsOpener,
  useIsLoggedIn,
  useLazyRoute,
  useLocale,
  useTranslate,
} from 'app/hooks'
import { isSupportedLanguage } from 'app/constants'
import { useScript, useToasts } from 'common/hooks'
import { env } from 'common/constants'
import { useApp } from 'app/context'
import { SPORTSBOOK_GAME_IDENTIFIER } from 'app/constants/sportsbetting'

import { useSportsbookLauncherStyles } from './SportsbookLauncher.styles'
import { CHAT_TRANSITION_TIME } from 'app/components/App/App.styles'

interface TPGameStartGameData {
  tpGameStartGame: {
    url: string | null
    token: string | null
    content: string | null
  }
}

interface TPGameStartGameVariables {
  gameIdentifier: string
}

// I do not believe this changes between envs.
const BETBY_BRAND_ID = env.BETBY_BRAND_ID
const BETBY_RENDERER_SRC = env.BETBY_SCRIPT_SRC

const mapLanguageCode = (langCode: string) => {
  if (!isSupportedLanguage(langCode)) {
    return 'en'
  }

  return langCode
}

const BetbyHost: React.FC<{
  gameKey: string | undefined
  reloadToken: () => void
}> = ({ gameKey, reloadToken }) => {
  const openDialog = useDialogsOpener()
  const { chatHidden } = useApp()
  const location = useLocation()

  const lang = mapLanguageCode(useLocale())

  const hostRef = React.useRef<HTMLDivElement>(null)
  const rendererRef = React.useRef<typeof window.BTRenderer | null>(null)

  // We need to keep track of inits, to update options accordingly.
  const [initVersion, setInitVersion] = React.useState<number>(0)

  const isMobile = useMediaQuery(() => uiTheme.breakpoints.down('md'))

  // Betslip alignment options.
  const { betSlipOffsetBottom, betSlipOffsetRight } = (() => {
    if (isMobile) {
      return {
        betSlipOffsetBottom: 64,
        betSlipOffsetRight: 0,
      }
    }

    if (!chatHidden) {
      return {
        betSlipOffsetBottom: 0,
        betSlipOffsetRight: 425,
      }
    }

    return {
      betSlipOffsetBottom: 0,
      betSlipOffsetRight: 50,
    }
  })()

  // Update betslip alignment.
  React.useEffect(() => {
    if (!rendererRef.current || !initVersion) {
      return
    }

    // Delay update to match app layout transition.
    const timeoutMs = chatHidden && !isMobile ? CHAT_TRANSITION_TIME : 0

    const timeout = setTimeout(() => {
      rendererRef.current?.updateOptions({
        betSlipOffsetRight,
        betSlipOffsetBottom,
      })
    }, timeoutMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    initVersion,
    betSlipOffsetRight,
    betSlipOffsetBottom,
    chatHidden,
    isMobile,
  ])

  // Initialize a new frame session.
  React.useEffect(() => {
    if ('BTRenderer' in window) {
      const target = hostRef.current

      if (!target) {
        return
      }

      // Create new instance of BTRenderer. This also helps us keep
      // track of whether we need to init or update.
      if (!rendererRef.current) {
        rendererRef.current = new window.BTRenderer()
      }

      // We need a copy here, the ref will be gone by the time the cleanup fn is called.
      const renderer = rendererRef.current

      renderer.initialize({
        brand_id: BETBY_BRAND_ID,
        key: gameKey,
        themeName: 'roobet-tile',
        lang,
        target,
        minFrameHeight: 700,
        betslipZIndex: 999,
        stickyTop: 0,
        onSessionRefresh: () => {
          reloadToken()
        },
        onRecharge: () => {
          openDialog('cashier', {
            params: {
              tab: 'deposit',
            },
          })
        },
        onLogin: () => {
          openDialog('auth', {
            params: {
              tab: 'login',
            },
          })
        },
        onRegister: () => {
          openDialog('auth', {
            params: {
              tab: 'register',
            },
          })
        },
      })

      // Internal counter used to trigger other side effects after init'ing.
      setInitVersion(prev => prev + 1)

      return () => {
        if (renderer) {
          renderer.kill()
        }
      }
    }
  }, [openDialog, reloadToken, gameKey, lang])

  // Update current path on location change.
  React.useEffect(() => {
    if (rendererRef.current) {
      const btPath = new URLSearchParams(location.search).get('bt-path') ?? '/'

      rendererRef.current.updateOptions({
        url: btPath,
      })
    }
  }, [location])

  // Kill rendered on dismount.
  React.useEffect(() => {
    // We need a copy here, the ref will be gone by the time the cleanup fn is called.
    const renderer = rendererRef.current

    return () => {
      if (renderer) {
        renderer.kill()
      }
    }
  }, [])

  return <div ref={hostRef} id="bettech" />
}

interface SportsbookLauncherProps {
  loading: boolean
}

export const SportsbookLauncher: React.FC<SportsbookLauncherProps> = ({
  loading: loadingGame,
}) => {
  const classes = useSportsbookLauncherStyles()
  const isLoggedIn = useIsLoggedIn()
  const { toast } = useToasts()
  const translate = useTranslate()
  const { appContainer } = useApp()

  // Finish route transition once this component has rendered.
  useLazyRoute(true)

  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'))

  // Why aren't these the same context... GAH
  const initAppState = React.useRef(useApp())
  const updateAppState = useAppUpdate()

  const { attached } = useScript({ src: BETBY_RENDERER_SRC })

  // We need to create a new session every time a user changes their balance.
  const selectedBalanceType = useSelector(
    ({ balances }) => balances?.selectedBalanceType ?? '',
  )

  const [startGame, { data, loading: loadingToken }] = useMutation<
    TPGameStartGameData,
    TPGameStartGameVariables
  >(TPGameStartGameMutation, {
    variables: {
      gameIdentifier: SPORTSBOOK_GAME_IDENTIFIER,
    },
    onError: () => {
      toast.error(translate('gameRoute.failedToLoadGame'))
    },
  })

  const loadGameSession = React.useCallback(() => {
    // Scroll to top of page when reloading the game session.
    appContainer?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })

    startGame()
  }, [startGame, appContainer])

  // Hide the FABs on mount.
  React.useEffect(() => {
    const appState = initAppState.current

    updateAppState(app => {
      app.fabHidden = true
    })

    // Return app state to previous settings.
    return () => {
      updateAppState(app => {
        app.fabHidden = appState.fabHidden
      })
    }
  }, [isDesktop, updateAppState])

  // Loading game URL on mount and on login.
  React.useEffect(() => {
    if (isLoggedIn && !loadingGame) {
      loadGameSession()
    }
  }, [loadGameSession, loadingGame, isLoggedIn, selectedBalanceType])

  const token = data?.tpGameStartGame?.token
  const isLoading =
    loadingGame || loadingToken || !attached || (isLoggedIn && !token)

  return (
    <div className={classes.container}>
      {isLoading ? (
        <div className={classes.loadingContainer}>
          <CircularProgress color="secondary" />
        </div>
      ) : (
        <BetbyHost
          gameKey={data?.tpGameStartGame?.token ?? undefined}
          reloadToken={loadGameSession}
        />
      )}
    </div>
  )
}
