interface RawEnvironment {
  NODE_ENV: string
  WS_GQL_PRODUCT_PORT: string
  WS_GQL_ADMIN_PORT: string
  INTERCOM_APP_ID: string
  ONESIGNAL_APP_ID: string
  PRAGMATIC_BASE_URL: string
  PRAGMATIC_BASE_URL_ALT1: string
  PRAGMATIC_STYLENAME: string
  RED_TIGER_BASE_URL: string
  PLAYNGO_BASE_URL: string
  TOTALPROCESSING_URL: string
  PAYMENTIQ_MERCHANT_ID: string
  PAYMENTIQ_ENV: string
  BETBY_BRAND_ID: string
  BETBY_SCRIPT_SRC: string
  SEASONAL: string
  FASTTRACK_CONFIG_URL: string
  DATADOG_APP_ID: string
  DATADOG_CLIENT_TOKEN: string
  DATADOG_SERVICE: string
  DATADOG_ENV: string
  DATADOG_API_KEY: string
  DATADOG_SITE: string
  DATADOG_SAMPLE_RATE: string
  DATADOG_SESSION_SAMPLE_RATE: string
  DATADOG_TRACING_SAMPLE_RATE: string
}

type PopulatedEnvironment = RawEnvironment & {
  API_URL: string
  API_URL_OLD: string
  BASE_URL: string
  SOCKET_URL: string
  WS_API_URL: string
}

const rawEnvironment = (() => {
  let env = {}

  // Parse env from process.
  try {
    if (typeof process.env === 'object') {
      env = { ...env, ...process.env }
    }
  } catch {}

  // Parse env from window, these values have priority.
  try {
    if (typeof window.__env === 'object') {
      env = { ...env, ...window.__env }
    }
  } catch {}

  return env
})()

export const parseRawEnv = (
  rawEnv: Record<string, string | undefined>,
): PopulatedEnvironment => {
  const raw = Object.fromEntries(
    Object.entries(rawEnv).map(([key, value]) => {
      // Cast values to required strings; make the assumption all are present.
      return [key.replace(/ROOBET_(.+)/, '$1'), value as string]
    }),
  ) as unknown as RawEnvironment

  const env: PopulatedEnvironment = {
    ...raw,
    API_URL: '',
    BASE_URL: '',
    SOCKET_URL: '',
    WS_API_URL: '',
    API_URL_OLD: '',
  }

  // This try catch is necessary to stop the Roowards WebWorker from blowing up.
  try {
    const origin = new URL(window.location.origin)
    const wsProtocol = raw.NODE_ENV === 'development' ? 'ws:' : 'wss:'

    // Only take root domain; remove all subdomains.
    const rootHost = origin.host.split('.').slice(-2).join('.')

    // Track the deprecated non-proxy API url for some use cases.
    const nonProxyApiUrl = `${origin.protocol}//api.${rootHost}`

    // These values are computed to support mirrors.
    env.BASE_URL = `${origin}`
    env.WS_API_URL = `${wsProtocol}//${rootHost}`
    env.API_URL = `${origin.protocol}//${rootHost}/_api`

    // These will be replaced eventually, once API_URL_OLD is removed and
    // all house games support an explicit socket URL.
    env.API_URL_OLD = nonProxyApiUrl
    env.SOCKET_URL = nonProxyApiUrl
  } catch {}

  return env
}

export const env = parseRawEnv(rawEnvironment)
