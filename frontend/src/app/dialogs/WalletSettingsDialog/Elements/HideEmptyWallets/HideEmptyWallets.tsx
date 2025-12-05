import React from 'react'
import { FormControlLabel, Paper } from '@mui/material'
import { Checkbox, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

import { useHideEmptyWalletStyles } from './HideEmptyWallets.styles'

const HideEmptyFormLabel: React.FC = () => {
  const classes = useHideEmptyWalletStyles()
  const translate = useTranslate()
  return (
    <div className={classes.HideEmptyWallets__formText}>
      <Typography
        variant="body2"
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightBold}
      >
        {translate('walletSettings.hideEmpty')}
      </Typography>
      <Typography
        variant="body4"
        color={uiTheme.palette.neutral[400]}
        fontWeight={uiTheme.typography.fontWeightMedium}
      >
        {translate('walletSettings.hideEmptyDescription')}
      </Typography>
    </div>
  )
}

interface HideEmptyWalletsProps {
  defaultValue: boolean
  onChange: (hide: boolean) => void
}

export const HideEmptyWallets: React.FC<HideEmptyWalletsProps> = ({
  defaultValue,
  onChange,
}) => {
  const classes = useHideEmptyWalletStyles()
  const handleChange = event => {
    onChange(event.target.checked)
  }

  return (
    <Paper elevation={0} classes={{ root: classes.HideEmptyWallets }}>
      <FormControlLabel
        label={<HideEmptyFormLabel />}
        control={<Checkbox checked={defaultValue} onChange={handleChange} />}
        classes={{
          root: classes.HideEmptyWallets__form,
          label: classes.HideEmptyWallets__formLabel,
        }}
      />
    </Paper>
  )
}
