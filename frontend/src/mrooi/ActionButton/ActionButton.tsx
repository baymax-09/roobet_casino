import React, { forwardRef } from 'react'
import { Button, type ButtonProps } from '@project-atl/ui'
import { Box } from '@mui/material'

import { playSound } from 'app/lib/sound'

interface ActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => void
}

export const ActionButton: React.FC<
  React.PropsWithChildren<ActionButtonProps>
> = React.memo(
  forwardRef(({ onClick, children, ...otherProps }, ref) => {
    const onClick_ = React.useCallback(() => {
      playSound('bet', 'place')

      if (onClick) {
        onClick()
      }
    }, [onClick])

    return (
      <Box ref={ref}>
        <Button onClick={onClick_} {...otherProps}>
          {children}
        </Button>
      </Box>
    )
  }),
)

ActionButton.displayName = 'ActionButton'
