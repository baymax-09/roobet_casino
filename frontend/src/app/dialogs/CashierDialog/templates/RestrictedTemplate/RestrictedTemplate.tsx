import React from 'react'
import {
  Typography,
  type ButtonProps,
  theme as uiTheme,
  Button,
} from '@project-atl/ui'

import { BlockTemplate } from '../BlockTemplate'

import { useRestrictedTemplateStyles } from './RestrictedTemplate.styles'

interface RestrictedTemplateProps {
  icon: React.FunctionComponent<React.SVGAttributes<SVGElement>>
  title: string
  subtext: string
  buttonProps?: ButtonProps
}

export const RestrictedTemplate: React.FC<RestrictedTemplateProps> = ({
  icon: IconComponent,
  title,
  subtext,
  buttonProps,
}) => {
  const classes = useRestrictedTemplateStyles()

  return (
    <BlockTemplate padding={uiTheme.spacing(3)}>
      <div className={classes.RestrictedTemplate}>
        <IconComponent />
        <div className={classes.RestrictedTemplate__title}>
          <Typography
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightBold}
            textAlign="center"
          >
            {title}
          </Typography>
        </div>
        <Typography
          variant="body4"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
          textAlign="center"
        >
          {subtext}
        </Typography>
        {buttonProps && (
          <div className={classes.RestrictedTemplate__button}>
            <Button
              color="tertiary"
              variant="contained"
              size="large"
              {...buttonProps}
            />
          </div>
        )}
      </div>
    </BlockTemplate>
  )
}
