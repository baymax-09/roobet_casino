import React from 'react'
import { Helmet } from 'react-helmet'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { MultiBoxInput } from 'app/components'
import { type DialogProps } from 'app/types'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useTwoFactorCodeDialogStyles } from './TwoFactorCodeDialog.styles'

const NUM_BOXES = 6
interface TwoFactorCodeDialogProps {
  DialogProps: DialogProps
  data: {
    onSubmit: (code: string) => Promise<void>
    title?: string
    busy: boolean
  }
}

export const TwoFactorCodeDialog: React.FC<TwoFactorCodeDialogProps> =
  React.memo(({ DialogProps, data }) => {
    const classes = useTwoFactorCodeDialogStyles()
    const translate = useTranslate()
    const { onSubmit, title, busy } = data

    // 2FA
    const [boxValues, setBoxValues] = React.useState<Array<number | null>>(
      Array(NUM_BOXES).fill(null),
    )

    const submitButtonDisabled = boxValues.includes(null) || busy

    const closeDialog = () => {
      DialogProps.onClose()
    }

    const submit2FACode = () => {
      boxValues.join('').length === NUM_BOXES && onSubmit(boxValues.join(''))
    }

    // Reset box values when dialog closes.
    React.useEffect(() => {
      if (!DialogProps.open) {
        setBoxValues(Array(NUM_BOXES).fill(null))
      }
    }, [DialogProps.open])

    return (
      <DialogWithBottomNavigation
        {...DialogProps}
        className={classes.TwoFactorCodeDialog}
        maxWidth="md"
        fullWidth
        showCloseInTitle
        title={title ?? translate('twoFactorConfirm.code')}
        handleClose={closeDialog}
      >
        <Helmet title={translate('twoFactorConfirm.twoFactorAuthentication')} />
        <div className={classes.TwoFactorCodeDialog__content}>
          <Typography
            variant="body2"
            color={uiTheme.palette.neutral[400]}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {translate('twoFactorConfirm.enterSixDigitCode')}
          </Typography>
          <MultiBoxInput
            numBoxes={NUM_BOXES}
            boxValues={boxValues}
            setBoxValues={setBoxValues}
            submit={submit2FACode}
          />

          <div className={classes.ButtonContainer}>
            <Button
              className={classes.ButtonContainer__button}
              color="primary"
              variant="text"
              size="large"
              label={translate('twoFactorConfirm.cancel')}
              onClick={closeDialog}
            />
            <Button
              className={classes.ButtonContainer__button}
              disabled={submitButtonDisabled}
              loading={busy}
              color="primary"
              variant="contained"
              size="large"
              borderOutline
              label={translate('twoFactorConfirm.submit')}
              onClick={() => onSubmit(boxValues.join(''))}
            />
          </div>
        </div>
      </DialogWithBottomNavigation>
    )
  })
