import 'jest-canvas-mock'

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl
    this.onmessage = () => {}
  }

  postMessage(msg) {
    this.onmessage(msg)
  }

  addEventListener(event, operation) {}

  removeEventListener(event, operation) {}
}

// IntersectionObserver isn't available in test environment
const mockIntersectionObserver = jest.fn()

mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})

window.Worker = Worker
window.addEventListener = jest.fn()
window.removeEventListener = jest.fn()
window.IntersectionObserver = mockIntersectionObserver

jest.mock('common/constants', () => ({
  env: {
    ...Object.fromEntries(Object.entries(process.env).map(([key, value]) => [key.replace(/ROOBET_(.+)/, '$1'), value])),
    NODE_ENV: 'test',
  },
}))

jest.mock('app/core/roowards', () => require('../../__mocks__/roowards'))

// @see https://react.i18next.com/misc/testing
jest.mock('react-i18next', () => {
  const useTranslation = () => {
    return {
      t: key => key,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
        language: 'en',
      },
    }
  }
  return {
    useTranslation,

    withTranslation: () => Component => {
      Component.defaultProps = { ...Component.defaultProps, t: key => key }
      return Component
    },

    initReactI18next: {
      type: '3rdParty',
      init: () => {},
    },

    Translation: props => {
      const { ns, children } = props

      return children(useTranslation)
    },

    Trans: ({ children }) => children,
  }
})

jest.mock('../../src/app/gql/apolloClient', () => ({
  productApolloClient: jest.fn(),
}))

jest.mock('app/util/wallet', () => ({ getWalletImageUri: jest.fn(), isPortfolioBalanceType: jest.fn() }))

document.body.innerHTML = '<div id="modalRoot"></div>'
