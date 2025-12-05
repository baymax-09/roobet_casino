import React from 'react'
import { Skeleton } from '@mui/material'

import { useChatMessageStyles } from './ChatMessage.styles'

const ChatMessageLoader: React.FC = () => {
  const classes = useChatMessageStyles({ username: 'fakeusername' })

  return (
    <div className={classes.ChatMessage}>
      <Skeleton
        className={classes.ChatMessage__loader}
        variant="rectangular"
        width="100%"
        height={15}
      />
      <Skeleton
        className={classes.ChatMessage__loader}
        variant="rectangular"
        width="80%"
        height={15}
      />
    </div>
  )
}

export default React.memo(ChatMessageLoader)
