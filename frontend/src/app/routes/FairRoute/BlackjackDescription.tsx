import React from 'react'
import { Typography, Link, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

export const BlackjackDescription: React.FC = () => {
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
        {translate('fairRouteBlackjack.titleDescription')}
      </Typography>
      <ul>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteBlackjack.serverSeedTitle')}
          </Typography>{' '}
          - {translate('fairRouteBlackjack.providedByUs')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteBlackjack.clientSeedTitle')}
          </Typography>{' '}
          - {translate('fairRouteBlackjack.providedByUs')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteBlackjack.gameNonceTitle')}
          </Typography>{' '}
          - {translate('fairRouteBlackjack.gameNonceDescription')}
        </li>
        <li>
          <Typography
            component="span"
            variant={isTabletOrDesktop ? 'body1' : 'body2'}
            fontWeight={uiTheme.typography.fontWeightBold}
            color={uiTheme.palette.neutral[200]}
          >
            {translate('fairRouteBlackjack.actionsHashTitle')}
          </Typography>{' '}
          - {translate('fairRouteBlackjack.actionsHashDescription')} -{' '}
          {translate('fairRouteBlackjack.providedByUs')}
        </li>
      </ul>
      <p>
        {translate('fairRouteBlackjack.youWillGetAn')}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteBlackjack.encryptedHash')}
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
        {translate('fairRouteBlackjack.serverSHA256Outro')}
      </p>
      <p>{translate('fairRouteBlackjack.clientSeedExplained')}</p>
      <p>
        {translate('fairRouteBlackjack.nonceDesc1')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteBlackjack.nonce')}
        </Typography>{' '}
        {translate('fairRouteBlackjack.nonceDesc2')}
      </p>
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('fairRouteBlackjack.verifyExplained')}
      </Typography>
      <ul>
        <li>{translate('fairRouteBlackjack.verifyPoint01')}</li>
        <li>{translate('fairRouteBlackjack.verifyPoint02')}</li>
        <li>{translate('fairRouteBlackjack.verifyPoint03')}</li>
        <li>{translate('fairRouteBlackjack.verifyPoint04')}</li>
      </ul>
      <Typography
        component="span"
        variant={isTabletOrDesktop ? 'body1' : 'body2'}
        fontWeight={uiTheme.typography.fontWeightBold}
        color={uiTheme.palette.neutral[200]}
        display="inline-block"
        paddingBottom={uiTheme.spacing(1.5)}
      >
        {translate('fairRouteBlackjack.verifyFurtherExplained')}
      </Typography>
      <ol>
        <li>{translate('fairRouteBlackjack.verifyFurtherPoint01')}</li>
        <li>{translate('fairRouteBlackjack.verifyFurtherPoint02')}</li>
      </ol>
    </Typography>
  )
}
