import React from 'react'
import { Typography, Link, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

export const FairRouteDescription: React.FC<{ plinko?: boolean }> = ({
  plinko = false,
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
      paddingBottom="0px !important"
    >
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('fairRouteDescription.titleDesc')}
      </Typography>
      <ul>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteDescription.serverSeed')}
          </Typography>{' '}
          - {translate('fairRouteDescription.providedByUs')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteDescription.clientSeed')}
          </Typography>{' '}
          - {translate('fairRouteDescription.providedByYou')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteDescription.nonce')}
          </Typography>{' '}
          - {translate('fairRouteDescription.nonceDesc')}
        </li>
        {plinko && (
          <li>
            <Typography
              component="span"
              variant={isTabletOrDesktop ? 'body1' : 'body2'}
              fontWeight={uiTheme.typography.fontWeightBold}
              color={uiTheme.palette.neutral[200]}
            >
              {translate('fairRouteDescription.gameHash')}
            </Typography>{' '}
            - {translate('fairRouteDescription.providedByUs')}
          </li>
        )}
      </ul>
      <p>
        {translate('fairRouteDescription.youWillGetAn')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteDescription.encryptedHash')}
        </Typography>
        {' ('}
        <Link
          color={uiTheme.palette.neutral[400]}
          href="https://support.google.com/google-ads/answer/9004655?hl=en"
          target="_blank"
          rel="noreferrer"
        >
          {
            // eslint-disable-next-line i18next/no-literal-string
          }
          SHA256
        </Link>
        {translate('fairRouteDescription.fairDesc1')}
      </p>
      <p>
        {translate('fairRouteDescription.youProvideUs')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteDescription.clientSeed')}
        </Typography>{' '}
        {translate('fairRouteDescription.fairDesc2')}
      </p>
      <p>
        {translate('fairRouteDescription.fairDesc3')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteDescription.nonce')}
        </Typography>{' '}
        {translate('fairRouteDescription.fairDesc4')}
      </p>
      {plinko && (
        <p>
          {translate('fairRouteDescription.fairDesc13')}{' '}
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteDescription.gameHash')}
          </Typography>{' '}
          {translate('fairRouteDescription.fairDesc14')}
        </p>
      )}
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('fairRouteDescription.fairDesc5')}
      </Typography>
      <ul>
        <li>{translate('fairRouteDescription.fairDesc6')}</li>
        <li>{translate('fairRouteDescription.fairDesc7')}</li>
        <li>{translate('fairRouteDescription.fairDesc8')}</li>
        <li>{translate('fairRouteDescription.fairDesc9')}</li>
      </ul>
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('fairRouteDescription.fairDesc10')}
      </Typography>
      <ol>
        <li>{translate('fairRouteDescription.fairDesc11')}</li>
        <li>{translate('fairRouteDescription.fairDesc12')}</li>
      </ol>
    </Typography>
  )
}
