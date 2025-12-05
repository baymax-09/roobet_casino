import React from 'react'
import { useMediaQuery } from '@mui/material'
import { Helmet } from 'react-helmet'
import {
  type DialogProps,
  Dialog,
  Button,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import regionRestrictedSlotMachine from 'assets/images/slotMachine777.png'
import regionRestrictedBgDesktop from 'assets/images/regionRestrictedBgDesktop.png'
import regionRestrictedBgMobile from 'assets/images/regionRestrictedBgMobile.png'

import { DialogCoverWithImage } from '../DialogCoverWithImage'

import { useRegionRestrictedDialogStyles } from './RegionRestrictedDialog.styles'

export const RegionRestrictedDialog: React.FC<{
  DialogProps: Partial<DialogProps> & { open: boolean }
}> = React.memo(({ DialogProps }) => {
  const classes = useRegionRestrictedDialogStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  return (
    <Dialog
      {...DialogProps}
      className={classes.RegionRestrictedDialog}
      maxWidth="md"
      fullWidth
      showCloseInTitle={false}
      title={translate('regionRestricted.regionRestricted')}
      disableEscapeKeyDown={true}
      // @ts-expect-error ui package is omitting onClose from the DialogProps but it is definitely needed
      // to keep the dialog from being dismissible.
      onClose={() => {}}
    >
      <>
        <Helmet title={translate('regionRestricted.regionRestricted')} />
        <div className={classes.RegionRestricted}>
          <DialogCoverWithImage
            desktopBackground={regionRestrictedBgDesktop}
            mobileBackground={regionRestrictedBgMobile}
            rightImage={regionRestrictedSlotMachine}
            rightImageAlt="Slot Machine"
            writtenContent={
              <div className={classes.RegionRestrictedContainer}>
                <Typography
                  className={classes.RegionRestricted__messageHeading}
                  variant="h4"
                  fontWeight={uiTheme.typography.fontWeightBlack}
                >
                  {translate('regionRestricted.sorryNotAvailableText')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={uiTheme.typography.fontWeightMedium}
                >
                  {translate('regionRestricted.gamingLicenseText')}
                </Typography>
                {isTabletOrDesktop && (
                  <div className={classes.RoobetFunButton__container}>
                    <Button
                      className={classes.RoobetFunButton}
                      fullWidth
                      color="primary"
                      variant="contained"
                      size="large"
                      href="https://roobet.fun/en/?utm_source=roobet&utm_medium=site&utm_campaign=rrmod"
                      // @ts-expect-error ui package has incorrect type
                      target="_blank"
                      label={translate('regionRestricted.startPlaying')}
                    />
                  </div>
                )}
              </div>
            }
          />
        </div>
        {!isTabletOrDesktop && (
          <div className={classes.RoobetFunButton__mobileContainer}>
            <Button
              className={classes.RoobetFunButton}
              fullWidth
              color="primary"
              variant="contained"
              size="extraLarge"
              href="https://roobet.fun/en/?utm_source=roobet&utm_medium=site&utm_campaign=rrmod"
              // @ts-expect-error ui package has incorrect type
              target="_blank"
              label={translate('regionRestricted.startPlaying')}
            />
          </div>
        )}
      </>
    </Dialog>
  )
})
