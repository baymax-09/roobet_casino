import { type Raffle as RaffleType } from 'common/types'

export type PopulatedRaffle = Omit<RaffleType, 'winners'> & {
  winners:
    | string[]
    | Array<{
        tickets: {
          tickets: number
        }
        user: {
          chatLabel: string
          name: string
          mod: boolean
          id: string
          _id: string
          hidden: boolean
        }
      }>
  tickets: {
    tickets: number
  }
  hasClaimedRakeback?: boolean
}

export interface RaffleComponentProps {
  raffle: PopulatedRaffle
  reload: () => Promise<void>
  showOnlyBackground?: boolean
  showBannerGradientMask?: boolean
  backgroundWrapperClassName?: string
}

export type AdventRaffleState = 'starting' | 'over' | 'active'
