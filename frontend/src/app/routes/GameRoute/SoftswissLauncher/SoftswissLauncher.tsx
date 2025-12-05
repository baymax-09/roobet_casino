import React from 'react'

import { api } from 'common/util'
import { type DisplayCurrency } from 'common/constants'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'

interface SoftswissLauncherProps extends EssentialIFrameGameWindowProps {
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
}

interface SoftswissGameLinkArgs {
  gameName: string
  type: 'mobile' | 'desktop'
  currency: DisplayCurrency
}

export type SoftswissLaunchOptions = Record<string, any>

interface SoftswissGameLinkResponse {
  launch_options: SoftswissLaunchOptions
  supportedCurrencies?: DisplayCurrency[]
}

export const loadSoftswiss = async (
  gameName: string,
  realMode: boolean,
  isMobile: boolean,
  currency: DisplayCurrency,
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>,
) => {
  const displayCurrencyCode = currency.toUpperCase()
  try {
    const data = await api.get<
      SoftswissGameLinkArgs,
      SoftswissGameLinkResponse
    >(`/softswiss/${!realMode ? 'demo' : 'getGameLink'}`, {
      params: {
        gameName,
        type: isMobile ? 'mobile' : 'desktop',
        currency: displayCurrencyCode,
      },
    })
    // 'launch_options' not a url, but needs to follow our game url loading pattern.
    return {
      url: data.launch_options,
      supportedCurrencies: data.supportedCurrencies,
    }
  } catch (error: any) {
    setErrorMessage(error.response.data ?? null)
    return { url: undefined }
  }
}

const SoftswissLauncher: React.FC<SoftswissLauncherProps> = ({
  game,
  realMode,
  gameWrapperRef,
  setErrorMessage,
  showCurrencyOverlayWithSupportedCurrencies,
  gameCurrency,
}) => {
  return (
    <IFrameGameWindow
      game={game}
      title={game.title}
      gameWrapperRef={gameWrapperRef}
      realMode={realMode}
      setErrorMessage={setErrorMessage}
      showCurrencyOverlayWithSupportedCurrencies={
        showCurrencyOverlayWithSupportedCurrencies
      }
      gameCurrency={gameCurrency}
    />
  )
}

export default React.memo(SoftswissLauncher)
