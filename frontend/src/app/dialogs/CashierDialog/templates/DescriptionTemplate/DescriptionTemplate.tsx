import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { useDescriptionTemplateStyles } from './DescriptionTemplate.styles'

interface DescriptionTemplateProps {
  title: string
  subtext?: string
}

export const DescriptionTemplate: React.FC<DescriptionTemplateProps> = ({
  title,
  subtext,
}) => {
  const classes = useDescriptionTemplateStyles()

  return (
    <div className={classes.DescriptionTemplate}>
      <Typography
        variant="body2"
        fontWeight={uiTheme.typography.fontWeightBold}
      >
        {title}
      </Typography>
      {subtext && (
        <Typography
          variant="body4"
          color={uiTheme.palette.neutral[200]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {subtext}
        </Typography>
      )}
    </div>
  )
}
