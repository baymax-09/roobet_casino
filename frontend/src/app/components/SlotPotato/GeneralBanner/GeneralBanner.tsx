import React from 'react'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import { theme as uiTheme } from '@project-atl/ui'

import bannerBackground from 'assets/images/slotPotato/bannerBackgroundDesktop.png'
import { getCachedSrc } from 'common/util'

import { LogoAndWordMark, ThreeTimesRewards } from '../Elements'

import { useGeneralBannerStyles } from './GeneralBanner.styles'

interface GeneralBannerProps {
  bannerClassName?: string
  content?: React.ReactNode
  showThreeTimesRewards?: boolean
}

export const GeneralBanner: React.FC<GeneralBannerProps> = ({
  bannerClassName,
  content,
  showThreeTimesRewards = false,
}) => {
  const classes = useGeneralBannerStyles({
    bannerBackgroundImage: getCachedSrc({ src: bannerBackground }),
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <div className={clsx(classes.GeneralBanner, bannerClassName)}>
      <div className={classes.GeneralBanner__innerContent}>
        <LogoAndWordMark />
        {(!isDesktop || showThreeTimesRewards) && <ThreeTimesRewards />}
      </div>
      {content}
    </div>
  )
}
