import React from 'react'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import clsx from 'clsx'

interface NotificationIndicatorProps {
  unreadMessages: number
  hasMrRooMessages?: boolean
}

export const useNotificationIndicatorStyles = makeStyles(() =>
  createStyles({
    NotificationIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      padding: uiTheme.spacing(0.5),
      border: `2px solid ${uiTheme.palette.neutral[900]}`,
      backgroundColor: uiTheme.palette.secondary[500],
      width: '1.25rem',
      height: '1.25rem',
    },

    MrRooMessages: {
      backgroundColor: uiTheme.palette.success[500],
    },
  }),
)

export const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({
  unreadMessages,
  hasMrRooMessages = false,
}) => {
  const classes = useNotificationIndicatorStyles()
  return (
    <div
      className={clsx(classes.NotificationIndicator, {
        [classes.MrRooMessages]: !!hasMrRooMessages,
      })}
    >
      <Typography
        variant="body5"
        fontWeight={uiTheme.typography.fontWeightBlack}
        color={uiTheme.palette.neutral[900]}
      >
        {unreadMessages}
      </Typography>
    </div>
  )
}
