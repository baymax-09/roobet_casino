import React, { type PropsWithChildren } from 'react'
import clsx from 'clsx'

import { type SlotGame } from 'app/gql'
import { GameThumbnail } from 'app/components/Game'

import { useCountdownChipStyles } from './CountdownChip.styles'

export interface CountdownChipProps {
  game: SlotGame
  applyBlur?: boolean
  gameThumbnailClassName?: string
  gameThumbnailImageClassName?: string
}

export const CountdownChip: React.FC<PropsWithChildren<CountdownChipProps>> = ({
  game,
  children,
  applyBlur = true,
  gameThumbnailClassName,
  gameThumbnailImageClassName,
}) => {
  const classes = useCountdownChipStyles()

  return (
    <div className={classes.CountdownChip}>
      <GameThumbnail
        game={game}
        gameThumbnailClassName={gameThumbnailClassName}
        gameThumbnailImageClassName={gameThumbnailImageClassName}
      >
        {children && (
          <div className={clsx({ [classes.ChildrenContainer]: applyBlur })}>
            {children}
          </div>
        )}
      </GameThumbnail>
    </div>
  )
}
