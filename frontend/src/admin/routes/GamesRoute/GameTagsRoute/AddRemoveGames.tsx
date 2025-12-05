import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import { TextField, Button } from '@mui/material'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useQuery } from '@apollo/client'

import { TPGamesGetAllQuery } from 'admin/gql'

import { useAddRemoveGamesStyles } from './AddRemoveGames.styles'

export const AddRemoveGames = ({ tag, onGameListUpdate, reorder }) => {
  const tagGames = tag.games || []
  const classes = useAddRemoveGamesStyles()

  const [inputValue, setInputValue] = React.useState('')
  const [gameData, setGameData] = React.useState<
    Array<{ id: string; identifier: string }>
  >([])

  const { data: gameResponse, loading } = useQuery<{
    tpGamesGetAll: Array<{ id: string; identifier: string }>
  }>(TPGamesGetAllQuery, {
    variables: {
      approvalStatus: 'approved',
      disabledGames: false,
    },
  })

  React.useEffect(() => {
    if (gameResponse) {
      setGameData(gameResponse.tpGamesGetAll)
    }
  }, [gameResponse, setGameData])

  const handleAddGame = (_, tpGame) => {
    if (tpGame) {
      onGameListUpdate([...tagGames, tpGame])
      setInputValue('')
    }
  }

  const handleRemoveGame = index => {
    onGameListUpdate(tagGames.filter((_, i) => i !== index))
  }

  const onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return
    }

    const newGames = reorder(
      tagGames,
      result.source.index,
      result.destination.index,
    )
    onGameListUpdate(newGames)
  }

  const handleInputChange = event => {
    setInputValue(event?.target?.value || '')
  }

  return (
    <div className={classes.root}>
      <Autocomplete
        onChange={handleAddGame}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        options={gameData}
        getOptionLabel={option => option.identifier || ''}
        renderInput={params => (
          <TextField {...params} label="Add Game" variant="outlined" />
        )}
        disabled={loading}
        isOptionEqualToValue={(a, b) => a.identifier === b.identifier}
        disableClearable={true}
      />
      <div className={classes.gameGroup}>
        {!tagGames.length && <div>No games in this group (yet).</div>}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, _) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tagGames.map(({ id: tpGamesId }, index) => (
                  <Draggable
                    draggableId={tpGamesId}
                    index={index}
                    key={tpGamesId}
                  >
                    {(provided, _) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={tpGamesId}
                        className={classes.gameListRow}
                      >
                        <div>{tagGames[index].identifier || ''}</div>
                        <Button
                          className={classes.removeButton}
                          onClick={() => handleRemoveGame(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  )
}
