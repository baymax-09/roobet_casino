import React from 'react'

import {
  productApolloClient,
  TPGameStartGameMutation,
  type TPGameStartGameData,
  type TPGameStartGameVariables,
} from 'app/gql'
import { type NormalizedTPGame } from 'common/types'
import { type DisplayCurrency } from 'common/constants'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'

export const loadSlotegratorSlots = async (
  game: NormalizedTPGame,
  realMode: boolean,
  gameCurrency: DisplayCurrency,
) => {
  const gameCurrencyCode = gameCurrency.toUpperCase()
  const { data } = await productApolloClient.mutate<
    TPGameStartGameData,
    TPGameStartGameVariables
  >({
    mutation: TPGameStartGameMutation,
    variables: {
      gameIdentifier: game.identifier,
      mode: realMode ? 'live' : 'demo',
      gameCurrency: gameCurrencyCode,
    },
  })

  const supportedCurrencies = data?.tpGameStartGame.supportedCurrencies

  return { url: data?.tpGameStartGame.url, supportedCurrencies }
}

export const SlotegratorSlotsLauncher: React.FC<
  EssentialIFrameGameWindowProps
> = ({
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
