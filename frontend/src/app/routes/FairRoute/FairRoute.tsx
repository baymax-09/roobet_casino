import React from 'react'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'
import { Tabs, Tab, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate, useFeatureFlags } from 'app/hooks'

import { BlackjackFair } from './BlackjackFair'
import { CoinflipFair } from './CoinflipFair'
import { CrashFair } from './CrashFair'
import { DiceFair } from './DiceFair'
import { HotboxFair } from './HotboxFair'
import { MinesFair } from './MinesFair'
import { PlinkoFair } from './PlinkoFair'
import { RouletteFair } from './RouletteFair'
import { TowersFair } from './TowersFair'

import { useFairRouteStyles } from './FairRoute.styles'

const FairRouteView: React.FC = () => {
  const classes = useFairRouteStyles()
  const translate = useTranslate()
  const [selected, setSelected] = React.useState(0)
  const { allowed: coinflipEnabled } = useFeatureFlags(['housegames:coinflip'])
  const { allowed: blackjackEnabled } = useFeatureFlags([
    'housegames:blackjack',
  ])

  const tabs = React.useMemo(
    () => [
      {
        key: 'overview',
        label: translate('fairRoute.overview'),
        component: (
          <div>
            <Typography
              variant="body1"
              fontWeight={uiTheme.typography.fontWeightMedium}
              color={uiTheme.palette.neutral[400]}
            >
              <p>{translate('fairRoute.fairRouteText1')}</p>
              <p>{translate('fairRoute.fairRouteText2')}</p>
              <p>{translate('fairRoute.fairRouteText3')}</p>
              <p>{translate('fairRoute.fairRouteText4')}</p>
              <Typography
                component="span"
                variant="body1"
                fontWeight={uiTheme.typography.fontWeightBold}
                color={uiTheme.palette.neutral[200]}
                display="inline-block"
                paddingTop={uiTheme.spacing(0.5)}
              >
                {translate('fairRoute.fairRouteText5')}
              </Typography>
            </Typography>
          </div>
        ),
      },
      {
        key: 'roulette',
        label: translate('gameList.roulette'),
        component: <RouletteFair />,
        iframeProps: {
          title: 'colorsCode',
          src: 'https://codesandbox.io/embed/roulette-yqqsfy?codemirror=1&view=editor&fontsize=14',
        },
      },
      {
        key: 'crash',
        label: translate('fairRoute.crash'),
        component: <CrashFair />,
        iframeProps: {
          title: 'crashCode',
          src: 'https://codesandbox.io/embed/crash-93kqwr?codemirror=1&view=editor&fontsize=14',
        },
      },
      {
        key: 'dice',
        label: translate('fairRoute.dice'),
        component: <DiceFair />,
        iframeProps: {
          title: 'diceCode',
          src: 'https://codesandbox.io/embed/dice-yqlpw6?codemirror=1&view=editor&fontsize=14',
        },
      },
      {
        key: 'mines',
        label: translate('fairRoute.mines'),
        component: <MinesFair />,
        iframeProps: {
          title: 'minesCode',
          src: ' https://codesandbox.io/embed/mines-4xxw25?codemirror=1&view=editor&fontsize=14',
        },
      },
      {
        key: 'towers',
        label: translate('fairRoute.towers'),
        component: <TowersFair />,
        iframeProps: {
          title: 'towersCode',
          src: 'https://codesandbox.io/embed/towers-g7gnq8?codemirror=1&view=editor&fontsize=14',
        },
      },
      {
        key: 'hotbox',
        label: translate('fairRoute.hotbox'),
        component: <HotboxFair />,
        iframeProps: {
          title: 'crashCode',
          src: 'https://codesandbox.io/embed/hotbox-pd4l4h?codemirror=1&view=editor&fontsize=14',
        },
      },
      // remove FF when coinflip is released
      ...(coinflipEnabled
        ? [
            {
              key: 'coinflip',
              label: translate('fairRoute.coinflip'),
              component: <CoinflipFair />,
              iframeProps: {
                title: 'coinflipCode',
                src: 'https://codesandbox.io/embed/coinflip-provably-fair-h367ys?codemirror=1&view=editor&fontsize=14',
              },
            },
          ]
        : []),
      {
        key: 'plinko',
        label: translate('fairRoute.plinko'),
        component: <PlinkoFair />,
        iframeProps: {
          title: 'plinkoCode',
          src: 'https://codesandbox.io/embed/plinko-kkqkvy?codemirror=1&view=editor&fontsize=14',
        },
      },
      ...(blackjackEnabled
        ? [
            {
              key: 'blackjack',
              label: translate('fairRoute.blackjack'),
              component: <BlackjackFair />,
              iframeProps: {
                title: 'blackjackCode',
                src: 'https://codesandbox.io/embed/blackjack-tmkjrr?codemirror=1&view=editor&fontsize=14&file=%2Fsrc%2Findex.js',
                allow:
                  'accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking',
              },
            },
          ]
        : []),
    ],
    [translate, coinflipEnabled, blackjackEnabled],
  )

  const selectedTab = tabs[selected]

  return (
    <div className={classes.FairRoute}>
      <div className={classes.FairRouteContainer}>
        <Helmet>
          <title>{translate('fairRoute.provablyFair')}</title>
        </Helmet>
        <Typography
          variant="h5"
          fontWeight={uiTheme.typography.fontWeightBold}
          color={uiTheme.palette.common.white}
        >
          {translate('fairRoute.provablyFairText')}
        </Typography>
        <div className={classes.FairRouteContent}>
          <Tabs
            variant="scrollable"
            indicatorColor="primary"
            value={selected}
            scrollButtons="auto"
            allowScrollButtonsMobile
            onChange={(_, newTab) => setSelected(newTab)}
          >
            {tabs.map(tab => (
              <Tab
                key={tab.key}
                label={translate(tab.label)}
                sx={{ minWidth: '8rem' }}
              />
            ))}
          </Tabs>
          <div className={classes.ComponentContainer}>
            {selectedTab.component}
            {!!selectedTab.iframeProps && (
              <div className={classes.IFrameContainer}>
                <iframe
                  className={classes.IFrame}
                  {...selectedTab.iframeProps}
                  // Only explicitly here to make linter happy :)
                  title={selectedTab.iframeProps.title}
                  sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
                ></iframe>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const FairRoute = connect()(FairRouteView)
