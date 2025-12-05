import React from 'react'
import {
  Select,
  InputLabel,
  Input,
  MenuItem,
  TextField,
  FormControl,
  FormHelperText,
} from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import { useLazyQuery } from '@apollo/client'
import { type FormikErrors } from 'formik'

import {
  PRAGMATIC_SPIN_AMOUNT_VALUES,
  GAME_PROVIDERS,
} from 'admin/routes/InventoryRoute/HouseInventoryRoute/constants'
import { useToasts } from 'common/hooks'
import {
  type BonusCodeSubmitErrors,
  type BonusCode,
  type TPGamesByAggregatorData,
} from 'admin/types'
import { TPGamesByAggregator } from 'admin/gql'

import { useFreeSpinsTypeSettingsStyles } from './FreeSpinsTypeSettings.styles'

interface FreeSpinsTypeSettingsProps {
  values: BonusCode
  errors: FormikErrors<BonusCodeSubmitErrors>
  handleChange: (e: string | number | React.ChangeEvent<any>) => void
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

export const FreeSpinsTypeSettings = ({
  values,
  errors,
  handleChange,
  setFieldValue,
}: FreeSpinsTypeSettingsProps) => {
  const classes = useFreeSpinsTypeSettingsStyles()
  const { toast } = useToasts()

  const [getGamesByAggregator, { data }] =
    useLazyQuery<TPGamesByAggregatorData>(TPGamesByAggregator, {
      onError: error => {
        toast.error(error.message)
      },
    })

  React.useEffect(() => {
    if (values.typeSettings?.tpGameAggregator) {
      getGamesByAggregator({
        variables: { aggregator: values.typeSettings?.tpGameAggregator },
      })
    }
  }, [values.typeSettings?.tpGameAggregator])

  const gamesByAggregator = data?.tpGamesByAggregator.map(game => {
    return game.identifier
  })

  const getOptionLabel = (game: string) => game ?? ''
  const getOptionsSelected = (option: string, value: string) => option === value
  const renderInput = params => (
    <TextField
      {...params}
      variant="outlined"
      label="TP Games"
      placeholder="TP Games"
    />
  )

  const handleGameChange = (_, game) => {
    setFieldValue('typeSettings.gameIdentifier', game)
  }

  const determineInputLabel = () => {
    if (
      ['softswiss', 'slotegrator'].includes(
        values?.typeSettings?.tpGameAggregator ?? '',
      )
    ) {
      return 'Bet Level'
    }
    return 'Amount'
  }

  const handleAmountChange = <
    T extends string | number,
    TEvent extends { target: { value: T } },
  >(
    event: TEvent,
  ) => setFieldValue('typeSettings.amount', event.target.value)

  const handleProviderChange = <
    T extends string | number,
    TEvent extends { target: { value: T } },
  >(
    event: TEvent,
  ) => setFieldValue('typeSettings.tpGameAggregator', event.target.value)

  return (
    <div className={classes.FreeSpinsTypeSettings}>
      <div className={classes.FreeSpinsTypeSettings__tpGameAggregatorContainer}>
        <div>
          <InputLabel>TP Game Provider</InputLabel>
          <FormControl variant="standard">
            <Select
              variant="standard"
              value={values.typeSettings?.tpGameAggregator}
              name="typeSettings.tpGameAggregator"
              error={!!errors.tpGameAggregator}
              onChange={handleProviderChange}
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
            {errors.tpGameAggregator && (
              <FormHelperText>{errors.tpGameAggregator}</FormHelperText>
            )}
          </FormControl>
        </div>
      </div>
      <Autocomplete
        options={gamesByAggregator ?? []}
        getOptionLabel={getOptionLabel}
        isOptionEqualToValue={getOptionsSelected}
        value={values.typeSettings.gameIdentifier}
        filterSelectedOptions
        renderInput={renderInput}
        onChange={handleGameChange}
      />
      <div className={classes.FreeSpinsTypeSettings__amountContainer}>
        <TextField
          variant="standard"
          type="number"
          name="typeSettings.rounds"
          value={values.typeSettings?.rounds ?? 0}
          error={!!errors.rounds}
          helperText={errors.rounds}
          onChange={handleChange}
          label="Rounds"
          inputProps={{ min: 0 }}
        />
        {values.typeSettings?.tpGameAggregator === 'pragmatic' ? (
          <FormControl
            variant="standard"
            className={classes.FreeSpinsTypeSettings__formControlSpinAmount}
            error={!!errors.amount}
          >
            <InputLabel>Spin Amount</InputLabel>
            <Select
              variant="standard"
              type="number"
              name="typeSettings.amount"
              value={
                values.typeSettings?.amount ?? PRAGMATIC_SPIN_AMOUNT_VALUES[0]
              }
              onChange={handleAmountChange}
              inputProps={{ min: 0 }}
              label="Amount"
            >
              {PRAGMATIC_SPIN_AMOUNT_VALUES.map(value => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </Select>
            {errors.amount && <FormHelperText>{errors.amount}</FormHelperText>}
          </FormControl>
        ) : (
          <TextField
            variant="standard"
            type="number"
            name="typeSettings.amount"
            value={values.typeSettings?.amount ?? 0}
            error={!!errors.amount}
            helperText={errors.amount}
            onChange={handleChange}
            label={determineInputLabel()}
            inputProps={{
              min: 0,
              ...(values.typeSettings.tpGameAggregator !== 'softswiss' && {
                step: 0.1,
              }),
            }}
          />
        )}
      </div>
    </div>
  )
}
