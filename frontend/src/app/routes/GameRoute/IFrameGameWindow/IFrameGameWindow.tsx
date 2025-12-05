import React from 'react'
import { useSelector } from 'react-redux'

import { useLocale, useTranslate } from 'app/hooks'
import { type NormalizedTPGame } from 'common/types'
import { useToasts } from 'common/hooks'
import { type DisplayCurrency } from 'common/constants'

import { loadGameFrame } from '../GameFrameRouteView'

import { useIFrameGameWindowStyles } from './IFrameGameWindow.styles'

export interface EssentialIFrameGameWindowProps {
  game: NormalizedTPGame
  realMode: boolean
  gameWrapperRef: React.MutableRefObject<HTMLDivElement | null>
  showCurrencyOverlayWithSupportedCurrencies?: (
    supportedCurrencies: DisplayCurrency[] | undefined,
    gameIdentifier: string,
    gameCurrency: DisplayCurrency,
  ) => void
  gameCurrency: DisplayCurrency
}

type IFrameGameWindowProps = {
  title: string
  gameFrameRef?: React.RefObject<HTMLIFrameElement>
  onLoad?: React.ReactEventHandler<HTMLIFrameElement>
  setErrorMessage?: React.Dispatch<React.SetStateAction<string | null>>
} & EssentialIFrameGameWindowProps

export const IFrameGameWindow: React.FC<IFrameGameWindowProps> = ({
  game,
  title,
  gameWrapperRef,
  gameFrameRef = null,
  realMode = false,
  onLoad = undefined,
  setErrorMessage,
  showCurrencyOverlayWithSupportedCurrencies,
  gameCurrency,
}) => {
  const classes = useIFrameGameWindowStyles()
  const locale = useLocale()
  const translate = useTranslate()
  const { toast } = useToasts()
  const countryCode = useSelector(
    ({ settings }) => settings?.countryCode ?? null,
  )

  const [iframeURL, setIframeURL] = React.useState<string | undefined>(
    undefined,
  )

  React.useEffect(() => {
    const loadIFrameURL = async () => {
      const gameFrameData = await loadGameFrame({
        realMode,
        game,
        isMobile: false,
        locale,
        countryCode,
        displayCurrency: gameCurrency,
        setErrorMessage,
      })

      if (showCurrencyOverlayWithSupportedCurrencies) {
        showCurrencyOverlayWithSupportedCurrencies(
          gameFrameData?.supportedCurrencies,
          game.identifier,
          gameCurrency,
        )
      }

      const iframeURL = gameFrameData?.url

      if (!gameFrameData || !iframeURL) {
        toast.error(translate('gameRoute.failedToLoadGame'))
      }

      setIframeURL(iframeURL)
    }

    loadIFrameURL()
  }, [game, realMode, locale, setIframeURL, gameCurrency, countryCode])

  return (
    <div className={classes.root} ref={gameWrapperRef}>
      <iframe
        title={title}
        ref={gameFrameRef}
        src={iframeURL}
        allowFullScreen
        // @ts-expect-error not a part of the standard HTML attribute set
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        onLoad={onLoad}
      />
    </div>
  )
}
