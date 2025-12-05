import React from 'react'
import { Button, Grid } from '@mui/material'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { type SlotPotatoGame } from 'admin/gql/slotPotato'

import { useSlotPotatoFormStyles } from './SlotPotatoForm.styles'

export interface SelectedGamesProps {
  setSelectedGames: (selectedGames: SlotPotatoGame[]) => void
  sortAndSetSelectedGames: (selectedGames: SlotPotatoGame[]) => void
  selectedGames: SlotPotatoGame[]
}

const reorder = (
  list: SlotPotatoGame[],
  startIndex: number,
  endIndex: number,
) => {
  const result = [...list]
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)

  return result
}

export const SelectedGames: React.FC<SelectedGamesProps> = ({
  setSelectedGames,
  sortAndSetSelectedGames,
  selectedGames,
}) => {
  const classes = useSlotPotatoFormStyles()

  const handleSelectedGameReorder = draggableEvent => {
    if (!draggableEvent.destination) {
      return
    }

    const {
      destination: { index: destination },
      source: { index: source },
    } = draggableEvent
    const reorderedGames = reorder(selectedGames, source, destination)

    sortAndSetSelectedGames(reorderedGames)
  }

  const handleRemoveGame = gameId => {
    const newSelectedGames = selectedGames.filter(
      selectedGame => selectedGame.game.id !== gameId,
    )

    setSelectedGames(newSelectedGames)
  }

  if (selectedGames.length === 0) {
    return <div>No Selected Games</div>
  }

  return (
    <>
      <Grid container spacing={2} className={classes.selectedGamesHead}>
        <Grid xs={4} item>
          Order
        </Grid>
        <Grid xs={4} item>
          Title
        </Grid>
      </Grid>
      <DragDropContext onDragEnd={handleSelectedGameReorder}>
        <Droppable droppableId="droppable">
          {(provided, _) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {selectedGames.map(
                ({ game: { id: tpGamesId, title } }, index) => (
                  <Draggable
                    draggableId={tpGamesId}
                    index={index}
                    key={tpGamesId}
                  >
                    {(provided, _) => (
                      <Grid
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={classes.gridRow}
                        container
                        key={tpGamesId}
                        ref={provided.innerRef}
                      >
                        <Grid xs={4} item className={classes.gridItem}>
                          {index + 1}
                        </Grid>
                        <Grid xs={4} item className={classes.gridItem}>
                          {title}
                        </Grid>
                        <Grid xs={4} item className={classes.gridItem}>
                          <Button onClick={() => handleRemoveGame(tpGamesId)}>
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                  </Draggable>
                ),
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  )
}
