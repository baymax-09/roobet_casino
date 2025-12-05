import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

import { useWalletSettingsHeaderStyles } from './WalletSettingsHeader.styles'

export const WalletSettingsHeader: React.FC = () => {
  const classes = useWalletSettingsHeaderStyles()
  const translate = useTranslate()

  return (
    <header className={classes.WalletSettingsHeader}>
      <Typography
        variant="body2"
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightBold}
      >
        {translate('walletSettings.headerTitle')}
      </Typography>
      <Typography
        variant="body4"
        color={uiTheme.palette.neutral[200]}
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        {translate('walletSettings.headerSubtitle')}
      </Typography>
    </header>
  )
}
