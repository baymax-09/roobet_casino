import React from 'react'
import { Helmet } from 'react-helmet'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'
import { type GameProviderConfiguration, gamesPerPage } from 'app/constants'

import { RecentlyPlayed } from '../RecentlyPlayed'
import ApolloCacheGameList from './ApolloCacheGameList'

import { useGameListPageStyles } from './GameListPage.styles'

interface GameProviderPageProps {
  config: GameProviderConfiguration
}

const GameProviderPage: React.FC<GameProviderPageProps> = ({ config }) => {
  const { title } = config

  const classes = useGameListPageStyles({})
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const pageTitle = `${translate(title)}`

  return (
    <>
      <Helmet>
        <title>{pageTitle + ' ' + translate('gameList.games')}</title>
        <meta
          name="description"
          content={translate('gameList.providerMetaDesc') + ' ' + pageTitle}
        />
      </Helmet>
      <div className={classes.GameListPage}>
        <div className={classes.Header__container}>
          <Typography
            variant="h5"
            color={uiTheme.palette.common.white}
            fontWeight={uiTheme.typography.fontWeightBold}
            {...(!isTabletOrDesktop && {
              fontSize: '1.5rem',
              lineHeight: '2rem',
            })}
          >
            {`${pageTitle} ${translate('gameList.games')}`}
          </Typography>
        </div>
        <div className={classes.GameListPage__container}>
          <ApolloCacheGameList
            pageSize={gamesPerPage}
            overrideProvider={title}
            useGameListCollateProps={{
              searchProps: {
                searchText: translate('gameList.providerSearch', {
                  provider: title,
                }),
              },
            }}
          />
        </div>
      </div>
      <RecentlyPlayed />
    </>
  )
}

export default React.memo(GameProviderPage)
