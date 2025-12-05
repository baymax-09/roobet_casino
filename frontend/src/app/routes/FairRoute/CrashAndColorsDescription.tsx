import React from 'react'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

interface CAndCDescProps {
  isCrash?: boolean
}

export const CrashAndColorsDescription: React.FC<CAndCDescProps> = ({
  isCrash = false,
}) => {
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <Typography
      variant={isTabletOrDesktop ? 'body1' : 'body2'}
      fontWeight={uiTheme.typography.fontWeightMedium}
      color={uiTheme.palette.neutral[400]}
    >
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('crashAndColorsDescription.titleDesc')}
      </Typography>
      <ul>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('crashAndColorsDescription.serverSeed')}
          </Typography>{' '}
          - {translate('crashAndColorsDescription.providedByUs')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('crashAndColorsDescription.clientSeed')}
          </Typography>{' '}
          -{' '}
          {isCrash
            ? translate('crashAndColorsDescription.crashETHBlock')
            : translate('crashAndColorsDescription.colorsETHBlock')}
        </li>
      </ul>
      <p>
        {translate('crashAndColorsDescription.weTakeA')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('crashAndColorsDescription.serverSeed')}{' '}
        </Typography>
        {isCrash
          ? translate('crashAndColorsDescription.crashDesc1')
          : translate('crashAndColorsDescription.colorsDesc1')}
      </p>
      <p>
        {translate('crashAndColorsDescription.the')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('crashAndColorsDescription.clientSeed')}{' '}
        </Typography>
        {isCrash
          ? translate('crashAndColorsDescription.crashDesc2')
          : translate('crashAndColorsDescription.colorsDesc2')}
      </p>
      <p>{translate('crashAndColorsDescription.desc3')}</p>
    </Typography>
  )
}
