import React from 'react'
import { InputField, type InputFieldProps } from '@project-atl/ui'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import { useTranslate } from 'app/hooks'

import { ImFeelingLucky, type ImFeelingLuckyProps } from '../ImFeelingLucky'

export interface GameListSearchProps extends InputFieldProps {
  updateSearchTerm: (searchTerm: string) => void
  showImFeelingLucky?: boolean
  imFeelingLuckyProps?: ImFeelingLuckyProps
  searchText?: string
}

export const useGameListSearchStyles = makeStyles(() =>
  createStyles({
    SearchInput: {
      width: '100%',
      height: '40px',
    },
  }),
)

export const GameListSearch: React.FC<GameListSearchProps> = ({
  updateSearchTerm,
  showImFeelingLucky = false,
  imFeelingLuckyProps,
  searchText,
  ...props
}) => {
  const classes = useGameListSearchStyles()
  const translate = useTranslate()
  const [searchTerm, setSearchTerm] = React.useState('')

  const handleSearchChange = React.useCallback(event => {
    const searchValue = event.target.value
    setSearchTerm(searchValue)
    if (props.onChange) {
      props.onChange(event)
    }
  }, [])

  React.useEffect(() => {
    updateSearchTerm(searchTerm)
  }, [searchTerm, updateSearchTerm])

  return (
    <InputField
      fullWidth
      size="small"
      color="primary"
      className={classes.SearchInput}
      placeholder={searchText ?? translate('globalSearch.searchForAllGames')}
      value={searchTerm}
      type="search"
      {...(showImFeelingLucky && {
        endAdornment: (
          <div>
            <ImFeelingLucky {...imFeelingLuckyProps} />
          </div>
        ),
      })}
      {...props}
      onChange={handleSearchChange}
    />
  )
}
