import React from 'react'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { Helmet } from 'react-helmet'
import { theme as uiTheme } from '@project-atl/ui'

import {
  useDialogsClose,
  useDialogsLinkUpdate,
  useIsLoggedIn,
  useTranslate,
} from 'app/hooks'
import { RoowardsContent } from 'app/components'
import { type DialogProps } from 'app/types'
import { LoginOverlay } from 'mrooi'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

interface RoowardsDialogProps {
  DialogProps: DialogProps
  params: Record<string, string>
}

export const useRoowardsDialogStyles = makeStyles(theme =>
  createStyles({
    RoowardsContentContainer: {
      display: 'flex',
      padding: theme.spacing(1.5),
      borderRadius: 12,
      overflow: 'auto',
    },
  }),
)

export const RoowardsDialog: React.FC<RoowardsDialogProps> = React.memo(
  ({ DialogProps, params }) => {
    const classes = useRoowardsDialogStyles()
    const translate = useTranslate()
    const closeDialog = useDialogsClose()
    const isLoggedIn = useIsLoggedIn()

    const isTabletOrDesktop = useMediaQuery(
      () => uiTheme.breakpoints.up('md'),
      {
        noSsr: true,
      },
    )

    useDialogsLinkUpdate()

    // Dialog is only shown on mobile
    React.useEffect(() => {
      if (isTabletOrDesktop) {
        closeDialog()
      }
    }, [isTabletOrDesktop])

    return (
      <>
        {!isLoggedIn && <LoginOverlay dialog="roowards" params={params} />}
        <DialogWithBottomNavigation
          title={translate('roowardsDialog.roowards')}
          fullWidth
          showCloseInTitle
          handleClose={DialogProps.onClose}
          {...DialogProps}
        >
          <Helmet title={translate('roowardsDialog.roowards')} />
          <div className={classes.RoowardsContentContainer}>
            <RoowardsContent />
          </div>
        </DialogWithBottomNavigation>
      </>
    )
  },
)
