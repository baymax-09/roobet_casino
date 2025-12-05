import React from 'react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { useMediaQuery, type BoxProps } from '@mui/material'
import { trackWindowScroll } from 'react-lazy-load-image-component'
import {
  Button,
  Close,
  IconButton,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { GameThumbnailSkeletons } from 'app/components/Game'
import { type TPGame, type GameTag } from 'common/types'
import { Slider } from 'mrooi'

import { normalizeGame, GameThumbnail } from '../Game'
import { ImFeelingLucky, type useGameListCollate } from '..'
import { type GameProvider } from './types'
import { NoResults } from '../GlobalSearch/NoResults'
import { GameListViewContainer } from './GameListViewContainer'

import { useGameListViewStyles } from './GameListView.styles'

export interface GameListViewProps {
  gameData: Partial<{
    games: TPGame[]
    tags?: GameTag[]
    viewableGames?: TPGame[] // Overriding the games that will be shown to the user.
  }>
  gameListComponents: ReturnType<typeof useGameListCollate>
  loadingMore?: boolean
  defaultProviders: { providers?: GameProvider[]; loading: boolean }
  children?: React.ReactNode
  customRendering?: React.ReactNode
  overrideLoading?: boolean
  collateCloseOnClick?: () => void
  gameListViewContainerProps?: BoxProps
  onGameThumbnailClick?: () => void
  showCollate?: boolean
  title?: string
  pageSize: number
  tags?: string | null
  hideBottomActions?: boolean
  showImFeelingLucky?: boolean
  type?: string
  path?: string
  preview?: boolean
  className?: string
}

interface ViewAllLinkProps {
  path?: string
  title?: string
  gameCount: number
}

const ViewAllLinkContent: React.FC<ViewAllLinkProps> = ({
  path,
  title,
  gameCount,
}) => {
  const translate = useTranslate()
  const classes = useGameListViewStyles()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  if (!title) {
    return null
  }

  return (
    <div className={classes.GameList__gameTitle}>
      <div className={classes.GameTitle__wrapper}>
        <Typography
          variant="h5"
          color={uiTheme.palette.common.white}
          fontWeight={uiTheme.typography.fontWeightBold}
          {...(!isTabletOrDesktop && {
            fontSize: '1.5rem',
            lineHeight: '2rem',
          })}
        >
          <span>{translate(title)}</span>
        </Typography>
        {gameCount > 0 && path && (
          <span className={classes.ViewAllButton}>
            <Button
              variant="contained"
              color="tertiary"
              size={isTabletOrDesktop ? 'large' : 'small'}
              label={translate('gameList.viewAll')}
            />
          </span>
        )}
      </div>
    </div>
  )
}

const ViewAllLink: React.FC<ViewAllLinkProps> = ({
  path,
  title,
  gameCount,
}) => {
  const classes = useGameListViewStyles()

  // If there is no link path, just display the list title without a link.
  if (!path) {
    return <ViewAllLinkContent title={title} gameCount={gameCount} />
  }
  return (
    <Link className={classes.Tag_linkDecoration} to={`/tag/${path}`}>
      <ViewAllLinkContent title={title} path={path} gameCount={gameCount} />
    </Link>
  )
}

interface GameThumbnailsProps {
  loading: boolean
  pageSize: number
  preview: boolean
  title?: string
  path?: string
  viewableGames: TPGame[]
  onGameThumbnailClick?: () => void
}

export const GameThumbnails: React.FC<GameThumbnailsProps> = ({
  loading,
  pageSize,
  preview,
  title,
  path,
  viewableGames,
  onGameThumbnailClick,
}) => {
  const translate = useTranslate()
  const classes = useGameListViewStyles()

  const ViewableGameThumbnails = React.useMemo(() => {
    return viewableGames.map(game => (
      <GameThumbnail
        key={game.id}
        game={game}
        scrollPosition={trackWindowScroll.scrollPosition}
        onGameThumbnailClick={onGameThumbnailClick}
      />
    ))
  }, [viewableGames])

  if (loading) {
    return (
      <div className={classes.GameList__games}>
        <GameThumbnailSkeletons pageSize={pageSize} />
      </div>
    )
  }

  if (!loading && !preview) {
    return (
      <div className={classes.GameList__games}>{ViewableGameThumbnails}</div>
    )
  }

  return (
    <Slider
      title={title}
      {...(path && { viewAllButtonProps: { path: `/tag/${path}` } })}
      slides={ViewableGameThumbnails}
      slideClassName={classes.GameList_slide}
      slidesClassName={classes.GameList_slides}
      showViewAll={true}
      fullPageSlide
      noSlidesText={
        <div className={classes.GameList_empty}>
          {translate('gameList.noGamesText')}
        </div>
      }
    />
  )
}

const GameListView: React.FC<React.PropsWithChildren<GameListViewProps>> = ({
  title,
  path,
  pageSize,
  showCollate = false,
  preview = false,
  hideBottomActions = false,
  className,
  tags = null,
  type = 'slots',
  gameData,
  showImFeelingLucky = false,
  gameListComponents,
  loadingMore,
  defaultProviders,
  children,
  customRendering,
  overrideLoading = false,
  collateCloseOnClick,
  gameListViewContainerProps,
  onGameThumbnailClick,
}) => {
  const classes = useGameListViewStyles()
  const translate = useTranslate()
  const [allTags, setAllTags] = React.useState<GameTag[]>([])
  const [state, setState] = React.useState<{
    tabIndex: number
    games: TPGame[]
    page: number
    loading: boolean
    maxPages: number
  }>({
    tabIndex: 0,
    games: [],
    page: 1,
    loading: true,
    maxPages: 1,
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'))

  const { collate, GameProviderFilter, GameListSort, GameListSearch } =
    gameListComponents

  // Show loading state if tags have changed
  React.useEffect(() => {
    const reload = () => {
      const { games, tags } = gameData
      setAllTags(tags ?? [])
      const fetchedGames = (() => {
        return (games ?? []).map(game => normalizeGame(game, type)) || []
      })()

      setState(prev => ({
        ...prev,
        games: fetchedGames,
        loading: false,
      }))
    }
    reload()
  }, [setState, gameData, collate.sort, type, tags])

  // Calculate viewable games.
  const [viewableGames, totalGames] = React.useMemo(() => {
    let filtered = state.games.slice(0)

    if (pageSize && showCollate && collate.filters.providers.length) {
      filtered = filtered.filter(game =>
        collate.filters.providers.includes(game.provider),
      )
    }

    // Viewable games may be overwritten if applicable.
    let viewable = gameData.viewableGames ? gameData.viewableGames : filtered

    const total = viewable.length

    if (pageSize) {
      const i = pageSize * state.page
      viewable = viewable.slice(0, i)
    }

    return [viewable, total]
  }, [
    state.games,
    state.page,
    showCollate,
    collate.filters.providers,
    collate.sort,
    pageSize,
    allTags,
  ])

  const showLoadMoreGamesButton =
    !preview && viewableGames.length !== totalGames && !hideBottomActions

  const loading = state.loading || overrideLoading

  return (
    <div
      className={clsx(className, classes.GameListView, {
        [classes.GameList_preview]: preview,
      })}
    >
      {title && !path && !preview && (
        <div className={classes.GameList__gameTitle}>
          <div className={classes.GameTitle__wrapper}>
            <Typography variant="h4">
              <span>{translate(title)}</span>
            </Typography>
          </div>
        </div>
      )}

      {title && path && !preview && (
        <ViewAllLink
          path={path}
          title={title}
          gameCount={viewableGames.length}
        />
      )}

      {showCollate && (
        <div className={classes.GameList__collateContainer}>
          <div className={classes.GameList__collate}>
            {showImFeelingLucky && (
              <div className={classes.Collate__lucky}>
                <ImFeelingLucky />
              </div>
            )}

            <div className={classes.Collate__searchContainer}>
              <GameListSearch />
              {!isDesktop && collateCloseOnClick && (
                <IconButton
                  className={classes.Collate__close}
                  onClick={collateCloseOnClick}
                >
                  <Close />
                </IconButton>
              )}
            </div>

            {isDesktop && collateCloseOnClick && (
              <IconButton
                className={classes.Collate__close}
                onClick={collateCloseOnClick}
              >
                <Close />
              </IconButton>
            )}
            {(GameListSort || GameProviderFilter) && (
              <div className={classes.GameList__collate__sortAndFilter}>
                {GameListSort && <GameListSort />}
                {GameProviderFilter && (
                  <GameProviderFilter
                    games={state.games}
                    defaultProviders={
                      defaultProviders.loading
                        ? undefined
                        : defaultProviders.providers
                    }
                  />
                )}
              </div>
            )}
          </div>
          {children}
        </div>
      )}

      {customRendering || (
        <>
          {!loading && !viewableGames.length && !preview && (
            <div className={classes.GameList_empty}>
              <NoResults customText={translate('gameList.noGamesText')} />
            </div>
          )}

          <GameListViewContainer {...gameListViewContainerProps}>
            <GameThumbnails
              loading={loading}
              pageSize={pageSize}
              preview={preview}
              title={title}
              path={path}
              viewableGames={viewableGames}
              onGameThumbnailClick={onGameThumbnailClick}
            />
          </GameListViewContainer>

          {showLoadMoreGamesButton && (
            <div className={classes.GameList__actions}>
              {/* View more pagination button on full list */}
              <Button
                loading={loadingMore}
                disabled={loadingMore}
                variant="contained"
                color="tertiary"
                size="large"
                onClick={() => {
                  setState(prev => ({ ...prev, page: prev.page + 1 }))
                }}
                label={translate('gameList.loadMoreGames')}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default React.memo(trackWindowScroll(GameListView))
