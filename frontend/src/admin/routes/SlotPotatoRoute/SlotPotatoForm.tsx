import React, { useState } from 'react'
import { useMutation } from '@apollo/client'
import { Button, Paper, Tab, Tabs, TextField } from '@mui/material'
import moment, { type Moment } from 'moment'

import { DateTimePicker, TitleContainer } from 'mrooi'
import {
  SlotPotatoCreateMutation,
  SlotPotatoUpdateMutation,
  SlotPotatoQuery,
  type SlotPotatoQueryResponse,
  type SlotPotato,
  type SlotPotatoGame,
} from 'admin/gql'
import { coerceDateToUTCString, invertDateUTCOffset } from 'common/util'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'
import { useAccessControl } from 'admin/hooks'

import { GamesDataTable, SelectedGames } from './'

import { useSlotPotatoFormStyles } from './SlotPotatoForm.styles'

export interface SlotPotatoFormProps {
  isEdit: boolean
  onCompleted: () => void
  slotPotatoFormValues?: SlotPotato
}

const CreateButtonActions = withRulesAccessController(
  ['slot_potato:create'],
  Button,
)
const UpdateButtonActions = withRulesAccessController(
  ['slot_potato:update'],
  Button,
)

export const SlotPotatoForm: React.FC<SlotPotatoFormProps> = ({
  isEdit,
  slotPotatoFormValues,
  onCompleted,
}) => {
  const classes = useSlotPotatoFormStyles()
  const { toast } = useToasts()
  const now = moment().toISOString()

  const defaultStartDate =
    isEdit && slotPotatoFormValues?.startDateTime
      ? invertDateUTCOffset(
          moment(slotPotatoFormValues.startDateTime),
        ).toISOString()
      : now
  const defaultSelectedGames =
    isEdit && slotPotatoFormValues?.games ? slotPotatoFormValues.games : []
  const defaultGameDuration =
    isEdit && slotPotatoFormValues?.gameDuration
      ? slotPotatoFormValues.gameDuration
      : 60 * 60000

  const [startDateTime, setStartDateTime] = useState(defaultStartDate)
  const [selectedGames, setSelectedGames] = useState(defaultSelectedGames)
  const [gameDurationInMinutes, setGameDuration] = useState(
    defaultGameDuration / 60000,
  )
  const [tpGamesTab, setTpGamesTab] = useState('add')
  const [hasChanges, setHasChanges] = useState(false)
  const { hasAccess: hasSlotPotatoAccess } = useAccessControl([
    'slot_potato:read',
  ])

  const handleError = ({ message }) => {
    toast.error(message)
  }

  const [slotPotatoCreate] = useMutation(SlotPotatoCreateMutation, {
    onError: handleError,
    onCompleted: () => {
      toast.success('Slot Potato Created')
      onCompleted()
    },
    update: (cache, { data }) => {
      const newSlotPotatoFromResponse = data?.slotPotatoCreate
      const existingSlotPotatoes: SlotPotatoQueryResponse | null =
        cache.readQuery({
          query: SlotPotatoQuery,
        })

      if (!existingSlotPotatoes) {
        toast.error('useMutation - No existing slot potatoes')
        return
      }

      cache.writeQuery({
        query: SlotPotatoQuery,
        data: {
          slotPotatoes: [
            ...existingSlotPotatoes.slotPotatoes,
            newSlotPotatoFromResponse,
          ],
        },
      })
    },
  })

  const [slotPotatoUpdate] = useMutation(SlotPotatoUpdateMutation, {
    onError: handleError,
    onCompleted: () => {
      toast.success('Slot Potato Updated')
      onCompleted()
    },
    update: (cache, { data }) => {
      const updatedSlotPotatoFromResponse = data?.slotPotatoUpdate
      const existingSlotPotatoes: SlotPotatoQueryResponse | null =
        cache.readQuery({
          query: SlotPotatoQuery,
        })

      if (!existingSlotPotatoes) {
        toast.error('useMutation - No existing slot potatoes')
        return
      }

      cache.writeQuery({
        query: SlotPotatoQuery,
        data: {
          slotPotatoes: existingSlotPotatoes.slotPotatoes.map(sp => {
            if (sp.id === updatedSlotPotatoFromResponse.id) {
              return updatedSlotPotatoFromResponse
            }

            return sp
          }),
        },
      })
    },
  })

  const sortAndSetSelectedGames = (selectedGames: SlotPotatoGame[]) => {
    const sortedSelectedGames = selectedGames.sort((a, b) => a.order - b.order)

    setSelectedGames(sortedSelectedGames)
    setHasChanges(true)
  }

  const handleSubmit = () => {
    // I'm not 100% on this condition
    const isEditing = isEdit && slotPotatoFormValues
    const payload = {
      variables: {
        data: {
          startDateTime: coerceDateToUTCString(moment(startDateTime)),
          gameDuration: gameDurationInMinutes * 60000,
          games: selectedGames.map(({ game }, idx) => {
            return { gameId: game.id, order: idx + 1 }
          }),
          ...(isEditing ? { id: slotPotatoFormValues.id } : {}),
        },
      },
    }

    if (isEditing) {
      slotPotatoUpdate(payload)
    } else {
      slotPotatoCreate(payload)
    }
  }

  const handleReset = () => {
    setStartDateTime(defaultStartDate)
    setSelectedGames(defaultSelectedGames)
    setGameDuration(defaultGameDuration / 60000)
    setHasChanges(false)
  }

  const handleStartDate = (date: Moment | null) => {
    setStartDateTime(moment(date).toISOString())
    setHasChanges(true)
  }
  const handleSetSelectedGames = (selectedGames: SlotPotatoGame[]) => {
    setSelectedGames(selectedGames)
    setHasChanges(true)
  }
  const handleSetGameDuration = event => {
    setGameDuration(Number(event.target.value))
    setHasChanges(true)
  }

  if (!hasSlotPotatoAccess) {
    return null
  }

  return (
    <TitleContainer
      title={isEdit ? 'Edit Slot Potato' : 'Create Slot Potato'}
      returnTo={{
        title: 'Slot Potatoes',
        link: '/crm/slot-potato',
      }}
      actions={() => []}
    >
      <Paper elevation={4} className={classes.formContainer}>
        <DateTimePicker
          label="Start Date"
          onChange={handleStartDate}
          value={moment(startDateTime)}
        />
        <div className={classes.gameDurationContainer}>
          <TextField
            variant="standard"
            fullWidth
            name="gameDuration"
            type="number"
            value={gameDurationInMinutes}
            onChange={handleSetGameDuration}
            margin="normal"
            label="Game Duration ( In Minutes )"
          />
        </div>

        <Tabs
          value={tpGamesTab}
          onChange={(_, newTab) => {
            setTpGamesTab(newTab)
          }}
          indicatorColor="primary"
        >
          <Tab label="Add More Games" value="add" />
          <Tab
            label={`Selected Games (${selectedGames.length})`}
            value="view"
            disabled={selectedGames.length === 0}
          />
        </Tabs>

        {/* Add More Games */}
        {tpGamesTab === 'add' && (
          <GamesDataTable
            setSelectedGames={handleSetSelectedGames}
            sortAndSetSelectedGames={sortAndSetSelectedGames}
            selectedGames={selectedGames}
          />
        )}

        {/* View Selected Games */}
        {tpGamesTab === 'view' && (
          <SelectedGames
            setSelectedGames={handleSetSelectedGames}
            sortAndSetSelectedGames={sortAndSetSelectedGames}
            selectedGames={selectedGames}
          />
        )}

        <Button
          type="reset"
          className={classes.actionButtons}
          onClick={handleReset}
          variant="contained"
        >
          Reset Form
        </Button>

        {isEdit ? (
          <UpdateButtonActions
            type="submit"
            className={classes.actionButtons}
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={!hasChanges}
          >
            Save
          </UpdateButtonActions>
        ) : (
          <CreateButtonActions
            type="submit"
            className={classes.actionButtons}
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={!hasChanges}
          >
            Create
          </CreateButtonActions>
        )}
      </Paper>
    </TitleContainer>
  )
}
