import React from 'react'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { getCachedSrc } from 'common/util'

import { useDialogCoverWithImageStyles } from './DialogCoverWithImage.styles'

interface DialogCoverWithImageProps {
  writtenContent: React.ReactNode
  rightImage: RoobetAssetPath<'png'>
  rightImageAlt: string
  desktopBackground: RoobetAssetPath<'png'>
  mobileBackground: RoobetAssetPath<'png'>
}

export const DialogCoverWithImage: React.FC<DialogCoverWithImageProps> = ({
  writtenContent,
  rightImage,
  rightImageAlt,
  desktopBackground,
  mobileBackground,
}) => {
  const classes = useDialogCoverWithImageStyles()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const getBlurrySrc = (src: RoobetAssetPath<'png'>) => {
    return getCachedSrc({
      width: 360,
      height: 240,
      src,
      quality: 30,
      blur: 150,
    })
  }
  const getFullResolutionSrc = (src: RoobetAssetPath<'png'>) => {
    return getCachedSrc({
      width: 360,
      height: 240,
      src,
      quality: 85,
      blur: 0,
    })
  }

  const coverImage = isTabletOrDesktop ? desktopBackground : mobileBackground

  return (
    <div className={classes.DialogCoverWithImage}>
      <LazyLoadImage
        className={classes.DialogCoverWithImage__backgroundWrapper}
        src={getFullResolutionSrc(coverImage)}
        alt={rightImageAlt}
        placeholderSrc={getBlurrySrc(coverImage)}
        threshold={0}
      />
      <LazyLoadImage
        className={classes.DialogCoverWithImage__rightImage}
        src={getFullResolutionSrc(rightImage)}
        alt={rightImageAlt}
        placeholderSrc={getBlurrySrc(rightImage)}
        height="100%"
        threshold={0}
      />
      <div className={classes.DialogCoverWithImage__writtenContent}>
        {writtenContent}
      </div>
    </div>
  )
}
