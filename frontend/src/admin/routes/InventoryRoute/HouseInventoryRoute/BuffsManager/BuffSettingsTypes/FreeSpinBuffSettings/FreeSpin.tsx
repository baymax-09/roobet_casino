import React from 'react'
import {
  Select,
  InputLabel,
  Input,
  MenuItem,
  TextField,
  Button,
  FormControl,
  FormHelperText,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useLazyQuery } from '@apollo/client'
import { type FormikErrors } from 'formik'

import { TPGamesByAggregator } from 'admin/gql'
import { Loading } from 'mrooi'
import {
  PRAGMATIC_SPIN_AMOUNT_VALUES,
  GAME_PROVIDERS,
} from 'admin/routes/InventoryRoute/HouseInventoryRoute/constants'
import {
  type HouseInventoryItem,
  type HouseInventoryItemError,
  type FreeSpinGame,
  type FreeSpinTypeError,
  type FreeSpinType,
} from 'admin/routes/InventoryRoute/types'
import { useToasts } from 'common/hooks'
import { type TPGamesByAggregatorData } from 'admin/types'

import { useFreeSpinsBuffSettingsStyles } from './FreeSpinsBuffSettings.styles'

interface FreeSpinProps {
  values: HouseInventoryItem
  errors: FormikErrors<HouseInventoryItemError>
  index: number
  freeSpin: FreeSpinType
  disableRemoveGroup: boolean
  handleChange: (e: string | number | React.ChangeEvent<string>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const FreeSpin = ({
  values,
  errors,
  index,
  freeSpin,
  disableRemoveGroup,
  handleChange,
  setFieldValue,
}: FreeSpinProps) => {
  const classes = useFreeSpinsBuffSettingsStyles()
  const { toast } = useToasts()

  const [getGamesByAggregator, { data, loading }] =
    useLazyQuery<TPGamesByAggregatorData>(TPGamesByAggregator, {
      onError: error => {
        toast.error(error.message)
      },
    })

  React.useEffect(() => {
    if (freeSpin.tpGameAggregator) {
      getGamesByAggregator({
        variables: { aggregator: freeSpin.tpGameAggregator },
      })
    }
  }, [freeSpin.tpGameAggregator])

  const gamesByAggregator = data?.tpGamesByAggregator.map(game => {
    return { identifier: game.identifier, pragmaticGameId: game.gid }
  })

  const handleRemoveGroup = () => {
    // Remove element based on position
    const buffSettings = values.buff.buffSettings
    if ('freeSpins' in buffSettings) {
      const clonedFreeSpins = buffSettings.freeSpins.filter(
        (_, i) => i !== index,
      )
      setFieldValue('buff.buffSettings.freeSpins', clonedFreeSpins)
    }
  }

  const handleGamesChange = (_, games) => {
    setFieldValue(`buff.buffSettings.freeSpins.${index}.games`, games)
  }

  const handleTPGameAggregatorChange = ({ target: { value } }) => {
    setFieldValue(
      `buff.buffSettings.freeSpins.${index}.tpGameAggregator`,
      value,
    )
    // Reset the games when the tp game aggregator value changes
    setFieldValue(`buff.buffSettings.freeSpins.${index}.games`, [])
  }

  const getOptionLabel = (game: FreeSpinGame) => game.identifier ?? ''
  const getOptionsSelected = (option: FreeSpinGame, value: FreeSpinGame) =>
    option.identifier === value.identifier
  const renderInput = params => (
    <TextField
      {...params}
      variant="outlined"
      label="TP Games"
      placeholder="TP Games"
    />
  )

  const handleFieldChange = <
    T extends string | number,
    TEvent extends {
      target: { value: T }
    },
  >(
    event: TEvent,
  ) => handleChange(event.target.value)

  return (
    <div className={classes.freeSpinContainer}>
      <div className={classes.topRowContainer}>
        <div>
          <InputLabel>TP Game Provider</InputLabel>
          <FormControl variant="standard">
            <Select
              variant="standard"
              value={freeSpin.tpGameAggregator}
              name={`buff.buffSettings.freeSpins.${index}.tpGameAggregator`}
              error={
                !!(errors.freeSpins as FreeSpinTypeError)?.[index]
                  ?.tpGameAggregator ?? false
              }
              onChange={handleTPGameAggregatorChange}
              input={<Input />}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 150,
                    width: 250,
                  },
                },
              }}
            >
              {GAME_PROVIDERS.map(gameProvider => (
                <MenuItem key={gameProvider} value={gameProvider}>
                  {gameProvider}
                </MenuItem>
              ))}
            </Select>
            {errors.freeSpins && (
              <FormHelperText>
                {
                  (errors.freeSpins as FreeSpinTypeError)?.[index]
                    ?.tpGameAggregator
                }
              </FormHelperText>
            )}
          </FormControl>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <Autocomplete
          multiple
          options={gamesByAggregator ?? []}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={getOptionsSelected}
          value={freeSpin.games}
          filterSelectedOptions
          renderInput={renderInput}
          onChange={handleGamesChange}
        />
      )}
      <div className={classes.spinValues}>
        <TextField
          variant="standard"
          type="number"
          name={`buff.buffSettings.freeSpins.${index}.numberOfSpins`}
          value={freeSpin.numberOfSpins ?? 0}
          error={
            !!(errors.freeSpins as FreeSpinTypeError)?.[index]?.numberOfSpins ??
            false
          }
          helperText={
            (errors.freeSpins as FreeSpinTypeError)?.[index]?.numberOfSpins
          }
          onChange={handleFieldChange}
          label="Number Of Spins"
          inputProps={{ min: 0 }}
        />
        {freeSpin.tpGameAggregator === 'pragmatic' ? (
          <FormControl
            variant="standard"
            className={classes.formControlSpinAmount}
            error={
              !!(errors.freeSpins as FreeSpinTypeError)?.[index]?.spinAmount ??
              false
            }
          >
            <InputLabel>Spin Amount</InputLabel>
            <Select
              variant="standard"
              type="number"
              name={`buff.buffSettings.freeSpins.${index}.spinAmount`}
              value={freeSpin.spinAmount ?? PRAGMATIC_SPIN_AMOUNT_VALUES[0]}
              onChange={handleFieldChange}
              inputProps={{ min: 0 }}
            >
              {PRAGMATIC_SPIN_AMOUNT_VALUES.map(value => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
            {errors.freeSpins && (
              <FormHelperText>
                {(errors.freeSpins as FreeSpinTypeError)?.[index]?.spinAmount}
              </FormHelperText>
            )}
          </FormControl>
        ) : (
          <TextField
            variant="standard"
            type="number"
            name={`buff.buffSettings.freeSpins.${index}.spinAmount`}
            value={freeSpin.spinAmount ?? 0}
            error={
              !!(errors.freeSpins as FreeSpinTypeError)?.[index]?.spinAmount ??
              false
            }
            helperText={
              (errors.freeSpins as FreeSpinTypeError)?.[index]?.spinAmount
            }
            onChange={handleFieldChange}
            label={
              freeSpin.tpGameAggregator !== 'softswiss' ? 'Amount' : 'Bet Level'
            }
            inputProps={{
              min: 0,
              ...(freeSpin.tpGameAggregator !== 'softswiss' && { step: 0.1 }),
            }}
          />
        )}
      </div>
      <Button
        size="small"
        variant="contained"
        color="secondary"
        disabled={disableRemoveGroup}
        onClick={handleRemoveGroup}
      >
        Remove Group
      </Button>
    </div>
  )
}
