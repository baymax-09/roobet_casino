import React, { type SyntheticEvent } from 'react'

import { env, type DisplayCurrency } from 'common/constants'
import { api } from 'common/util'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'

interface PlayNGoGameConfigResponse {
  token: string
  supportedCurrencies: DisplayCurrency[]
}

export const loadPlayngo = async (
  gameId: string,
  realMode: boolean,
  isMobile: boolean,
  locale = 'en',
) => {
  let ticket: string | null = null
  let supportedCurrencies: DisplayCurrency[] | undefined

  if (realMode) {
    const getGameConfig = await api.get<any, PlayNGoGameConfigResponse>(
      'playngo/internal/getGameConfig',
    )

    ticket = getGameConfig.token
    supportedCurrencies = getGameConfig.supportedCurrencies
  }

  return {
    url: `${
      env.PLAYNGO_BASE_URL
    }/casino/ContainerLauncher?pid=717&gid=${gameId}&lang=${locale}&ticket=${ticket}&practice=${
      realMode ? '0' : '1'
    }&channel=${isMobile ? 'mobile' : 'desktop'}&origin=${env.BASE_URL}`,
    supportedCurrencies,
  }
}

interface PlayngoLauncherProps extends EssentialIFrameGameWindowProps {
  toggleRealMode: (nextValue?: any) => void
  goBack: () => void
}

const PlayngoLauncher: React.FC<PlayngoLauncherProps> = ({
  game,
  gameWrapperRef,
  realMode,
  toggleRealMode,
  goBack,
  showCurrencyOverlayWithSupportedCurrencies,
  gameCurrency,
}) => {
  const gameFrameRef = React.useRef<HTMLIFrameElement | null>(null)

  /* Handle events from the Playngo Iframe */
  React.useEffect(() => {
    const onProcessGameMessage = ({ data }) => {
      if (data) {
        if (data.type === 'playForReal') {
          toggleRealMode(true)
        } else if (data.type === 'backToLobby') {
          goBack()
        } else if (data.type === 'reloadGame') {
          if (gameFrameRef.current) {
            gameFrameRef.current.src = `${gameFrameRef.current.src}`
          }
        }
      }
    }
    window.addEventListener('message', onProcessGameMessage)
    return () => {
      window.removeEventListener('message', onProcessGameMessage)
    }
  }, [])

  /* Subscribe to events from the Playngo Iframe */
  const onLoad = React.useCallback(
    ({ currentTarget }: SyntheticEvent<HTMLIFrameElement>) => {
      const postMessage = data => {
        currentTarget.contentWindow?.postMessage(data, env.PLAYNGO_BASE_URL)
      }

      postMessage({
        messageType: 'addEventListener',
        eventType: 'playForReal',
      })

      postMessage({
        messageType: 'addEventListener',
        eventType: 'backToLobby',
      })

      postMessage({
        messageType: 'addEventListener',
        eventType: 'reloadGame',
      })
    },
    [],
  )

  return (
    <IFrameGameWindow
      game={game}
      title={game.title}
      gameWrapperRef={gameWrapperRef}
      realMode={realMode}
      onLoad={onLoad}
      showCurrencyOverlayWithSupportedCurrencies={
        showCurrencyOverlayWithSupportedCurrencies
      }
      gameCurrency={gameCurrency}
    />
  )
}

export default React.memo(PlayngoLauncher)
