import { config } from 'src/system'

export const YGGDRASIL_PROVIDER_NAME = 'yggdrasil'
export const YGGDRASIL_PROVIDER_NAME_TITLE_CASE = 'Yggdrasil'
export const YGGDRASIL_SESSION_KEY_ALGORITHM = 'HS256'
export const YGGDRASIL_API_BASE_URL = config.yggdrasil.baseApiUrl
export const YGGDRASIL_SESSION_KEY_EXPIRATION =
  config.yggdrasil.sessionKeyExpiration
export const YGGDRASIL_LAUNCH_ORG = config.yggdrasil.launchOrg
export const YGGDRASIL_LAUNCH_INTENT = config.yggdrasil.launchIntent
export const YGGDRASIL_LAUNCH_REGION = config.yggdrasil.launchRegion

/**
 * A dynamic type from {@link config.yggdrasil}.
 */
export type YggdrasilConfig = typeof config.yggdrasil

/**
 * This might looks weird, but it gets the config and support testing config changes.
 * @returns The {@link YggdrasilConfig} configuration from from {@link config.yggdrasil}.
 */
export function getConfig(): YggdrasilConfig {
  return config.yggdrasil
}
