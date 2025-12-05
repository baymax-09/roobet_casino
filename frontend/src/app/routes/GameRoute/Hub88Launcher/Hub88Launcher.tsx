import React from 'react'

import { api } from 'common/util'
import { type DisplayCurrency } from 'common/constants'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'

interface Hub88GameUrlResponse {
  url: string
  supportedCurrencies: DisplayCurrency[]
}

export async function loadHub88(
  gameIdentifier: string,
  realMode: boolean,
  isMobile: boolean,
  displayCurrency: DisplayCurrency,
) {
  const displayCurrencyCode = displayCurrency.toUpperCase()
  const { url, supportedCurrencies } = await api.get<any, Hub88GameUrlResponse>(
    `hub88/internal/getGameUrl?gameIdentifier=${gameIdentifier}&platform=${
      isMobile ? 'mobile' : 'desktop'
    }&currency=${realMode ? displayCurrencyCode : 'XXX'}`,
  )

  return { url, supportedCurrencies }
}

const Hub88Launcher: React.FC<EssentialIFrameGameWindowProps> = ({
  game,
  gameWrapperRef,
  realMode,
  showCurrencyOverlayWithSupportedCurrencies,
  gameCurrency,
}) => {
  return (
    <IFrameGameWindow
      game={game}
      title={game.title}
      gameWrapperRef={gameWrapperRef}
      realMode={realMode}
      showCurrencyOverlayWithSupportedCurrencies={
        showCurrencyOverlayWithSupportedCurrencies
      }
      gameCurrency={gameCurrency}
    />
  )
}

export default React.memo(Hub88Launcher)
