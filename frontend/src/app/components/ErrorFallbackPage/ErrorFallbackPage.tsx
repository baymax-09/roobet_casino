import React from 'react'
import clsx from 'clsx'
import { Box, Typography } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { useErrorFallbackPageStyles } from './ErrorFallbackPage.styles'

const ErrorFallbackPage: React.FC = () => {
  const classes = useErrorFallbackPageStyles()
  const translate = useTranslate()

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
            color: 'common.white',
            fontWeight: 'fontWeightBold',
            mb: 0.5,
          }}
        >
          {translate('disabled.errorFallbackHeader')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'gray.light' }}>
          {translate('disabled.errorFallback')}
        </Typography>
      </Box>
    </div>
  )
}

export default React.memo(ErrorFallbackPage)
