import React from 'react'
import { Paper } from '@mui/material'
import { useSelector } from 'react-redux'
import { Helmet } from 'react-helmet'
import {
  Dialog,
  IconButton,
  Typography,
  theme as uiTheme,
} from '@project-atl/ui'
import clsx from 'clsx'

import { useDialogsLinkUpdate, useIsLoggedIn, useTranslate } from 'app/hooks'
import { LoginOverlay } from 'mrooi'
import SurveyRedirectIcon from 'assets/icons/newDesignIcons/surveyRedirect.svg'

import { useFreePlayDialogStyles } from './FreePlayDialog.styles'

const LOOTABLY_PLACEMENT_ID = 'ckeh6fi940073zysg0tur8lgg'

export const FreePlayDialog = ({ DialogProps, params }) => {
  const classes = useFreePlayDialogStyles()
  const translate = useTranslate()

  const isLoggedIn = useIsLoggedIn()
  const userId = useSelector(({ user }) => user?.id)

  useDialogsLinkUpdate()

  const iframeUrl = `https://wall.lootably.com/?placementID=${LOOTABLY_PLACEMENT_ID}&sid=${userId}`

  return (
    <>
      <Helmet title={translate('freePlayDialog.title')} />
      <Dialog
        className={classes.FreePlayDialog}
        maxWidth="md"
        fullWidth
        title={translate('freePlayDialog.title')}
        showCloseInTitle={true}
        handleClose={DialogProps.onClose}
        {...DialogProps}
      >
        {!isLoggedIn && <LoginOverlay dialog="freePlay" {...params} />}

        <div
          className={clsx(classes.container, {
            [classes.blurred]: !isLoggedIn,
          })}
        >
          <div className={classes.actions}>
            <div className={classes.actionContainer}>
              <Typography variant="body2" className={classes.surveyTitle}>
                {translate('surveyPanel.surveyTitle')}
              </Typography>
              <Typography
                variant="body4"
                fontWeight={uiTheme.typography.fontWeightMedium}
                color={uiTheme.palette.neutral[200]}
              >
                {translate('surveyPanel.surveyDesc')}
              </Typography>
            </div>
            <IconButton
              className={classes.link}
              disabled={iframeUrl === null}
              component="a"
              size="large"
              color="tertiary"
              // @ts-expect-error ui package has incorrect type
              target="_blank"
              href={iframeUrl}
            >
              <div className={classes.iconContainer}>
                <SurveyRedirectIcon className={classes.redirectIcon} />
              </div>
            </IconButton>
          </div>
          <Paper className={classes.paper}>
            <div className={classes.frame}>
              <iframe
                title={translate('surveyPanel.surveys')}
                src={iframeUrl}
                width="100%"
                height="100%"
              />
            </div>
          </Paper>
        </div>
      </Dialog>
    </>
  )
}
