import { type DisplayCurrency } from 'common/constants'

const EXTERNAL_GAME_FRAME_PATH = '/game.html'
const SOFTSWISS_GAME_FRAME_PATH = '/game-softswiss.html'

export interface ExternalGameFrameResponse {
  url: string
  supportedCurrencies?: DisplayCurrency[]
}

export const getExternalGameFrameUrl = (
  src: ExternalGameFrameResponse,
  softswiss: boolean,
) => {
  const { url, supportedCurrencies } = src

  if (softswiss) {
    const encodedData = encodeURIComponent(JSON.stringify(url))
    return {
      url: `${SOFTSWISS_GAME_FRAME_PATH}?launch_options=${encodedData}`,
      supportedCurrencies,
    }
  }

  // Encode src as base64 string to make the value URL-safe.
  const encodedSrc = btoa(url)

  return {
    url: `${EXTERNAL_GAME_FRAME_PATH}?src=${encodedSrc}`,
    supportedCurrencies,
  }
}
