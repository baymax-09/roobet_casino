import React from 'react'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { useBlockedDepositTabStyles } from './BlockedDepositTab.styles'

interface BlockedDepositTabProps {
  logo: string
  message: React.ReactNode
}

export const BlockedDepositTab: React.FC<BlockedDepositTabProps> = ({
  logo,
  message,
}) => {
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const classes = useBlockedDepositTabStyles({ isDesktop })

  return (
    <div className={classes.BlockedDepositTab}>
      <img
        className={classes.BlockedDepositTab__logo}
        alt="restricted-logo"
        src={logo}
      />
      <div className={classes.BlockedDepositTab__message}>{message}</div>
    </div>
  )
}
