import React from 'react'
import { Link } from 'react-router-dom'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'

import { useProviderThumbnailStyles } from './ProviderThumbnail.styles'

interface ProviderThumbnailProps {
  title: string
  path: string
  logo: string
}

export const ProviderThumbnail: React.FC<ProviderThumbnailProps> = ({
  title,
  path,
  logo,
}) => {
  const classes = useProviderThumbnailStyles()
  const translate = useTranslate()

  return (
    <Link className={classes.Provider} to={path}>
      <img className={classes.ProviderImage} alt={title} src={logo} />
      <div className={classes.ProviderImageWrapper}>
        <Typography
          variant="body2"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate(title)}
        </Typography>
      </div>
    </Link>
  )
}
