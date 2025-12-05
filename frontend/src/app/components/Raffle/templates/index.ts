import { DefaultRaffleBanner, DefaultRafflePage } from './default'
import { AdventRaffleBanner, AdventRafflePage } from './advent'
import { type RaffleComponentProps } from '../types'

import type React from 'react'

type RaffleTypes = (typeof RAFFLE_TYPES)[number]

const RAFFLE_TYPES = ['default', 'advent'] as const

/**
 * This map should be kept in parity with the existing
 * raffles types in backend. If an existing raffle types
 * does not have a corresponding template, the raffle banner
 * and route will fail silently and not render.
 */
export const RAFFLE_TEMPLATES: Record<
  RaffleTypes,
  {
    banner: React.FC<RaffleComponentProps>
    page: React.FC<RaffleComponentProps>
  }
> = {
  default: {
    banner: DefaultRaffleBanner,
    page: DefaultRafflePage,
  },
  advent: {
    banner: AdventRaffleBanner,
    page: AdventRafflePage,
  },
}

export * from './shared'
