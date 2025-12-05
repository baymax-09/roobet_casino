import React from 'react'
import { RadioGroup, Radio, useMediaQuery } from '@mui/material'
import { Typography, theme as uiTheme } from '@project-atl/ui'

import { type DisplayCurrency } from 'common/constants'
import {
  CurrencyIconMap,
  DisplayCurrencies as supportedCurrencies,
} from 'common/constants/currencyDisplay'

import { useCurrencyDisplayFormStyles } from './CurrencyDisplayForm.styles'

interface CurrencyFormLabelProps {
  currency: DisplayCurrency
  checked?: boolean
}

const CurrencyFormLabel: React.FC<CurrencyFormLabelProps> = ({
  currency,
  checked,
}) => {
  const classes = useCurrencyDisplayFormStyles({ checked })
  return (
    <div className={classes.CurrencyLabel__pill}>
      <img
        alt={currency}
        src={CurrencyIconMap[currency]}
        className={classes.CurrencyLabel__symbolIcon}
      />
      <Typography
        variant="body2"
        color={uiTheme.palette.common.white}
        fontWeight={uiTheme.typography.fontWeightMedium}
        classes={{ root: classes.CurrencyLabel__currency }}
      >
        {currency.toUpperCase()}
      </Typography>
    </div>
  )
}

interface CurrencyDisplayFormProps {
  defaultValue: DisplayCurrency
  onChange: (currency: DisplayCurrency) => void
}

export const CurrencyDisplayForm: React.FC<CurrencyDisplayFormProps> = ({
  defaultValue,
  onChange,
}) => {
  const classes = useCurrencyDisplayFormStyles({})
  const handleChange = event => {
    onChange(event.target.value)
  }

  const tiny = useMediaQuery(() => uiTheme.breakpoints.down(350))

  return (
    <RadioGroup
      aria-label="Supported display currencies"
      name="supportedCurrencies"
      classes={{ root: classes.CurrencyDisplayForm__radioGroup }}
      value={defaultValue}
    >
      {supportedCurrencies.map((currency, idx) => {
        return (
          <Radio
            value={currency}
            style={{ backgroundColor: 'transparent' }}
            onChange={handleChange}
            disableTouchRipple={true}
            icon={<CurrencyFormLabel currency={currency} />}
            checkedIcon={
              <CurrencyFormLabel currency={currency} checked={true} />
            }
            classes={{ root: classes.RadioGroup__radio }}
          />
        )
      })}
    </RadioGroup>
  )
}
