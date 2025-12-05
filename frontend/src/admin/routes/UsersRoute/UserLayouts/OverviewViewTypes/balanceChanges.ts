import { type UseConfirmContextArgs } from 'common/components'
import { type BalanceType } from 'common/types'

export type BalanceChangeType = 'reset' | 'add' | 'bonus'

export interface BalanceChangeOperation<Inputs> {
  title: string
  rule: string
  endpoint: string
  reasons: string[] | null
  confirmOptions: UseConfirmContextArgs & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serializeParams?: (inputs: Inputs) => any
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BalanceChangeOperations = Record<
  BalanceChangeType,
  (balanceType: BalanceType) => BalanceChangeOperation<any>
>

export const buildSelectOptions = (reasons: string[]) =>
  reasons.map(reason => ({
    key: reason,
    value: reason,
  }))

const OTHER_REASON = 'Other (Please Specify Below)'

const serializeParams = (inputs): { amount: number; reason: string | null } => {
  const { amount: rawAmount, reason, other } = inputs

  const amount = parseFloat(rawAmount) || 0

  if (reason === OTHER_REASON) {
    if (other) {
      return {
        amount,
        reason: `Other - ${other}`,
      }
    }

    return {
      amount,
      reason: null,
    }
  }

  return { amount, reason }
}

export const BALANCE_CHANGE_OPERATIONS: BalanceChangeOperations = {
  add: (
    balanceType,
  ): BalanceChangeOperation<{
    amount: number
    reason: string
    other?: string | null
  }> => {
    const reasons = [
      'CS - Issue Resolution',
      'CS - Missing Offer Funds',
      'CS - Missing Deposit',
      'CS - Failed Withdrawal',
      'CS - Wrong Blockchain Deposit',
      'CSC - Issue Resolution',
      'CSC - Missing Offer Funds',
      'CSC - Missing Deposit',
      'CSC - Wrong Blockchain Deposit',
      'Comp - Refund',
      OTHER_REASON,
    ]

    return {
      title: 'Add',
      rule: 'balances:add',
      endpoint: '/admin/user/addBalance',
      reasons,
      confirmOptions: {
        serializeParams,
        title: `Add ${balanceType.toUpperCase()} Balance`,
        message: 'Specify an amount to add and the reason for this change.',
        inputs: [
          { type: 'number', key: 'amount', name: 'Amount', required: true },
          {
            type: 'select',
            key: 'reason',
            name: 'Reason',
            options: buildSelectOptions(reasons),
            required: true,
          },
          {
            type: 'text',
            key: 'other',
            name: 'Specified Reason (Other)',
            required: false,
          },
        ],
      },
    }
  },
  bonus: balanceType => {
    const reasons = [
      'Mktg - Raffle Winner',
      'Mktg - Cashback',
      'Pshps - Giveaways',
      'Pshps - Raw Balance',
      'Pshps - Howie Balance',
      'Pshps - Howie Challenge',
      'Pshps - Payment',
      'Pshps - Locked Balance',
      'Pshps - Signup Bonus',
      'VIP - Weekly Cashback',
      'VIP - HV Loyalty Bonus',
      'VIP - Competition Bonus',
      'VIP - Loyalty Competition Bonus',
      'VIP - Birthday Bonus',
      'VIP - Verification Bonus',
      'VIP - Hospitality Costs',
      'VIP - Loyalty',
      'VIP - Welcome',
      'VIP - Reactivation',
      'VIP - Retention',
      'CS - Casino Promotion',
      'CS - VIP Support Loyalty Bonus',
      'CS - Support Bonus',
      'CS - Marketing Promotion',
      'CSC - Casino Promotion',
      'CSC - Customer Success Bonus',
      'CSC - Marketing Promotion',
      'CSC - Weekly Cashback',
      'CSC - Competition Bonus',
      'CSC - Birthday Bonus',
      'CSC - Retention',
      OTHER_REASON,
    ]

    return {
      title: 'Bonus',
      rule: 'balances:add',
      endpoint: '/admin/user/addBalanceBonus',
      reasons,
      confirmOptions: {
        serializeParams,
        title: `Add ${balanceType.toUpperCase()} Bonus`,
        message:
          'Specify an bonus amount to add and the reason for this change.',
        inputs: [
          { type: 'number', key: 'amount', name: 'Amount', required: true },
          {
            type: 'select',
            key: 'reason',
            name: 'Reason',
            options: buildSelectOptions(reasons),
            required: true,
          },
          {
            type: 'text',
            key: 'other',
            name: 'Specified Reason (Other)',
            required: false,
          },
        ],
      },
    }
  },
  reset: balanceType => ({
    title: 'Reset',
    rule: 'balances:reset',
    endpoint: '/admin/user/changeBalance',
    reasons: null,
    confirmOptions: {
      serializeParams,
      title: `Reset ${balanceType.toUpperCase()} Balance`,
      message: 'Specify the reason for this change.',
      inputs: [
        { type: 'string', key: 'reason', name: 'Reason', required: true },
      ],
    },
  }),
}
