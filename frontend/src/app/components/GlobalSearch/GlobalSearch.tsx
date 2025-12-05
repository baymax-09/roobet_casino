import React from 'react'
import clsx from 'clsx'
import { trackWindowScroll } from 'react-lazy-load-image-component'
import { useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { useKeypress, useTranslate } from 'app/hooks'

import { CategoryButtons, type SearchCategory } from './CategoryButtons'
import { useGlobalSearchStyles } from './'
import { ApolloCacheGameList } from '../GameList'
import { type GameFilters } from '../GameList/ApolloCacheGameList'

const RESULT_LIMIT = 30

interface GlobalSearchProps {
  toggleOpen: (open: boolean) => void
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ toggleOpen }) => {
  const classes = useGlobalSearchStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const searchRef = React.useRef<HTMLInputElement>(null)

  const [open, setOpened] = React.useState(false)
  const [selected, setSelected] = React.useState(0)
  const [selectedCategory, setSelectedCategory] =
    React.useState<SearchCategory>('allGames')
  const [tag, setTag] = React.useState<string>('popular')
  const [searchHasValue, setSearchHasValue] = React.useState(false)

  const listRef = React.useRef<HTMLDivElement>(null)

  const closeSearch = React.useCallback(() => {
    toggleOpen(false)
  }, [toggleOpen])

  const bgClick = React.useCallback(
    event => {
      // Do not close for mobile
      if (
        event.target.className &&
        typeof event.target.className.indexOf === 'function' &&
        isTabletOrDesktop
      ) {
        if (event.target?.getAttribute('id')?.includes('sFC')) {
          closeSearch()
        }
      }
    },
    [closeSearch, isTabletOrDesktop],
  )

  useKeypress(['Escape'], () => {
    closeSearch()
  })

  // Currently doesn't work. Not sure if we even care, but commenting out for now.
  // useKeypress(['ArrowDown'], () => {
  //   if (listRef.current?.[selected + 1]) {
  //     setSelected(selected => selected + 1)
  //   }
  // })

  // useKeypress(['ArrowUp'], event => {
  //   event.preventDefault()
  //   if (listRef.current?.[selected - 1]) {
  //     setSelected(selected => selected - 1)
  //   }
  // })

  // useKeypress(['Enter'], event => {
  //   event.preventDefault()
  //   if (listRef.current?.[selected]) {
  //     listRef.current[selected].click()
  //   }
  // })

  React.useEffect(() => {
    setOpened(true)

    return () => setOpened(false)
  }, [])

  React.useEffect(() => {
    if (listRef.current?.[selected]) {
      const item = listRef.current.children[selected] as HTMLElement
      item.scrollIntoView({ block: 'end', behavior: 'smooth' })
      item.focus()
      searchRef.current?.focus()
    }
  }, [selected])

  React.useEffect(() => {
    setTimeout(() => {
      searchRef.current?.focus()
    }, 200)
  }, [searchRef])

  React.useEffect(() => {
    if (selectedCategory === 'allGames') {
      setTag('popular')
      return
    }
    setTag(selectedCategory)
  }, [selectedCategory, setTag])

  const isSlots = tag === 'slots'
  // Need to switch to grid view for Casino "Lobby" page if user types a value into search input.
  const showAllGames = selectedCategory === 'allGames' && searchHasValue

  const gamesFilter: GameFilters = {
    ...(isSlots
      ? {
          category: 'slots',
        }
      : {
          tagSlugs: showAllGames ? [] : [tag],
        }),
  }

  // Need to switch from pulling in "popular" games to all when user types in search.
  const handleSearchChange = React.useCallback(event => {
    const value = event.target.value
    setSearchHasValue(value.length > 0)
  }, [])

  return (
    <div
      className={clsx(classes.GlobalSearch, {
        [classes.GlobalSearch_open]: open,
        [classes.GlobalSearch_mobile]: !isTabletOrDesktop,
      })}
      onClick={bgClick}
      id="sFC"
    >
      <div className={classes.GlobalSearch__searchResult}>
        <ApolloCacheGameList
          tags={tag}
          gamesFilter={gamesFilter}
          pageSize={RESULT_LIMIT}
          useGameListCollateProps={{
            includeProviderFilter: true,
            searchProps: {
              searchText: translate('casino.searchGames'),
              inputRef: searchRef,
              onChange: handleSearchChange,
              showImFeelingLucky: true,
              imFeelingLuckyProps: {
                onClick: closeSearch,
              },
            },
          }}
          showSpecificGamesWithNoCollate={selectedCategory === 'allGames'}
          collateCloseOnClick={closeSearch}
          gameListViewContainerProps={{
            className: classes.GameListViewContainer,
          }}
          className={classes.GlobalSearch__content}
          hideBottomActions={true}
          onGameThumbnailClick={closeSearch}
        >
          <CategoryButtons
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </ApolloCacheGameList>
      </div>
    </div>
  )
}

export default React.memo(trackWindowScroll(GlobalSearch))
