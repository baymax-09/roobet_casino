import React from 'react'
import { useSelector } from 'react-redux'

import { env } from 'common/constants'
import { useToasts } from 'common/hooks'
import { useDialogsOpener } from 'app/hooks'
import { type NormalizedTPGame } from 'common/types'

import { useHouseGameLauncherStyles } from './HouseGameLauncher.styles'

const localTestUrl = 'http://localhost:7456/web-mobile/web-mobile/index.html' // 'http://localhost:7456'

function getDepositUrl() {
  const url = `${env.BASE_URL}?tab=deposit&modal=cashier`
  if (!url.startsWith('http')) {
    return 'https://' + url
  }
  return url
}

const getApiUrl = (gameIdentifier: string) => {
  // Plinko cannot support our API Proxy ({domain}/_api). Until we
  // re-build the game, we must support the Plinko endpoints on the subdomain.
  if (gameIdentifier === 'housegames:Plinko') {
    return env.API_URL_OLD
  }

  return env.API_URL
}

export const loadEmbeddedHouseGame = (
  game: NormalizedTPGame,
  realMode: boolean,
  isMobile: boolean,
  locale = 'en',
  nonce: string,
) => {
  let iframeURL = localTestUrl

  if (!!game && game.iframeSubdomain && env.NODE_ENV !== 'development') {
    const base_url = `${env.BASE_URL}`.replace(/^https?:\/\//, '')
    iframeURL = `https://${game.iframeSubdomain}.${base_url}`
  }

  const url_params = new URLSearchParams()
  url_params.append('platform', isMobile ? 'mobile' : 'desktop')
  url_params.append('realMode', `${realMode}`)
  url_params.append(
    'apiUrl',
    encodeURIComponent(`${getApiUrl(game.identifier)}`),
  )
  url_params.append('appUrl', encodeURIComponent(`${env.BASE_URL}`))
  url_params.append('socketUrl', encodeURIComponent(`${env.SOCKET_URL}`))
  url_params.append('depositLink', encodeURIComponent(getDepositUrl()))
  url_params.append('locale', locale)
  url_params.append('nonce', nonce)

  const new_url = new URL(`${iframeURL}?${url_params.toString()}`)
  return { url: new_url.href }
}

function closeFullscreen() {
  try {
    if (!document.fullscreenElement) {
      return
    }
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
    }
  } catch (error) {}
}

interface HouseGameLauncherProps {
  game: NormalizedTPGame
  gameWrapperRef: React.MutableRefObject<HTMLDivElement | null>
  realMode: boolean
}

const HouseGameLauncher: React.FC<HouseGameLauncherProps> = ({
  game,
  gameWrapperRef,
  realMode,
}) => {
  const gameFrameRef = React.useRef<HTMLIFrameElement | null>(null)

  const locale = useSelector(({ user }) => (user ? user.locale : 'en'))
  const classes = useHouseGameLauncherStyles()
  const openDialog = useDialogsOpener()
  const { toast } = useToasts()

  const nonce = React.useRef(`${Date.now()}`)

  const { url: iframeUrl } = loadEmbeddedHouseGame(
    game,
    realMode,
    false,
    locale,
    nonce.current,
  )

  React.useEffect(() => {
    if (!gameFrameRef.current) {
      return
    }

    const onProcessGameMessage = ({ data }) => {
      if (data) {
        let decoded
        try {
          // Certain browser plugins will also be using the postMessage API.
          // We need to make sure that we are only handling messages from the
          // game if they are coming from the game's iframe.
          decoded = JSON.parse(data)
        } catch (_) {
          return
        }

        if (decoded.type === 'deposit') {
          closeFullscreen()
          openDialog('cashier')
        }

        if (decoded.type === 'toastError') {
          toast.error(decoded.data)
        }
      }
    }

    gameFrameRef.current.onload = () => {
      window.addEventListener('message', onProcessGameMessage)
    }

    return () => {
      window.removeEventListener('message', onProcessGameMessage)
    }
  }, [iframeUrl])

  return (
    <div className={classes.root} ref={gameWrapperRef}>
      <iframe
        title={game.title}
        ref={gameFrameRef}
        scrolling="no"
        src={iframeUrl}
      />
    </div>
  )
}

export default React.memo(HouseGameLauncher)
