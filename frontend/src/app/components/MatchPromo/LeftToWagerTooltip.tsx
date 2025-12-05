import React, { forwardRef } from 'react'
import { Tooltip, type TooltipProps } from '@mui/material'

import { useLeftToWagerTooltipStyles } from './LeftToWagerTooltip.styles'

type LeftToWagerTooltipProps = TooltipProps & {
  pending: boolean
}

const LeftToWagerTooltip: React.FC<LeftToWagerTooltipProps> = forwardRef(
  ({ pending, ...props }, ref) => {
    const classes = useLeftToWagerTooltipStyles()

    return (
      <Tooltip
        {...props}
        ref={ref}
        classes={{
          tooltip: classes.Tooltip,
        }}
        slotProps={{
          tooltip: {
            sx: [
              pending && {
                backgroundColor: 'deprecated.primary.main',
              },
            ],
          },
          arrow: {
            sx: [
              pending && {
                color: 'deprecated.primary.main',
              },
            ],
          },
        }}
      />
    )
  },
)

export default LeftToWagerTooltip
