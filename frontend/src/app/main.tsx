import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider, type Theme } from '@mui/material'
import StylesProvider from '@mui/styles/StylesProvider'
import createGenerateClassName from '@mui/styles/createGenerateClassName'
import { Provider } from 'react-redux'
import { Router } from 'react-router-dom'
import { Helmet, HelmetProvider } from 'react-helmet-async'
import WebFont from 'webfontloader'
import { IntercomProvider } from 'react-use-intercom'
import { ApolloProvider } from '@apollo/client'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { SnackbarProvider } from 'notistack'
import { theme as uiTheme } from '@project-atl/ui'
import { Check2, Close3, Info2, Warning } from '@project-atl/ui/assets'

import { env } from 'common/constants'
import { RoowardToast } from 'app/toasts'
import {
  ConfirmDialogProvider,
  ToastUtils,
  CustomSnackbarContent,
  ToastCloseIcon,
} from 'common/components'
import { AuthNotifications, ErrorBoundary } from 'app/components'
import {
  theme,
  confirmDialogTheme,
  type DeprecatedAppTheme,
} from 'common/theme'
import { GlobalStyles } from 'common/styles'
import {
  history,
  initializeTranslations,
  startup,
  loadUser,
  loadTracking,
} from 'app/util'
import { supportedLngs } from 'app/constants'
import { productApolloClient } from 'app/gql'
import { mountLoaderListener } from 'common/util'

import Routes from './routes'
import { App } from './components/App'
import ErrorFallbackPage from './components/ErrorFallbackPage'
import { store, registerLenientDOMNodeOps } from './util'
import {
  DialogsProvider,
  AppProvider,
  RoowardsProvider,
  NotificationsProvider,
  GamesProvider,
} from './context'
import { KYCVerificationPrompt } from './components/KYCVerificationPrompt'
import { ErrorToast } from './dialogs'
import { initiateGTMFasttrackEventListener } from './util/fasttrackEventListener'
import { PostLoginEffects } from './components/PostLoginEffects'

startup()
registerLenientDOMNodeOps()

const generateClassName = createGenerateClassName({
  productionPrefix: 'roo',
})

const snackbarRef = React.createRef<SnackbarProvider>()

/**
 * This override is required to merge the old theme tokens with the new one.
 * The DefaultTheme type gets picked up be the makeStyles and createStyles API.
 * To be removed when @mui/styles/createStyles and @mui/styles/makeStyles is removed.
 */
declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends DeprecatedAppTheme, Theme {}
}

function render() {
  loadTracking()
  loadUser()
  mountLoaderListener()
  initializeTranslations()
  initiateGTMFasttrackEventListener()

  const MainComponent = (
    <ThemeProvider theme={theme}>
      <StylesProvider generateClassName={generateClassName}>
        <ErrorBoundary fallback={ErrorFallbackPage}>
          <HelmetProvider>
            <Helmet
              defaultTitle="Roobet | Crypto's Fastest Growing Casino"
              titleTemplate="%s - Roobet | Crypto's Fastest Growing Casino"
            >
              {supportedLngs.map(lng => (
                <link
                  key={lng}
                  rel="alternate"
                  hrefLang={lng}
                  href={
                    window.location.origin +
                    window.location.pathname +
                    `?lng=${lng}`
                  }
                />
              ))}
              <meta
                name="description"
                content="Roobet.com Official Website: Roobet Casino is Crypto's Fastest Growing Casino, and it's run by a kangaroo. Hop in, chat with friends and play 4,500+ games!"
              />
            </Helmet>
            <GlobalStyles />
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <ApolloProvider client={productApolloClient}>
                {/*
                 * We can limit the scope of this provider to only the components that need it if it becomes a performance issue.
                 * The advantage to having it here is that it will pre-fetch the data for all routes immediately on load.
                 */}
                <Router history={history}>
                  <Provider store={store}>
                    <SnackbarProvider
                      ref={snackbarRef}
                      Components={{
                        roowardsToast: RoowardToast,
                        dialogToastError: ErrorToast,
                        error: CustomSnackbarContent,
                        success: CustomSnackbarContent,
                        info: CustomSnackbarContent,
                        warning: CustomSnackbarContent,
                      }}
                      iconVariant={{
                        success: <Check2 />,
                        error: <Close3 />,
                        warning: (
                          <Warning iconFill={uiTheme.palette.neutral[900]} />
                        ),
                        info: <Info2 />,
                      }}
                      action={snackbarId => (
                        <ToastCloseIcon
                          snackbarKey={snackbarId}
                          variant="default"
                        />
                      )}
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      <ToastUtils />
                      <AuthNotifications />
                      <PostLoginEffects />
                      <AppProvider>
                        <GamesProvider>
                          <RoowardsProvider>
                            <IntercomProvider
                              appId={env.INTERCOM_APP_ID}
                              autoBoot
                              shouldInitialize={env.NODE_ENV !== 'development'}
                            >
                              <NotificationsProvider>
                                <DialogsProvider>
                                  <ConfirmDialogProvider
                                    theme={confirmDialogTheme}
                                  >
                                    <App>
                                      <Routes />
                                      <KYCVerificationPrompt />
                                    </App>
                                  </ConfirmDialogProvider>
                                </DialogsProvider>
                              </NotificationsProvider>
                            </IntercomProvider>
                          </RoowardsProvider>
                        </GamesProvider>
                      </AppProvider>
                    </SnackbarProvider>
                  </Provider>
                </Router>
              </ApolloProvider>
            </LocalizationProvider>
          </HelmetProvider>
        </ErrorBoundary>
      </StylesProvider>
    </ThemeProvider>
  )
  ReactDOM.render(MainComponent, document.getElementById('root'))
}

WebFont.load({
  google: {
    families: [
      'Roboto:300,400,500,700,900',
      'Open+Sans:800',
      'Black+And+White+Picture:400',
    ],
  },

  active() {
    render()
  },
})
