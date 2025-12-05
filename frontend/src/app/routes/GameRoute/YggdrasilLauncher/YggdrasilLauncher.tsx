import React from 'react'

import {
  productApolloClient,
  TPGameStartGameMutation,
  type TPGameStartGameData,
} from 'app/gql'
import { type NormalizedTPGame } from 'common/types'

import {
  IFrameGameWindow,
  type EssentialIFrameGameWindowProps,
} from '../IFrameGameWindow'
interface TPGameStartGameVariables {
  gameIdentifier: string
}

export const loadYggdrasil = async (
  game: NormalizedTPGame,
  isMobile: boolean,
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

  const url = data?.tpGameStartGame.url
  const channel = isMobile ? 'mobile' : 'pc' // Yggdrasil uses 'pc' for desktop
  const supportedCurrencies = data?.tpGameStartGame.supportedCurrencies
  return {
    url: [url, `channel=${channel}`].join('&'),
    supportedCurrencies,
  }
}

const YggdrasilLauncher: React.FC<EssentialIFrameGameWindowProps> = ({
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

export default YggdrasilLauncher
