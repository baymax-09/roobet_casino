import React from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import { Typography, LinearProgress, Snackbar, Box } from '@mui/material'

import { logEvent } from 'common/util/logger'
import { useTranslate } from 'app/hooks'

import { useDisabledOverlayStyles } from './DisabledOverlay.styles'

const DisabledOverlay: React.FC = () => {
  const classes = useDisabledOverlayStyles()
  const translate = useTranslate()
  /*
    translate('disabled.maintHeader')
    translate('disabled.maint')
  */
  const disconnected = useSelector(
    ({ settings }) => settings?.disconnected ?? false,
  )
  const disabled = useSelector(({ settings }) => settings?.disabledApp ?? false)

  React.useEffect(() => {
    if (disconnected || disabled) {
      logEvent('Maintenance', { disconnected, disabled }, 'warn')
    }
  }, [disconnected, disabled])

  if (disabled) {
    return (
      <div
        id="maintenance"
        className={clsx(classes.Overlay, classes.Overlay_disabled)}
      >
        <div className={classes.Overlay__logo} />
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{
              color: 'white',
              fontWeight: 'fontWeightBold',
              mb: 0.5,
            }}
          >
            {translate('disabled.maintHeader')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'gray.light' }}>
            {translate('disabled.maint')}
          </Typography>
        </Box>
      </div>
    )
  } else if (disconnected) {
    return (
      <div className={classes.Overlay}>
        <LinearProgress variant="query" color="primary" />

        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={true}
          message={
            <div>
              <Typography style={{ fontWeight: 500 }}>
                {translate('disabled.cantConnectHeader')}
              </Typography>
              <Typography variant="body2">
                {translate('disabled.cantConnect')}
              </Typography>
            </div>
          }
        />
      </div>
    )
  }

  return null
}

export default React.memo(DisabledOverlay)
