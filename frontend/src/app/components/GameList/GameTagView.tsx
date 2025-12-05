import React from 'react'
import { Helmet } from 'react-helmet'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { KOTHBanner } from 'app/components'
import { useTranslate } from 'app/hooks'
import { Skeleton } from 'mrooi'

import { type GameListPageProps } from './types'
import { RecentlyPlayed } from '../RecentlyPlayed'

import { useGameListPageStyles } from './GameListPage.styles'

export const GameTagView: React.FC<
  React.PropsWithChildren<GameListPageProps>
> = ({ list, children }) => {
  const {
    title,
    options: { kothPage },
  } = list

  const classes = useGameListPageStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const pageTitle = title ? `${translate(title)}` : undefined

  return (
    <>
      {pageTitle && (
        <>
          <Helmet>
            <title>{pageTitle}</title>
          </Helmet>
        </>
      )}
      <div className={classes.GameListPage}>
        <div className={classes.Header__container}>
          {pageTitle ? (
            <Typography
              variant="h5"
              color={uiTheme.palette.common.white}
              fontWeight={uiTheme.typography.fontWeightBold}
              {...(!isTabletOrDesktop && {
                fontSize: '1.5rem',
                lineHeight: '2rem',
              })}
            >
              {pageTitle}
            </Typography>
          ) : (
            <Skeleton
              width={250}
              height={36}
              animation="wave"
              variant="rectangular"
            />
          )}
        </div>
        {kothPage && (
          <KOTHBanner
            page={kothPage}
            containerClassname={classes.GameListPage__kothContainer}
          />
        )}
        <div className={classes.GameListPage__container}>{children}</div>
      </div>
      <RecentlyPlayed />
    </>
  )
}

export default GameTagView
