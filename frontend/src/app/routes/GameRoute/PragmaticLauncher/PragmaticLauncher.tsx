import React from 'react'

import {
  type EssentialIFrameGameWindowProps,
  IFrameGameWindow,
} from '../IFrameGameWindow'

const PragmaticLauncher: React.FC<EssentialIFrameGameWindowProps> = ({
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

export default React.memo(PragmaticLauncher)
