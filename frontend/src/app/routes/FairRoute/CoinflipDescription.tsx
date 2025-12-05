import React from 'react'
import { Typography, Link, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

export const CoinflipDescription: React.FC = () => {
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const listItems = React.useMemo(
    () => [
      {
        title: translate('fairRouteCoinflip.author'),
        description: translate('fairRouteCoinflip.authorDesc'),
      },
      {
        title: translate('fairRouteCoinflip.competitor'),
        description: translate('fairRouteCoinflip.competitorDesc'),
      },
      {
        title: translate('fairRouteCoinflip.authorServerSeed'),
        description: translate('fairRouteCoinflip.authorServerSeedDescription'),
      },
      {
        title: translate('fairRouteCoinflip.authorClientSeed'),
        description: translate('fairRouteCoinflip.authorClientSeedDescription'),
      },
      {
        title: translate('fairRouteCoinflip.authorNonce'),
        description: translate('fairRouteCoinflip.authorNonce'),
      },
      {
        title: translate('fairRouteCoinflip.competitorServerSeed'),
        description: translate(
          'fairRouteCoinflip.competitorServerSeedDescription',
        ),
      },
      {
        title: translate('fairRouteCoinflip.competitorClientSeed'),
        description: translate(
          'fairRouteCoinflip.competitorClientSeedDescription',
        ),
      },
      {
        title: translate('fairRouteCoinflip.competitorNonce'),
        description: translate('fairRouteCoinflip.competitorNonce'),
      },
    ],
    [],
  )

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
        {translate('fairRouteCoinflip.coinflipTitleDescription')}
      </Typography>
      <ul>
        {listItems.map(item => (
          <li>
            <Typography
              component="span"
              variant={isTabletOrDesktop ? 'body1' : 'body2'}
              fontWeight={uiTheme.typography.fontWeightBold}
              color={uiTheme.palette.neutral[200]}
            >
              {item.title}
            </Typography>{' '}
            - {item.description}
          </li>
        ))}
      </ul>
      <p>
        {translate('fairRouteDescription.youWillGetAn')}{' '}
        <Typography
          component="span"
          variant={isTabletOrDesktop ? 'body1' : 'body2'}
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.neutral[200]}
        >
          {translate('fairRouteCoinflip.encryptedHash')}
        </Typography>{' '}
        (
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
        {translate('fairRouteCoinflip.coinflipThe')}{' '}
        {translate('fairRouteDescription.clientSeed')}{' '}
        {translate('fairRouteCoinflip.youProvideUs')}
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
