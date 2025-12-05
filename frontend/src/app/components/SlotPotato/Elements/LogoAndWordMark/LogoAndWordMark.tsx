import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import slotPotatoLogo from 'assets/images/slotPotato/slotPotatoWordMark.svg'
import { useTranslate } from 'app/hooks'

import { useLogoAndWordMarkStyles } from './LogoAndWordMark.styles'

export const LogoAndWordMark: React.FC = () => {
  const classes = useLogoAndWordMarkStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <div className={classes.LogoAndWordMark}>
      <img
        className={classes.SlotPotatoWordMark}
        alt="slot-potato-logo"
        src={slotPotatoLogo}
      />
      <Typography
        className={classes.BeFastBeFurious}
        variant={isTabletOrDesktop ? 'body2' : 'body1'}
        fontWeight={uiTheme.typography.fontWeightBlack}
        color={uiTheme.palette.common.white}
      >
        {translate('slotPotato.beFastBeFurious')}
      </Typography>
    </div>
  )
}
