import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { theme as uiTheme } from '@project-atl/ui'

import snoopDogg from 'assets/images/authDialog/snoopDogg.jpg'
import charlesOliveira from 'assets/images/authDialog/charlesOliveira.jpg'
import rooGalaxy from 'assets/images/authDialog/rooGalaxy.jpg'
import { getCachedSrc } from 'common/util'

const RIGHT_BANNER_IMAGES = [snoopDogg, charlesOliveira, rooGalaxy]

export const useGenericAuthDialogRightBannerStyles = makeStyles(theme =>
  createStyles({
    RightBanner: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
  }),
)

const getBlurrySrc = (src: RoobetAssetPath<'jpg'>) => {
  return getCachedSrc({
    src,
    quality: 1,
    blur: 250,
  })
}

const getFullResolutionSrc = (src: RoobetAssetPath<'jpg'>) => {
  return getCachedSrc({
    src,
    quality: 100,
    blur: 0,
  })
}

const GenericAuthDialogRightBanner: React.FC = () => {
  const imageIndex = Math.floor(Math.random() * RIGHT_BANNER_IMAGES.length)

  const src = RIGHT_BANNER_IMAGES[imageIndex]

  const classes = useGenericAuthDialogRightBannerStyles()
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  if (!isDesktop) {
    return null
  }

  return (
    <LazyLoadImage
      className={classes.RightBanner}
      placeholderSrc={getBlurrySrc(src)}
      src={getFullResolutionSrc(src)}
      alt="Right Banner"
      width="min(90dvh, 50%)"
      threshold={0}
    />
  )
}

export default React.memo(GenericAuthDialogRightBanner)
