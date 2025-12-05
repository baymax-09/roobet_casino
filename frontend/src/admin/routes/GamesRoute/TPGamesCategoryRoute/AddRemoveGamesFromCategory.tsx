import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import { TextField, Button, MenuItem } from '@mui/material'

import { useGamesFromCategoryStyles } from './gamesFromCategory.styles'

export const AddRemoveGamesFromCategory = ({
  gamesInCategory,
  allTpGames,
  onGameListUpdate,
}) => {
  const classes = useGamesFromCategoryStyles()

  const [inputValue, setInputValue] = React.useState('')

  const handleAddGame = (_, tpGame) => {
    if (tpGame) {
      const updatedGames = [...gamesInCategory, tpGame.identifier]
      onGameListUpdate(updatedGames)
      setInputValue('')
    }
  }

  const handleRemoveGame = index => {
    onGameListUpdate(gamesInCategory.filter((_, i) => i !== index))
  }

  const onInputChange = event => {
    setInputValue(event?.target?.value || '')
  }

  return (
    <div className={classes.List__root}>
      <Autocomplete
        onChange={handleAddGame}
        inputValue={inputValue}
        onInputChange={onInputChange}
        options={allTpGames}
        getOptionLabel={option => option.identifier || ''}
        renderInput={params => (
          <TextField {...params} label="Add Game" variant="outlined" />
        )}
        disabled={allTpGames.length === 0}
        isOptionEqualToValue={(a, b) => a.identifier === b.identifier}
        renderOption={(prop, option) => (
          <MenuItem {...prop} key={option.identifier} value={option.identifier}>
            {option.identifier}
          </MenuItem>
        )}
      />
      <div className={classes.Dropdown__gameAmount}>
        {gamesInCategory.length} Games in category
      </div>
      <div className={classes.List__categorizedGames}>
        {gamesInCategory.map((identifier, index) => (
          <div key={identifier} className={classes.List__gameListRow}>
            <div>{identifier}</div>
            <Button color="primary" onClick={() => handleRemoveGame(index)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
