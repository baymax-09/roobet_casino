import React from 'react'
import { Button, InputField, theme as uiTheme } from '@project-atl/ui'
import { Form, Formik } from 'formik'
import { InputAdornment } from '@mui/material'

import { api, isApiError } from 'common/util'
import {
  useTranslate,
  useCurrencyFormatter,
  useCurrencyDisplay,
  useCurrencyUnexchange,
} from 'app/hooks'
import { useToasts } from 'common/hooks'
import { truncateCurrency } from 'app/util'

import { ChatDrawer } from './ChatDrawer'

import { useRainDrawerStyles } from './RainDrawer.styles'

interface RainDrawerProps {
  buttonText: string
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
}

export const RainDrawer: React.FC<RainDrawerProps> = ({
  buttonText,
  open,
  setOpen,
  setErrorMessage,
}) => {
  const classes = useRainDrawerStyles()
  const { toast } = useToasts()
  const translate = useTranslate()
  const formatCurrency = useCurrencyFormatter()
  const unexchangeCurrency = useCurrencyUnexchange()
  const displayCurrencyExchange = useCurrencyDisplay()

  const onSubmit = async ({ amount }: { amount: number }) => {
    try {
      await api.post('/rain/create', {
        amount,
        countdown: 1,
        duration: 1,
      })

      toast.success(translate('rainDialog.success'))
      setOpen(false)
      setErrorMessage('')
    } catch (err) {
      setOpen(false)
      if (isApiError(err)) {
        setErrorMessage(err.response ? err.response.data : err.message)
      }
    }
  }

  const validateForm = ({ amount }: { amount: number }) => {
    const errors: { amount?: string } = {}

    if (!amount || amount < 2) {
      errors.amount = translate('rainDialog.convertedMinAmountText', {
        convertedMin: formatCurrency(2),
      })
    }

    return errors
  }

  return (
    <ChatDrawer
      title={translate('rainDialog.startRain')}
      setOpen={setOpen}
      open={open}
    >
      <Formik
        enableReinitialize
        initialValues={{ amount: 2 }}
        onSubmit={onSubmit}
        validate={validateForm}
        validateOnChange={false}
      >
        {({ values, errors, setValues }) => {
          const { currencySymbol, exchangedAmount: displayAmount } =
            displayCurrencyExchange(values.amount)

          return (
            <Form className={classes.RainDrawer}>
              <div className={classes.InputContainer}>
                <InputField
                  className={classes.InputContainer__amount}
                  type="number"
                  label={translate('rainDialog.amount')}
                  name="amount"
                  value={truncateCurrency(displayAmount, 2)}
                  onChange={({ target: { value } }) => {
                    const parsedAmount = parseFloat(value)
                    const backConvertedAmount = unexchangeCurrency(parsedAmount)
                    setValues({ ...values, amount: backConvertedAmount })
                  }}
                  error={!!errors.amount}
                  startAdornment={
                    <InputAdornment
                      disableTypography
                      position="start"
                      sx={{
                        color: 'neutral.300',
                      }}
                    >
                      {currencySymbol}
                    </InputAdornment>
                  }
                  inputProps={{
                    style: { marginLeft: 0 },
                    min: 0,
                  }}
                  fullWidth={true}
                  bottomMessage={
                    errors.amount
                      ? errors.amount
                      : translate('rainDialog.convertedMinAmountText', {
                          convertedMin: formatCurrency(2),
                        })
                  }
                  bottomMessageProps={{
                    ...(!errors.amount
                      ? { color: uiTheme.palette.neutral[400] }
                      : {}),
                    fontWeight: 500,
                  }}
                />
              </div>
              <div className={classes.RainDrawer__buttonContainer}>
                <Button
                  label={buttonText}
                  variant="contained"
                  color="primary"
                  size="extraLarge"
                  fullWidth
                  type="submit"
                />
              </div>
            </Form>
          )
        }}
      </Formik>
    </ChatDrawer>
  )
}
