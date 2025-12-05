import { useEffect } from 'react'
import { CssBaseline } from '@mui/material'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { ApolloProvider } from '@apollo/client'
import { createStore } from 'redux'
import { I18nextProvider } from 'react-i18next'

import { store } from 'app/util'
import { AppProvider, DialogsProvider } from 'app/context'
import { productApolloClient } from 'app/gql'
import { reducers } from 'app/reducers'
import 'common/icons'

import { CustomThemeProvider } from './utils/CustomThemeProvider'
import i18n from './utils/i18n'

// https://storybook.js.org/docs/react/essentials/toolbars-and-globals
const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', title: 'English' },
        { value: 'es', title: 'Spanish' },
        { value: 'pt', title: 'Portuguese' },
        { value: 'fr', title: 'French' },
        { value: 'sr', title: 'Serbia' },
        { value: 'tr', title: 'Turkish' },
        { value: 'ar', title: 'Arabic' },
        { value: 'cs', title: 'Czech' },
        { value: 'hi', title: 'Hindi' },
        { value: 'ja', title: 'Japanese' },
        { value: 'fil', title: 'Filipino' },
        { value: 'fa', title: 'Persian' },
        { value: 'id', title: 'Indonesian' },
        { value: 'fi', title: 'Finnish' },
        { value: 'zh', title: 'Chinese' },
        { value: 'vi', title: 'Vietnamese' },
        { value: 'th', title: 'Thai' },
        { value: 'ko', title: 'Korean' },
        { value: 'ru', title: 'Russian' },
      ],
      dynamicTitle: true,
    },
  },
  theme: {
    name: 'Theme',
    description: 'Theme for the components',
    defaultValue: 'app',
    toolbar: {
      icon: 'circlehollow',
      items: [
        { value: 'app', icon: 'circlehollow', title: 'App' },
        { value: 'ACPLightMode', icon: 'circlehollow', title: 'ACPLightMode' },
        { value: 'ACPDarkMode', icon: 'circle', title: 'ACPDarkMode' },
      ],
      dynamicTitle: true,
    },
  },
}

const reduxMockStore = createStore(
  reducers,
  {
    ...store.getState(),
    user: {
      ...store.getState().user,
    },
    balances: {
      crypto: 0,
      eth: 0,
      ltc: 0,
      cash: 0,
      selectedBalanceType: 'crypto',
    },
    settings: {
      ...store.getState().settings,
      flags: ['cashPayments']
    }
  }
)

// https://storybook.js.org/docs/react/writing-stories/parameters#global-parameters
const decorators = (Story, context) => {
  const { locale } = context.globals
  // When the locale global changes
  // Set the new locale in i18n
  useEffect(() => {
    i18n.changeLanguage(locale)
  }, [locale])

  return (
    <I18nextProvider i18n={i18n}>
      <CustomThemeProvider context={context}>
        <ApolloProvider client={productApolloClient}>
          <Provider store={reduxMockStore}>
            <AppProvider>
              <MemoryRouter>
                <DialogsProvider>
                  <CssBaseline />
                  <Story />
                </DialogsProvider>
              </MemoryRouter>
            </AppProvider>
          </Provider>
        </ApolloProvider >
      </CustomThemeProvider >
    </I18nextProvider >
  )
}

// https://storybook.js.org/docs/react/writing-stories/parameters#global-parameters
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [decorators],
  globalTypes,
}

// When The language changes, set the document direction
i18n.on('languageChanged', (locale) => {
  const direction = i18n.dir(locale)
  document.dir = direction
})

export default preview
