import React from 'react'
import { Drawer } from '@mui/material'
import { Typography, ActionIcon, theme as uiTheme } from '@project-atl/ui'
import { Close } from '@project-atl/ui/assets'

import { useChatDrawerStyles } from './ChatDrawer.styles'

interface ChatDrawerProps {
  title: string
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export const ChatDrawer: React.FC<React.PropsWithChildren<ChatDrawerProps>> = ({
  title,
  open,
  setOpen,
  children,
}) => {
  const classes = useChatDrawerStyles()

  return (
    <Drawer
      className={classes.ChatDrawer}
      anchor="bottom"
      open={open}
      onClose={() => setOpen(false)}
      variant="persistent"
    >
      <div className={classes.ChatDrawer__inputContainer}>
        <Typography
          variant="body4"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {title}
        </Typography>
        <div className={classes.ChatDrawer__closeIcon}>
          <ActionIcon
            onClick={() => setOpen(false)}
            hoverBackgroundColor={uiTheme.palette.neutral[800]}
          >
            <Close />
          </ActionIcon>
        </div>
      </div>
      {children}
    </Drawer>
  )
}
