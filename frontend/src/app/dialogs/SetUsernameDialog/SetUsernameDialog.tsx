import React from 'react'
import {
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  useMediaQuery,
  Alert,
  type DialogProps,
} from '@mui/material'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import { usePopupState } from 'material-ui-popup-state/hooks'
import { theme as uiTheme } from '@project-atl/ui'

import { DialogTitle, ResultPopover, Dialog } from 'mrooi'
import { useTranslate } from 'app/hooks'
import { api, isApiError } from 'common/util'
import { useToasts } from 'common/hooks'
import { store } from 'app/util'
import { setUser } from 'app/reducers/user'

import { useSetUsernameDialogStyles } from './SetUsernameDialog.styles'

interface SetUsernameDialogProps {
  DialogProps: DialogProps & { onClose: () => void }
}

export const SetUsernameDialog: React.FC<SetUsernameDialogProps> = ({
  DialogProps,
}) => {
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const classes = useSetUsernameDialogStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  const resultPopupState = usePopupState({
    variant: 'popover',
    popupId: 'setUsernamePopover',
  })

  const defaultName = useSelector(({ user }) => {
    if (!user) {
      return ''
    }

    return user.name
  })

  const nameRef = React.useRef<HTMLInputElement>()
  const saveUsernameButtonRef = React.useRef<HTMLButtonElement>(null)
  const [hasError, setHasError] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [name, setName] = React.useState(defaultName)

  const onSave = async () => {
    if (busy) {
      return
    }

    if (!name) {
      nameRef.current?.focus()
      return
    }

    setHasError(false)
    setResult(null)
    setBusy(true)

    try {
      await api.post('account/setName', {
        name,
      })

      toast.success(translate('setUsernameDialog.success'))
      store.dispatch(setUser({ mustSetName: false }))
      DialogProps.onClose()
    } catch (err) {
      setHasError(true)
      if (isApiError(err)) {
        setResult(err.response ? err.response.data : err.message)
      }
      resultPopupState.open(saveUsernameButtonRef.current)
    }

    setBusy(false)
  }

  return (
    <Dialog maxWidth="xs" fullWidth disableEscapeKeyDown {...DialogProps}>
      <Helmet title={translate('setUsernameDialog.setUsername')} />
      <DialogTitle>{translate('setUsernameDialog.setUsername')}</DialogTitle>

      <Alert severity="info" className={classes.alert}>
        {translate('setUsernameDialog.setUsernameDesc')}
      </Alert>

      <DialogContent className={classes.content}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              variant="standard"
              autoFocus={isTabletOrDesktop}
              disabled={busy}
              size="small"
              type="text"
              inputRef={nameRef}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              label={translate('setUsernameDialog.username')}
              helperText={translate(
                'setUsernameDialog.yourUsernameIsPermanent',
              )}
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder={translate('setUsernameDialog.enterAUsername')}
              onKeyDown={event => {
                const keyCode = event.keyCode || event.which

                if (keyCode === 13) {
                  onSave()
                }
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          ref={saveUsernameButtonRef}
          disabled={busy}
          color="primary"
          onClick={onSave}
        >
          {translate('setUsernameDialog.saveUsername')}
        </Button>
      </DialogActions>

      <ResultPopover
        popupState={resultPopupState}
        error={hasError}
        message={result}
      />
    </Dialog>
  )
}
