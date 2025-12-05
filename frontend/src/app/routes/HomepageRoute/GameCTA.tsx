import React from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { useGameCTAStyles } from './GameCTA.styles'

export interface HomepageGameImageCTAConfig {
  /**
   * The id of the image. This is used to identify the image in the DOM.
   * you could use this to apply styles to the image using CSS.
   * [data-image-id="id"]
   */
  id?: string
  src: string
  style?: React.CSSProperties
}
export interface HomepageGameCTAConfig {
  title: string
  subTitle: string
  to: string
  gameIdentifier: string
  background: HomepageGameImageCTAConfig
  /**
   * The first image positions relatively and the rest are absolute
   * images positioned relative to the first image.
   */
  images: HomepageGameImageCTAConfig[]
}
export type HomepageGameCTAConfigs = HomepageGameCTAConfig[]

interface GameProps extends HomepageGameCTAConfig {}

const GameCTA: React.FC<GameProps> = ({
  title,
  subTitle,
  to,
  background,
  images,
  gameIdentifier,
}) => {
  const classes = useGameCTAStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <Link to={to} className={clsx(classes.root, `${gameIdentifier}-game`)}>
      <div className={classes.imageContainer} aria-hidden>
        {background && (
          <div
            className={classes.background}
            style={{
              ...background.style,
              backgroundImage: `url(${background.src})`,
            }}
          />
        )}
        <div className={classes.floatingContainer}>
          {images &&
            images.map((image, i) => (
              <img
                src={image.src}
                key={i}
                alt=""
                className={classes.image}
                data-image-id={image.id}
                style={{
                  ...image.style,
                }}
              />
            ))}
        </div>
      </div>
      <div className={classes.GameCTATextContainer}>
        <Typography
          className={classes.GameCTAText_title}
          variant={isTabletOrDesktop ? 'h5' : 'h6'}
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {translate(title)}
        </Typography>
        <Typography
          className={classes.GameCTAText_subTitle}
          variant="body1"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate(subTitle)}
        </Typography>
      </div>
    </Link>
  )
}

export default React.memo(GameCTA)
