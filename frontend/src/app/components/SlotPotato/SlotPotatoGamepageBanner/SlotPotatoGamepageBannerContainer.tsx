import React from 'react'

import { useSlotPotato } from 'app/hooks'

import { SlotPotatoGamepageBanner } from './SlotPotatoGamepageBanner'

export interface SlotPotatoActiveGamepageBannerContainerProps {
  gameId: string
}

const SlotPotatoGamepageBannerContainer: React.FC<
  SlotPotatoActiveGamepageBannerContainerProps
> = ({ gameId }) => {
  const {
    slotPotato,
    activeGame,
    handleSetActiveGame,
    isSlotPotatoActive,
    shouldShowCountdownBanner,
    handleCompleteCountdown,
  } = useSlotPotato()

  if (
    slotPotato &&
    activeGame &&
    isSlotPotatoActive &&
    !shouldShowCountdownBanner
  ) {
    return (
      <SlotPotatoGamepageBanner
        currentGamePageId={gameId}
        activeGameId={activeGame?.game.id}
        games={slotPotato.games}
        handleSetActiveGame={handleSetActiveGame}
        handleCompleteCountdown={handleCompleteCountdown}
      />
    )
  }

  return null
}

export default SlotPotatoGamepageBannerContainer
