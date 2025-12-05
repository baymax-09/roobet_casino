import React from 'react'
import { IconButton } from '@project-atl/ui'
import { Close } from '@project-atl/ui/assets'

import { useChatTopBarStyles } from './ChatTopBar.styles'

interface ChatTopBarProps {
  isMobile: boolean
  toggleHidden: any
}

export const ChatTopBar: React.FC<ChatTopBarProps> = ({
  isMobile,
  toggleHidden,
}) => {
  const classes = useChatTopBarStyles()

  return (
    <>
      {isMobile && (
        <div className={classes.ChatTopBar}>
          <IconButton
            className={classes.ChatTopBar__iconButton}
            onClick={toggleHidden}
            size="small"
            color="tertiary"
          >
            <Close />
          </IconButton>
        </div>
      )}
      <div className={classes.ChatTopBar__topBarBottomGradient}></div>
    </>
  )
}
