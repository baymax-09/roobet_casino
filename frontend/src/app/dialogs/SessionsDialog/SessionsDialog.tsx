import React from 'react'
import { Helmet } from 'react-helmet'
import { Skeleton } from '@mui/material'
import { useIntercom } from 'react-use-intercom'
import {
  List,
  ListItem,
  Alert,
  Button,
  theme as uiTheme,
  ListItemText,
  Typography,
} from '@project-atl/ui'
import { DeviceNormal, DeviceOnline } from '@project-atl/ui/assets'

import { defaultSocket } from 'app/lib/sockets'
import { endSession } from 'app/lib/user'
import { useTranslate } from 'app/hooks'
import { useAxiosGet } from 'common/hooks'
import { type DialogProps } from 'app/types'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useSessionsDialogStyles } from './SessionsDialog.styles'

interface Session {
  _id: string
  active: boolean
  lastIp: string
  country: string
  lastActive: string
  device: string
  signedOnAt: string
}

export const SessionsDialog: React.FC<{
  DialogProps: DialogProps
}> = ({ DialogProps }) => {
  const classes = useSessionsDialogStyles()
  const translate = useTranslate()
  const { shutdown } = useIntercom()

  const [{ data, loading }, refreshSessions] = useAxiosGet<{
    sessions: Session[]
  }>('account/sessions')

  const sessions = data?.sessions || []

  return (
    <DialogWithBottomNavigation
      {...DialogProps}
      className={classes.SessionDialog}
      maxWidth="md"
      fullWidth
      showCloseInTitle
      title={translate('sessionsDialog.recent')}
      handleClose={DialogProps.onClose}
    >
      <Helmet title={translate('sessionsDialog.recent')} />
      <div className={classes.SessionDialog__content}>
        <Alert severity="info">{translate('sessionsDialog.alert')}</Alert>
        <List className={classes.List}>
          {!loading
            ? sessions.map(session => (
                <ListItem
                  key={session._id}
                  className={classes.ListItem}
                  disableGutters
                  disablePadding
                >
                  {session.active ? (
                    <DeviceOnline
                      iconFill={uiTheme.palette.neutral[300]}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <DeviceNormal
                      iconFill={uiTheme.palette.neutral[300]}
                      width={32}
                      height={32}
                    />
                  )}
                  <ListItemText
                    className={classes.ListItemText}
                    primary={
                      <Typography
                        component="span"
                        variant="body2"
                        fontWeight={uiTheme.typography.fontWeightMedium}
                        color={uiTheme.palette.neutral[100]}
                      >
                        {`${session.lastIp} (${session.country}) - ${session.device}`}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          component="p"
                          variant="body4"
                          fontWeight={uiTheme.typography.fontWeightBold}
                          color={uiTheme.palette.neutral[100]}
                        >
                          {translate('sessionsDialog.lastActive')}
                          <Typography
                            component="span"
                            variant="inherit"
                            fontWeight={uiTheme.typography.fontWeightRegular}
                            color={uiTheme.palette.neutral[400]}
                          >
                            {' '}
                            {session.lastActive}
                          </Typography>
                        </Typography>
                        <Typography
                          component="p"
                          variant="body4"
                          fontWeight={uiTheme.typography.fontWeightBold}
                          color={uiTheme.palette.neutral[100]}
                        >
                          {translate('sessionsDialog.signedOn')}
                          <Typography
                            component="span"
                            variant="inherit"
                            fontWeight={uiTheme.typography.fontWeightRegular}
                            color={uiTheme.palette.neutral[400]}
                          >
                            {' '}
                            {session.signedOnAt}
                          </Typography>
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            : Array.from(
                {
                  length: Math.min(3, sessions.length),
                },
                (_, i) => (
                  <ListItem
                    key={i}
                    className={classes.ListItem}
                    disableGutters
                    disablePadding
                  >
                    <Skeleton variant="rectangular" width={32} height={32} />
                    <ListItemText
                      primary={
                        <Skeleton
                          variant="rectangular"
                          style={{ maxWidth: 305, marginBottom: 4 }}
                          width="100%"
                          height={16}
                        />
                      }
                      secondary={
                        <div>
                          <Skeleton
                            variant="rectangular"
                            style={{ maxWidth: '60%', marginBottom: 4 }}
                            width={192}
                            height={16}
                          />
                          <Skeleton
                            variant="rectangular"
                            style={{ maxWidth: '60%', marginBottom: 4 }}
                            width={170}
                            height={16}
                          />
                        </div>
                      }
                    />
                  </ListItem>
                ),
              )}
        </List>

        <div className={classes.ButtonContainer}>
          <Button
            className={classes.ButtonContainer__button}
            disabled={loading}
            onClick={() => refreshSessions()}
            size="large"
            variant="text"
            label={translate('sessionsDialog.refresh')}
          />
          <Button
            className={classes.ButtonContainer__button}
            disabled={loading}
            onClick={() => {
              shutdown()
              defaultSocket._socket.connect()
              endSession(true)
            }}
            size="large"
            color="tertiary"
            variant="contained"
            label={translate('sessionsDialog.logoutEverywhere')}
          />
        </div>
      </div>
    </DialogWithBottomNavigation>
  )
}
