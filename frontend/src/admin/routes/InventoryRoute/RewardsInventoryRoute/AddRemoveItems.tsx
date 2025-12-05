import React from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import { TextField, Button } from '@mui/material'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import { type HouseInventoryItem } from '../types'

import { useAddRemoveItemsStyles } from './AddRemoveItems.styles'

interface AddRemoveItemsProps {
  tags: Array<Pick<HouseInventoryItem, 'id' | 'name'>>
  allHouseItems: HouseInventoryItem[]
  houseItemsById: Record<string, HouseInventoryItem>
  onHouseItemListUpdate: (items: Array<Partial<HouseInventoryItem>>) => void
}

export const AddRemoveItems: React.FC<AddRemoveItemsProps> = ({
  tags,
  allHouseItems,
  houseItemsById,
  onHouseItemListUpdate,
}) => {
  const classes = useAddRemoveItemsStyles()

  const houseItems = tags || []

  const [inputValue, setInputValue] = React.useState('')

  const handleAddHouseItem = (
    // React.ChangeEvent<{}> is the type used by MUI for Autocomplete
    // eslint-disable-next-line @typescript-eslint/ban-types
    _: React.ChangeEvent<{}>,
    value: HouseInventoryItem | null,
  ) => {
    if (value) {
      onHouseItemListUpdate([...houseItems, { id: value.id, name: value.name }])
      setInputValue('')
    }
  }

  const handleRemoveHouseItem = (index: number) => {
    onHouseItemListUpdate(houseItems.filter((_, i) => i !== index))
  }

  const reorder = (
    list: Array<Partial<HouseInventoryItem>>,
    startIndex: number,
    endIndex: number,
  ) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
  }

  const onDragEnd = result => {
    // dropped outside the list
    if (!result.destination) {
      return
    }
    const newItems = reorder(
      houseItems,
      result.source.index,
      result.destination.index,
    )
    onHouseItemListUpdate(newItems)
  }
  const onInputChange = event => {
    setInputValue(event?.target?.value || '')
  }
  const getOptionLabel = option => option.name || ''
  const renderInput = params => (
    <TextField {...params} label="Add Inventory Item" variant="outlined" />
  )
  const getOptionsSelected = (a, b) => a.name === b.name

  return (
    <div className={classes.root}>
      <Autocomplete
        onChange={handleAddHouseItem}
        inputValue={inputValue}
        onInputChange={onInputChange}
        options={allHouseItems}
        getOptionLabel={getOptionLabel}
        renderInput={renderInput}
        disabled={allHouseItems.length === 0}
        isOptionEqualToValue={getOptionsSelected}
      />
      <div className={classes.itemGroup}>
        {!houseItems.length && <div>No inventory item(s) in this group.</div>}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, _) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {houseItems.map(({ id: houseItemId }, index) => (
                  <Draggable
                    draggableId={houseItemId}
                    index={index}
                    key={houseItemId}
                  >
                    {(provided, _) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        key={houseItemId}
                        className={classes.itemListRow}
                      >
                        <div>{houseItemsById?.[houseItemId]?.name ?? ''}</div>
                        <Button
                          className={classes.removeButton}
                          onClick={() => handleRemoveHouseItem(index)}
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
