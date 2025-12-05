import React from 'react'
import { Card, CardContent } from '@mui/material'
import moment from 'moment'
import { Link } from 'react-router-dom'
import { ChevronRight, Typography, theme as uiTheme } from '@project-atl/ui'
import { type PopupState } from 'material-ui-popup-state/core'

import { type Notification } from 'app/components/Messaging/types'

import { NotificationIcon } from '../NotificationIcon'
import { cardRootStyles, useMessagingStyles } from '../messaging.styles'

interface NotificationCardProps {
  notification: Notification
  popupState?: PopupState
  markAsReadInternal: (id: string) => void
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification: { message, read, createdAt, type, meta, id },
  popupState,
  markAsReadInternal,
}) => {
  const linkPresent = !!meta?.linkURL
  const classes = useMessagingStyles({ linkPresent, read })

  const handleOnClick = React.useCallback(() => {
    if (!read) {
      markAsReadInternal(id)
    }
    popupState?.close()
  }, [markAsReadInternal, popupState, id])

  return (
    <Card
      onClick={handleOnClick}
      {...(linkPresent && {
        component: Link,
        to: meta.linkURL,
      })}
      sx={cardRootStyles({ linkPresent, read })}
    >
      <CardContent className={classes.container}>
        <div className={classes.content}>
          <NotificationIcon type={type} />
          <div className={classes.copy}>
            <Typography variant="body3">{message}</Typography>
            <Typography
              variant="body5"
              color={uiTheme.palette.neutral[500]}
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {moment(createdAt).fromNow()}
            </Typography>
          </div>
          {linkPresent && (
            <ChevronRight iconFill={uiTheme.palette.neutral[500]} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
