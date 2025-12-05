import React from 'react'
import { Helmet } from 'react-helmet'
import {
  Typography,
  ListItemText,
  List,
  theme as uiTheme,
} from '@project-atl/ui'

import {
  useCurrencyFormatter,
  useDialogsLinkUpdate,
  useIsLoggedIn,
  useTranslate,
} from 'app/hooks'
import { Skeleton } from 'mrooi'
import { type DialogProps } from 'app/types'
import { useKOTH } from 'app/components'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useKOTHDialogStyles } from './KOTHDialog.styles'

interface KOTHDialogProps {
  DialogProps: DialogProps
}

export const KOTHDialog: React.FC<KOTHDialogProps> = ({ DialogProps }) => {
  const classes = useKOTHDialogStyles()
  const exchangeAndFormatCurrency = useCurrencyFormatter()

  const translate = useTranslate()

  const isLoggedIn = useIsLoggedIn()

  const { minBet, whichRoo } = useKOTH()

  useDialogsLinkUpdate()

  return (
    <>
      <Helmet title={translate('freePlayDialog.title')} />
      <DialogWithBottomNavigation
        className={classes.KOTHDialog}
        maxWidth="sm"
        fullWidth
        title={
          whichRoo === 'astro'
            ? translate('kothDialog.astroTitle')
            : translate('kothDialog.kingTitle')
        }
        showCloseInTitle={true}
        handleClose={DialogProps.onClose}
        {...DialogProps}
      >
        <div className={classes.KOTHDialogContent}>
          {whichRoo ? (
            <>
              <Typography
                variant="h5"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBlack}
              >
                {whichRoo === 'astro'
                  ? translate('kothDialog.astroTitle')
                  : translate('kothDialog.kingTitle')}
              </Typography>
              <Typography variant="body2" color={uiTheme.palette.neutral[400]}>
                {whichRoo === 'astro'
                  ? translate('kothDialog.astroBody1')
                  : translate('kothDialog.kingBody1')}
              </Typography>
              <div className={classes.ContentContainer}>
                <Typography
                  fontSize="18px"
                  lineHeight="26px"
                  color={uiTheme.palette.common.white}
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {whichRoo === 'astro'
                    ? translate('kothDialog.astroSubtitle1')
                    : translate('kothDialog.kingSubtitle1')}
                </Typography>
                <Typography
                  variant="body2"
                  color={uiTheme.palette.neutral[400]}
                >
                  {whichRoo === 'astro'
                    ? translate('kothDialog.astroBody2', {
                        minimumWager: exchangeAndFormatCurrency(minBet, '0,0'),
                      })
                    : translate('kothDialog.kingBody2', {
                        minimumWager: exchangeAndFormatCurrency(minBet, '0,0'),
                      })}
                </Typography>
              </div>
              <div className={classes.ContentContainer}>
                <Typography
                  fontSize="18px"
                  lineHeight="26px"
                  color={uiTheme.palette.common.white}
                  fontWeight={uiTheme.typography.fontWeightBold}
                >
                  {translate('kothDialog.subtitle2')}
                </Typography>
                <List
                  sx={{
                    listStyleType: 'disc',
                    paddingLeft: uiTheme.spacing(2),
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{
                      display: 'list-item',
                      color: uiTheme.palette.neutral[400],
                      variant: 'body2',
                    }}
                  >
                    {translate('kothDialog.bulletPoint1')}
                  </ListItemText>
                  {whichRoo === 'king' && (
                    <ListItemText
                      primaryTypographyProps={{
                        display: 'list-item',
                        color: uiTheme.palette.neutral[400],
                        variant: 'body2',
                      }}
                    >
                      {translate('kothDialog.kingExtraBulletPoint')}
                    </ListItemText>
                  )}
                  <ListItemText
                    primaryTypographyProps={{
                      display: 'list-item',
                      color: uiTheme.palette.neutral[400],
                      variant: 'body2',
                    }}
                  >
                    {translate('kothDialog.bulletPoint2')}
                  </ListItemText>
                  <ListItemText
                    primaryTypographyProps={{
                      display: 'list-item',
                      color: uiTheme.palette.neutral[400],
                      variant: 'body2',
                    }}
                  >
                    {translate('kothDialog.bulletPoint3')}
                  </ListItemText>
                </List>
              </div>
            </>
          ) : (
            <>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={uiTheme.typography.h5.lineHeight}
              />
              <Skeleton variant="rectangular" width="100%" height={80} />
              <Skeleton variant="rectangular" width="100%" height={26} />
              <Skeleton variant="rectangular" width="100%" height={60} />
              <Skeleton variant="rectangular" width="100%" height={26} />
              <Skeleton variant="rectangular" width="100%" height={140} />
            </>
          )}
        </div>
      </DialogWithBottomNavigation>
    </>
  )
}
