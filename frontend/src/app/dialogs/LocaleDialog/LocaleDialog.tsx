import React from 'react'
import { DialogContent, List, MenuItem, Typography } from '@mui/material'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'

import { Dialog } from 'mrooi'
import { useTranslate } from 'app/hooks'
import { setLocale } from 'app/lib/user'
import { localizations } from 'app/constants'

import { useLocaleDialogStyles } from './LocaleDialog.styles'

export const LocaleDialog = ({ DialogProps, params }) => {
  const translate = useTranslate()
  const { i18n } = useTranslation()
  const classes = useLocaleDialogStyles()
  const activeCode = i18n.language

  const handleClick = async locale => {
    await setLocale(locale)
    i18n.changeLanguage(locale)
    DialogProps.onClose()
  }

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      {...DialogProps}
      classes={{ paper: classes.LocaleDialog }}
    >
      <Helmet title={translate('navMenu.changeLang')} />

      <DialogContent classes={{ root: classes.LocaleDialog__dialogContent }}>
        <div className={classes.DialogContent__header}>
          <Typography variant="h6" classes={{ h6: classes.Header__message }}>
            {translate('navMenu.changeLang')}
          </Typography>
        </div>
        <List classes={{ root: classes.DialogContent_listItems }}>
          <>
            {localizations.map(lang => (
              <MenuItem
                classes={{ root: classes.ListItems__item }}
                key={lang.code}
                value={lang.code}
                selected={activeCode === lang.code}
                dense
                onClick={async () => handleClick(lang.code)}
              >
                <Typography variant="h6">{lang.lang}</Typography>
              </MenuItem>
            ))}
          </>
        </List>
      </DialogContent>
    </Dialog>
  )
}
