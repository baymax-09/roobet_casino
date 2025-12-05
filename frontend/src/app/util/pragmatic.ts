import { type DisplayCurrency } from 'common/constants'
import { api } from 'common/util'

interface GetGameConfigResponse {
  gameURL: string
  supportedCurrencies?: DisplayCurrency[]
}

const createUrl = async (
  gameId: string,
  realMode: boolean,
  isMobile: boolean,
  lang = 'en',
  countryCode: string | null,
  displayCurrency: DisplayCurrency,
) => {
  const displayCurrencyCode = displayCurrency.toUpperCase()
  const { gameURL, supportedCurrencies } = await api.get<
    null,
    GetGameConfigResponse
  >('pragmatic/internal/getGameConfig', {
    params: {
      gameId,
      countryCode,
      lang,
      isMobile,
      realMode,
      currency: displayCurrencyCode,
    },
  })
  return { url: gameURL, supportedCurrencies }
}

const pragmatic = { createUrl }

export default pragmatic
