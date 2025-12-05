import { scopedLogger } from 'src/system/logger'
import { YGGDRASIL_PROVIDER_NAME } from '../types'

/**
 * The default scope for the Yggdrasil logger.
 */
export const yggdrasilLogScope = YGGDRASIL_PROVIDER_NAME

/**
 * The logger for the Yggdrasil provider.
 */
export const yggdrasilLogger = scopedLogger(yggdrasilLogScope)
