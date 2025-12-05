import React from 'react'

import GameListSort from './GameListSort'
import GameProviderFilter from './GameProviderFilter'
import { GameListSearch, type GameListSearchProps } from './GameListSearch'

export interface useGameListCollateArgs {
  defaultSort?: string
  defaultFilters?: { providers: any[] }
  includeRecommendedSort?: boolean
  sortWidth?: string | number
  providerWidth?: string | number
  searchProps?: Omit<GameListSearchProps, 'updateSearchTerm'>
  includeProviderFilter?: boolean
  includeSortFilter?: boolean
  includeSearchFilter?: boolean
}

export const useGameListCollate = ({
  defaultSort = 'recommended',
  defaultFilters = { providers: [] },
  includeRecommendedSort = false,
  sortWidth = '100%',
  providerWidth = '100%',
  searchProps = { showImFeelingLucky: false, imFeelingLuckyProps: {} },
  includeProviderFilter = true,
  includeSortFilter = true,
}: useGameListCollateArgs) => {
  const [state, setState] = React.useState({
    filters: defaultFilters,
    sort: defaultSort,
    ascending: false,
    searchTerm: '',
  })

  const updateSort = (sort: string) => {
    setState(prev => ({ ...prev, sort }))
  }

  const updateAscending = (ascending: boolean) => {
    setState(prev => ({ ...prev, ascending }))
  }

  const updateProviders = providers => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        providers,
      },
    }))
  }

  const updateSearchTerm = (searchTerm: string) => {
    setState(prev => ({
      ...prev,
      searchTerm,
    }))
  }
  const filterRef = React.useRef(({ games, defaultProviders }) => <></>)
  const sortRef = React.useRef(() => <></>)

  React.useEffect(() => {
    sortRef.current = () => {
      return (
        <GameListSort
          defaultSort={defaultSort}
          updateSort={updateSort}
          updateAscending={updateAscending}
          includeRecommendedSort={includeRecommendedSort}
          sortWidth={sortWidth}
        />
      )
    }
  }, [includeRecommendedSort, defaultSort, sortWidth])

  React.useEffect(() => {
    filterRef.current = ({ games, defaultProviders }) => {
      return (
        <GameProviderFilter
          defaultSelected={state.filters.providers}
          updateSelected={updateProviders}
          games={games}
          defaultProviders={defaultProviders}
          providerWidth={providerWidth}
        />
      )
    }
  }, [providerWidth])

  const searchRef = React.useRef(() => (
    <GameListSearch updateSearchTerm={updateSearchTerm} {...searchProps} />
  ))

  // Update search ref if placeholder text changes
  React.useEffect(() => {
    if (searchProps) {
      searchRef.current = () => (
        <GameListSearch updateSearchTerm={updateSearchTerm} {...searchProps} />
      )
    }
  }, [searchProps.searchText])

  return {
    collate: state,
    GameProviderFilter: includeProviderFilter ? filterRef.current : null,
    GameListSort: includeSortFilter ? sortRef.current : null,
    GameListSearch: searchRef.current,
  }
}
