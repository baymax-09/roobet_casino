import React from 'react'
import { Check, theme as uiTheme } from '@project-atl/ui'

import { type SlotGame } from 'app/gql'

import { CountdownChip } from './CountdownChip'
import { LockIndicator } from './LockIndicator'

export interface EndedChipProps {
  game: SlotGame
}

export const EndedChip: React.FC<EndedChipProps> = ({ game }) => {
  return (
    <CountdownChip game={game}>
      <LockIndicator
        progress={100}
        icon={<Check iconFill={uiTheme.palette.success[500]} />}
        circularProgressProps={{ color: 'success' }}
      />
    </CountdownChip>
  )
}
