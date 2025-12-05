import React from 'react'
import {
  Typography,
  type TypographyProps,
  theme as uiTheme,
} from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

interface BannerTitleProps {
  raffleName: string
  bannerTitleProps?: TypographyProps
}

const getHeaderName = (raffleName: string) => {
  const dollarIndex = raffleName.indexOf('$')

  // Split the text into three parts to grab dollar sign + amount
  const beforeDollar = raffleName.substring(0, dollarIndex).trim()
  const dollarAmount = raffleName
    .substring(dollarIndex, raffleName.indexOf(' ', dollarIndex))
    .trim()
  const afterAmount = raffleName
    .substring(raffleName.indexOf(' ', dollarIndex))
    .trim()

  return (
    <>
      {beforeDollar}{' '}
      <Typography
        component="span"
        variant="inherit"
        fontWeight={uiTheme.typography.fontWeightBlack}
        color={uiTheme.palette.secondary[500]}
      >
        {dollarAmount}
      </Typography>{' '}
      {afterAmount}
    </>
  )
}

export const BannerTitle: React.FC<BannerTitleProps> = ({
  raffleName,
  bannerTitleProps,
}) => {
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <Typography
      position="relative"
      component="span"
      variant={isTabletOrDesktop ? 'h4' : 'h5'}
      color={uiTheme.palette.common.white}
      fontWeight={uiTheme.typography.fontWeightBlack}
      flexGrow={1}
      {...bannerTitleProps}
    >
      {getHeaderName(raffleName)}
    </Typography>
  )
}
