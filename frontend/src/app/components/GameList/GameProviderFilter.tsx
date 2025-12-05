import React from 'react'
import { Dropdown, Typography, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { useTranslate } from 'app/hooks'

import { type GameProvider } from './types'

interface GameProviderFilterProps {
  defaultSelected: string[]
  updateSelected: (selected: string[]) => void
  games: any[]
  defaultProviders?: GameProvider[]
  providerWidth: string | number
}

const GameProviderFilter: React.FC<GameProviderFilterProps> = ({
  defaultSelected,
  updateSelected,
  games,
  defaultProviders,
  providerWidth,
}) => {
  const translate = useTranslate()
  const isLargeDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const [busy, setBusy] = React.useState(true)
  const [providers, setProviders] = React.useState<GameProvider[]>(
    defaultProviders ?? [],
  )
  const [selected, setSelected] = React.useState(defaultSelected ?? [])

  React.useEffect(() => {
    if (!defaultProviders && games.length > 0) {
      const providers = {}
      const arr: GameProvider[] = []
      for (let i = 0; i < games.length; i++) {
        providers[games[i].provider] = providers[games[i].provider]
          ? (providers[games[i].provider] += 1)
          : 1
      }
      Object.keys(providers).forEach(function (provider) {
        arr.push({
          name: provider,
          count: providers[provider],
          disabled: false,
        })
      })
      setProviders(arr)
      setBusy(false)
    } else if (!defaultProviders && !games.length) {
      setProviders([])
      setBusy(false)
    } else if (defaultProviders) {
      setProviders(defaultProviders)
      setBusy(false)
    }
  }, [games, defaultProviders])

  const handleOnChange = React.useCallback(
    event => {
      const values = event.target.value

      setSelected(values)
      updateSelected(values)
    },
    [updateSelected],
  )

  const handleClearFilter = React.useCallback(() => {
    setSelected([])
    updateSelected([])
  }, [updateSelected])

  const sortedProviders = providers.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Dropdown
      fullWidth
      sx={{ height: 40 }}
      displayEmpty
      onChange={handleOnChange}
      value={selected}
      label={`${translate('gameListFilter.provider')}:`}
      placeholder=" "
      disabled={busy || sortedProviders.length === 0}
      multiple
      search
      multiSelectText={translate('gameListFilter.multipleSelected')}
      onClearFilterClick={handleClearFilter}
      defaultValue={translate('gameListFilter.all')}
      searchProps={{ placeholder: translate('gameListFilter.searchProvider') }}
      menuOptions={sortedProviders.map(provider => ({
        name: (
          <>
            <Typography
              variant="body2"
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {provider.name}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={uiTheme.typography.fontWeightMedium}
              style={{ marginLeft: 'auto' }}
            >
              {provider.count}
            </Typography>
          </>
        ),
        value: provider.name,
        searchValue: provider.name,
      }))}
      dropdownWidth={providerWidth}
      {...(!isLargeDesktop && { MenuProps: { sx: { height: 485 } } })}
    />
  )
}

export default React.memo(GameProviderFilter)
