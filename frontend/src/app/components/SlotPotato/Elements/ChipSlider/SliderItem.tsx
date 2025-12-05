import React from 'react'

import { type SlotGame } from 'app/gql'

import { EndedChip, LockedChip } from '../../SlotPotatoChips'

export interface SliderItemProps {
  game: SlotGame
  activeGameId: string
  gameDuration: number
  activeGameIdx: number
  idx: number
  startDateTime: Date
}

export const SliderItem: React.FC<SliderItemProps> = ({
  game,
  activeGameId,
  activeGameIdx,
  idx,
  gameDuration,
  startDateTime,
}) => {
  const trueGameIndex = idx
  const hasEnded = activeGameIdx > trueGameIndex

  if (hasEnded) {
    return <EndedChip key={`ended-chip-${activeGameId}-${idx}`} game={game} />
  }

  return (
    <LockedChip
      key={`locked-chip-${activeGameId}-${idx}`}
      game={game}
      startDateTime={startDateTime}
      gameDuration={gameDuration}
      showFullProgressBar={trueGameIndex - 1 > activeGameIdx}
    />
  )
}
