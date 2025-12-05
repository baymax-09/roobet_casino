import React from 'react'

import {
  productApolloClient,
  TPGameStartGameMutation,
  type TPGameStartGameData,
} from 'app/gql'
import { type DisplayCurrency, env } from 'common/constants'
import { type NormalizedTPGame } from 'common/types'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'
interface TPGameStartGameVariables {
  gameIdentifier: string
}

export const loadHacksaw = async (
  game: NormalizedTPGame,
  realMode: boolean,
  isMobile: boolean,
  displayCurrency: DisplayCurrency,
) => {
  const { data } = await productApolloClient.mutate<
    TPGameStartGameData,
    TPGameStartGameVariables
  >({
    mutation: TPGameStartGameMutation,
    variables: {
      gameIdentifier: game.identifier,
    },
  })

  const token = data?.tpGameStartGame.token
  const partner = data?.tpGameStartGame.partnerId
  const mode = realMode ? 'live' : 'demo'
  const channel = isMobile ? 'mobile' : 'desktop'
  const displayCurrencyCode = displayCurrency.toUpperCase()
  const supportedCurrencies = data?.tpGameStartGame.supportedCurrencies
  return {
    url: `https://static-${
      env.NODE_ENV === 'production' ? 'live' : 'stg'
    }.hacksawgaming.com/launcher/static-launcher.html?gameid=${
      game.gid
    }&channel=${channel}&language=en&currency=${displayCurrencyCode}&partner=${partner}&mode=${mode}&token=${token}&lobbyurl=${
      env.BASE_URL
    }`,
    supportedCurrencies,
  }
}

const HacksawLauncher: React.FC<EssentialIFrameGameWindowProps> = ({
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

export default HacksawLauncher
