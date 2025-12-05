import React from 'react'
import { Helmet } from 'react-helmet'
import { theme as uiTheme, Typography } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'
import { Redirect, useHistory } from 'react-router'

import { useAppReady, useIsLoggedIn, useTranslate } from 'app/hooks'
import { useApp } from 'app/context'

import {
  GeneralTab,
  PreferencesTab,
  SecurityTab,
  VerificationTab,
} from './tabs'
import { AccountSettingsSideNavigation } from './AccountSettingsSideNavigation'
import { AccountSettingsCategoryButtons } from './AccountSettingsCategoryButtons'
import { ACCOUNT_SETTINGS_GENERAL_LINK } from './constants/accountSettingsLinks'

import { useAccountSettingsRouteStyles } from './AccountSettingsRoute.styles'

const PAGES = [
  {
    key: 'general',
    // t('accountSettings.general')
    name: 'accountSettings.general',
    Component: GeneralTab,
  },
  {
    key: 'security',
    // t('accountSettings.security')
    name: 'accountSettings.security',
    Component: SecurityTab,
  },
  {
    key: 'preferences',
    // t('accountSettings.preferences')
    name: 'accountSettings.preferences',
    Component: PreferencesTab,
  },
  {
    key: 'verification',
    // t('accountSettings.verification')
    name: 'accountSettings.verification',
    Component: VerificationTab,
  },
] as const

const isValidPage = (key: string) => PAGES.some(page => page.key === key)

const getPage = (key: string) => {
  return PAGES.findIndex(page => page.key === key)
}

const AccountSettingsRoute: React.FC = () => {
  const history = useHistory()
  const classes = useAccountSettingsRouteStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isLoggedIn = useIsLoggedIn()
  const isAppReady = useAppReady()

  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })
  const { chatHidden, sideNavigationOpen } = useApp()

  const [page, setPage] = React.useState(() => {
    if (isLoggedIn) {
      const url = new URL(window.location.href)
      const searchParam = new URLSearchParams(url.search).get('page')

      if (searchParam && isValidPage(searchParam)) {
        return getPage(searchParam)
      }

      if (searchParam) {
        history.replace(ACCOUNT_SETTINGS_GENERAL_LINK)
      }
    }
    return getPage('general')
  })

  React.useEffect(() => {
    if (isLoggedIn) {
      const url = new URL(window.location.href)
      const searchParam = new URLSearchParams(url.search).get('page')

      if (searchParam && isValidPage(searchParam)) {
        setPage(getPage(searchParam))
        return
      }

      if (searchParam) {
        history.replace(ACCOUNT_SETTINGS_GENERAL_LINK)
      }
    }
    setPage(getPage('general'))
  }, [window.location.search, isLoggedIn])

  const activePage = React.useMemo(() => PAGES[page], [page])

  const showSideNavigation =
    (isTabletOrDesktop && chatHidden && !sideNavigationOpen) || isDesktop

  if (!isLoggedIn && isAppReady) {
    return <Redirect to="/" />
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <>
      <Helmet
        title={`${translate('accountDialog.account')} - ${translate(
          activePage.name,
        )}`}
      />
      <div className={classes.AccountSettingsRoute}>
        {!showSideNavigation && (
          <AccountSettingsCategoryButtons showActiveButton />
        )}
        <div className={classes.AccountSettingsRouteContainer}>
          <div className={classes.AccountSettings}>
            {showSideNavigation && <AccountSettingsSideNavigation />}
            <div
              className={clsx(classes.AccountSettingsContent, {
                [classes.AccountSettingsContent_noSideNavigation]:
                  !showSideNavigation,
              })}
            >
              <Typography
                variant="h5"
                color={uiTheme.palette.common.white}
                fontWeight={uiTheme.typography.fontWeightBold}
                {...(!isTabletOrDesktop && {
                  fontSize: '1.5rem',
                  lineHeight: '2rem',
                })}
              >
                {translate(activePage.name)}
              </Typography>
              <activePage.Component />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default React.memo(AccountSettingsRoute)
