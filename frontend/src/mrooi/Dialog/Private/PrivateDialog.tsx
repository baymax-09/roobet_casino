import React from 'react'

import { DialogTitle, Dialog, LoginOverlay } from 'mrooi'
import { useTranslate } from 'app/hooks'

const PrivateDialogView = ({ DialogProps, ...args }) => {
  const translate = useTranslate()
  const isLoggedIn = args.isLoggedIn
  const params = { ...args }

  return (
    <div>
      <Dialog {...args}>
        <DialogTitle light compact dark onClose={() => DialogProps.onClose}>
          {translate('rainDialog.startRain')}
        </DialogTitle>
        {!isLoggedIn && <LoginOverlay dialog="auth" params={params} />}
      </Dialog>
    </div>
  )
}

export const PrivateDialog = React.memo(PrivateDialogView)
