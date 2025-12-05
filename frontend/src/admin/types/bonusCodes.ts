export const BonusCodeTypeValues = ['FREESPINS'] as const
export type BonusCodeType = (typeof BonusCodeTypeValues)[number]

export interface BonusCode {
  __typename: 'BonusCode'
  id: string
  name: string
  description: string
  type: BonusCodeType
  typeSettings: {
    // Free spins
    amount?: number
    rounds?: number
    gameIdentifier?: string
    tpGameAggregator?: string
    __typename: 'FreeSpinsTypeSettings'
  }
}

// Errors
export interface BonusCodeSubmitErrors {
  id?: string
  name?: string
  description?: string
  type?: string
  amount?: string
  rounds?: string
  gameIdentifier?: string
  tpGameAggregator?: string
}

// GQL
export interface BonusCodeGetAllQueryResults {
  bonusCodes: BonusCode[]
}

export interface BonusCodeByIdQueryResults {
  bonusCodeById: BonusCode
}

export interface BonusCodeCreateMutationResults {
  bonusCodeCreate: BonusCode
}

export interface BonusCodeDeleteMutationResults {
  bonusCodeDelete: BonusCode
}

export interface BonusCodeUpdateMutationResults {
  bonusCodeUpdate: BonusCode
}
