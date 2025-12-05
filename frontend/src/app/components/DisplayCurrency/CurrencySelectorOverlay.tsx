import React from 'react'
import { Typography } from '@mui/material'
import { Button, Dropdown } from '@project-atl/ui'
import { useSelector } from 'react-redux'

import { useTranslate } from 'app/hooks'
import {
  CurrencyIconMap,
  type DisplayCurrency,
  CurrencyArray,
} from 'common/constants'
import { setStorageItem } from 'app/util'

import { useCurrencySelectorStyles } from './CurrencySelectorOverlay.styles'

type SelectedButtonType = 'real' | 'demo'

interface CurrencySelectorOverlayProps {
  supportedCurrencies: DisplayCurrency[] | null
  setShowCurrencyOverlay: React.Dispatch<React.SetStateAction<boolean>>
  onModeClick: (real: boolean, selectedCurrency?: DisplayCurrency) => void
  isMobile: boolean
  gameIdentifier?: string
  setGameCurrency: React.Dispatch<React.SetStateAction<DisplayCurrency>>
}

export const CurrencySelectorOverlay: React.FC<
  CurrencySelectorOverlayProps
> = ({
  supportedCurrencies,
  setShowCurrencyOverlay,
  onModeClick,
  isMobile,
  gameIdentifier,
  setGameCurrency,
}) => {
  const classes = useCurrencySelectorStyles()
  const translate = useTranslate()

  const userId = useSelector(({ user }) => user?.id ?? null)

  const [selectedCurrency, setSelectedCurrency] =
    React.useState<DisplayCurrency>('usd')

  const currenciesToShow = React.useCallback(() => {
    return supportedCurrencies || CurrencyArray
  }, [supportedCurrencies])

  const onRealPlayClick = React.useCallback(
    (mode: SelectedButtonType) => {
      /** Updates the users currency to supported currency for in-game use.
       *  Note: Softswiss works with in-game currencies without the need for updating. */
      if (userId && gameIdentifier && !gameIdentifier.includes('softswiss')) {
        setGameCurrency(selectedCurrency)
        // Store currency in local storage for use next time user visits the game.
        setStorageItem(gameIdentifier, selectedCurrency)
      }

      setShowCurrencyOverlay(false)
      onModeClick(mode === 'real', selectedCurrency)
    },
    [
      setShowCurrencyOverlay,
      onModeClick,
      selectedCurrency,
      userId,
      gameIdentifier,
      setGameCurrency,
    ],
  )

  return (
    <div className={classes.CurrencyOverlay}>
      <div className={classes.CurrencyOverlay__message}>
        <Typography
          variant="body2"
          color="deprecated.textPrimary"
          className={classes.Message__title}
        >
          {translate('currencyOverlay.title')}
        </Typography>
        <Typography variant="body2" className={classes.Message__subTitle}>
          {translate('currencyOverlay.subTitle')}
        </Typography>
      </div>

      <div className={classes.CurrencyOverlay__actions}>
        <div className={classes.Actions__dropdownContainer}>
          <Typography
            variant="body2"
            color="deprecated.textPrimary"
            className={classes.Message__title}
          >
            {translate('currencyOverlay.balanceIn')}
          </Typography>
          <Dropdown
            sx={{ width: '112px', height: '40px' }}
            value={selectedCurrency}
            onChange={event => {
              const value = event.target.value
              if (typeof value === 'string') {
                setSelectedCurrency(value.toLowerCase() as DisplayCurrency)
              }
            }}
            renderValue={() => (
              <div className={classes.Dropdown__valueContainer}>
                <img
                  alt={selectedCurrency}
                  src={CurrencyIconMap[selectedCurrency]}
                />
                <Typography
                  variant="body2"
                  color="deprecated.textPrimary"
                  className={classes.Dropdown__label}
                >
                  {selectedCurrency.toUpperCase()}
                </Typography>
              </div>
            )}
            menuOptions={currenciesToShow().map(currency => ({
              name: (
                <div className={classes.Dropdown__itemsContainer}>
                  <img alt={currency} src={CurrencyIconMap[currency]} />
                  <Typography
                    variant="body2"
                    color="deprecated.textPrimary"
                    className={classes.Dropdown__label}
                  >
                    {currency.toUpperCase()}
                  </Typography>
                </div>
              ),
              value: currency,
            }))}
          />
        </div>

        <div className={classes.ButtonContainer}>
          <Button
            label={translate('currencyOverlay.realPlay')}
            variant="contained"
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            fullWidth
            type="submit"
            onClick={() => onRealPlayClick('real')}
          />
          {isMobile && (
            <Button
              label={translate('currencyOverlay.funPlay')}
              variant="contained"
              color="tertiary"
              size="medium"
              fullWidth
              type="submit"
              onClick={() => onRealPlayClick('demo')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
