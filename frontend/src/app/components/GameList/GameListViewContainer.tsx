import React from 'react'
import { Box, type BoxProps, type SxProps } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

const styles = {
  '--roo-game-thumbnail-gap': uiTheme.spacing(1),
  [uiTheme.breakpoints.up('md')]: {
    '--roo-game-thumbnail-gap': uiTheme.spacing(2),
  },
  containerType: 'inline-size',
  '& > div': {
    '--roo-game-thumbnail-per-column': 3,
  },
  '@container (min-width: 600px)': {
    '& > div': {
      '--roo-game-thumbnail-per-column': 4,
    },
  },
  '@container (min-width: 800px)': {
    '& > div': {
      '--roo-game-thumbnail-per-column': 5,
    },
  },
  '@container (min-width: 1000px)': {
    '& > div': {
      '--roo-game-thumbnail-per-column': 6,
    },
  },
  '@container (min-width: 1100px)': {
    '& > div': {
      '--roo-game-thumbnail-per-column': 7,
    },
  },
} satisfies SxProps

/**
 * This component is a container for the GameListView component which
 * controls the number of columns the game list can show depending on the
 * container size.
 */
export const GameListViewContainer = ({ children, ...props }: BoxProps) => {
  return (
    <Box sx={styles} {...props}>
      <div>{children}</div>
    </Box>
  )
}
