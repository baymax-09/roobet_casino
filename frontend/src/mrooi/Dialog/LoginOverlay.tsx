import React from 'react'
import { Button } from '@project-atl/ui'

import { useDialogsOpener, useTranslate } from 'app/hooks'

import { useDialogStyles } from './Dialog.styles'

export interface LoginOverlayProps {
  dialog: string
  params: any
}

/**
 * @todo anywhere that params are being passed in it is spread like ...params.
 * Therefore we are not using it.
 */
const LoginOverlay: React.FC<LoginOverlayProps> = ({ dialog, params }) => {
  const classes = useDialogStyles()
  const translate = useTranslate()

  const openDialog = useDialogsOpener()

  return (
    <div className={classes.loginOverlay}>
      <div>
        <Button
          variant="contained"
          color="primary"
          size="large"
          label={translate('dialogs.loginToContinue')}
          fullWidth
          onClick={() =>
            openDialog('auth', {
              data: {
                continue: {
                  dialog,
                  options: {
                    params,
                  },
                },
              },
            })
          }
        />
      </div>
    </div>
  )
}

export default React.memo(LoginOverlay)
