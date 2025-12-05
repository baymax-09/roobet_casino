import { getDurationInMs } from 'src/util/helpers/time'

// 1 week in milliseconds.
export const MESSAGING_TTL = getDurationInMs(1, 'w')

export const MESSAGING_CACHE_NAME = 'messaging'

export const MESSAGING_CACHE_KEY_ALL = 'all'
