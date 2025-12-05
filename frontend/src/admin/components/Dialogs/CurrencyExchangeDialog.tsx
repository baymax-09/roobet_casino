import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Switch,
} from '@mui/material'
import clsx from 'clsx'

import { useUser } from 'common/hooks'
import { CashCurrencySymbols } from 'common/constants/currencyDisplay'
import { truncateCurrency } from 'app/util'

import { useCurrencyExchangeDialogStyles } from './CurrencyExchangeDialog.styles'

const selectorCurrencyMap = Object.entries(CashCurrencySymbols)

const convertCurrency = (
  amount: number,
  convertTo: string,
  user,
  direction: boolean,
): number => {
  const exchangeRates = user.exchangeRates
  const selectedCurrency = exchangeRates[convertTo]
  if (isNaN(amount)) {
    return NaN
  }
  if (selectedCurrency) {
    const convertedAmount = direction
      ? amount * selectedCurrency.rate
      : amount / selectedCurrency.rate
    if (!amount) {
      return 0.0
    }
    return truncateCurrency(convertedAmount, 3)
  }
  if (!amount) {
    return 0.0
  }
  return amount
}

interface CurrencyExchangeDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export const CurrencyExchangeDialog: React.FC<CurrencyExchangeDialogProps> = ({
  open,
  setOpen,
}) => {
  const classes = useCurrencyExchangeDialogStyles()
  const [amount, setAmount] = React.useState<string | null>('0')
  const [currency, setCurrency] = React.useState('usd')
  const [direction, setDirection] = React.useState<boolean>(false)

  const toggleDirection = () => {
    setDirection(!direction)
  }
  const user = useUser()

  return (
    <Dialog
      classes={{ paper: classes.CurrencyExchange }}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      open
      onClose={() => setOpen(false)}
    >
      {/* Changing the header background color to help relay the currenct directon */}
      <DialogTitle
        style={{ backgroundColor: direction ? '#8a73ba' : 'white' }}
        classes={{ root: classes.CurrencyExchange__header }}
      >
        <Typography variant="h4" className={classes.CurrencyExchange__heading}>
          Currency Exchange
        </Typography>

        <div className={classes.Header__modeToggle}>
          <Typography variant="h6" className={classes.Header__textAlignment}>
            Convert
          </Typography>

          <div className={classes.ModeToggle__toggleGroup}>
            <Typography variant="body2">to</Typography>
            <Switch
              checked={direction}
              onChange={toggleDirection}
              classes={{
                thumb: classes.ModeToggle__toggleGroupSwitch,
              }}
            />
            <Typography variant="body2">from</Typography>
          </div>
        </div>
      </DialogTitle>

      <DialogContent classes={{ root: classes.CurrencyExchange__paper }}>
        {/* Input field for currency to be converted */}
        <TextField
          label={`Amount(${direction ? currency : 'usd'})`}
          type="tel"
          value={amount}
          onChange={event => setAmount(event.target.value)}
          variant="outlined"
          className={classes.CurrencyExchange__textFieldBase}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
          InputProps={{
            startAdornment: `${
              direction ? CashCurrencySymbols[currency] : '$'
            }`,
          }}
        ></TextField>

        {/* Selector for the desired currency */}
        <TextField
          select
          label="Currency"
          value={currency}
          onChange={event => setCurrency(event.target.value)}
          variant="outlined"
          className={clsx(
            classes.CurrencyExchange__textFieldBase,
            classes.CurrencyExchange__currencySelector,
          )}
        >
          {selectorCurrencyMap.map(currencyPair => (
            <MenuItem key={currencyPair[0]} value={currencyPair[0]}>
              {`${currencyPair[1]}: ${currencyPair[0]}`}
            </MenuItem>
          ))}
        </TextField>

        {/* Result field for the converted currency */}
        <TextField
          label={`Amount(${direction ? 'usd' : currency})`}
          type="text"
          variant="outlined"
          value={convertCurrency(
            Number(amount || 0),
            currency,
            user,
            direction,
          )}
          className={classes.CurrencyExchange__textFieldBase}
          InputProps={{
            startAdornment: `${
              direction ? '$' : CashCurrencySymbols[currency]
            }`,
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
