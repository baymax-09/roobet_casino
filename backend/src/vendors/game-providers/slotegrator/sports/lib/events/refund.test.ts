import { Types } from 'mongoose'
import { basicUserMock } from '../../../../../../../test/mocks/user'
import type * as activeBetsMongo from '../../../../../../modules/bet/documents/activeBetsMongo'
import * as userBalance from '../../../../../../modules/user/balance/lib'
import { type User } from '../../../../../../modules/user/types'
import * as slotegratorActions from '../../documents/slotegratorActions'
import { REFUND_EVENT, type RefundRequest } from './refund'

function getMockUser(userAttribs: any = {}): User | null {
  if (!userAttribs) {
    return null
  }
  return {
    ...basicUserMock,
    kycRequiredLevel: 0,
    selectedBalanceType: 'eth',
    ...userAttribs,
  }
}

const processCases = [
  {
    name: 'No Bet Action => Resolves',
    user: getMockUser(),
    inputs: {
      request: {
        action: 'refund',
        type: 'default',
        player_id: '123',
        betslip_id: '456',
        session_id: '789',
        transaction_id: '123',
        amount: 100,
      } as unknown as RefundRequest,
      creditBalance: {
        transactionId: '123',
        balanceType: 'eth',
        balance: 100,
      },
      activeBet: {
        userId: '123',
      } as unknown as activeBetsMongo.ActiveBet,
      actionDoc: undefined as unknown as slotegratorActions.SlotegratorAction,
    },
    outcomes: {
      getActiveBet: 1,
      getAction: 1,
      updateAction: 1,
      creditBalance: 0,
    },
  },
  {
    name: 'Unsupported Type => Null',
    user: getMockUser(),
    inputs: {
      request: {
        action: 'refund',
        type: 'invalid-type',
        player_id: '123',
        betslip_id: '456',
        session_id: '789',
        transaction_id: '123',
        amount: 100,
      } as unknown as RefundRequest,
      creditBalance: {
        transactionId: '123',
        balanceType: 'eth',
        balance: 100,
      },
      activeBet: {
        _id: new Types.ObjectId('123456789012123456789012'),
        userId: '123',
      } as unknown as activeBetsMongo.ActiveBet,
      actionDoc: {
        action: 'bet',
        betslipId: '456',
      } as unknown as slotegratorActions.SlotegratorAction,
    },
    outcomes: {
      getAction: 1,
      updateAction: 1,
      creditBalance: 1,
      creditBalanceArgs: {
        transactionType: 'refund',
        meta: expect.objectContaining({ refundType: null }),
      },
    },
  },
  {
    name: 'Refund (default) => Refunds',
    user: getMockUser(),
    inputs: {
      request: {
        action: 'refund',
        type: 'default',
        player_id: '123',
        betslip_id: '456',
        session_id: '789',
        transaction_id: '123',
        amount: 100,
      } as unknown as RefundRequest,
      creditBalance: {
        transactionId: '123',
        balanceType: 'eth',
        balance: 100,
      },
      activeBet: {
        _id: new Types.ObjectId('123456789012123456789012'),
        userId: '123',
      } as unknown as activeBetsMongo.ActiveBet,
      actionDoc: {
        action: 'bet',
        betslipId: '456',
      } as unknown as slotegratorActions.SlotegratorAction,
    },
    outcomes: {
      getAction: 1,
      updateAction: 1,
      creditBalance: 1,
      creditBalanceArgs: {
        transactionType: 'refund',
        meta: expect.objectContaining({ refundType: 'refund' }),
      },
    },
  },
  {
    name: 'Refund (cash_out) => Cash Out',
    user: getMockUser(),
    inputs: {
      request: {
        action: 'refund',
        type: 'cash_out',
        player_id: '123',
        betslip_id: '456',
        session_id: '789',
        transaction_id: '123',
        amount: 100,
      } as unknown as RefundRequest,
      creditBalance: {
        transactionId: '123',
        balanceType: 'eth',
        balance: 100,
      },
      activeBet: {
        _id: new Types.ObjectId('123456789012123456789012'),
        userId: '123',
      } as unknown as activeBetsMongo.ActiveBet,
      actionDoc: {
        action: 'bet',
        betslipId: '456',
      } as unknown as slotegratorActions.SlotegratorAction,
    },
    outcomes: {
      getAction: 1,
      updateAction: 1,
      creditBalance: 1,
      creditBalanceArgs: {
        transactionType: 'refund',
        meta: expect.objectContaining({ refundType: 'cash_out' }),
      },
    },
  },
  {
    name: 'Refund (reject) => Reject',
    user: getMockUser(),
    inputs: {
      request: {
        action: 'refund',
        type: 'reject',
        player_id: '123',
        betslip_id: '456',
        session_id: '789',
        transaction_id: '123',
        amount: 100,
      } as unknown as RefundRequest,
      creditBalance: {
        transactionId: '123',
        balanceType: 'eth',
        balance: 100,
      },
      activeBet: {
        _id: new Types.ObjectId('123456789012123456789012'),
        userId: '123',
      } as unknown as activeBetsMongo.ActiveBet,
      actionDoc: {
        action: 'bet',
        betslipId: '456',
      } as unknown as slotegratorActions.SlotegratorAction,
    },
    outcomes: {
      getAction: 1,
      updateAction: 1,
      creditBalance: 1,
      creditBalanceArgs: {
        transactionType: 'refund',
        meta: expect.objectContaining({ refundType: 'reject' }),
      },
    },
  },
]

describe('Verify Refund Process Works As Expected', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it.each(processCases)('$name', async ({ user, inputs, outcomes }) => {
    let _action: slotegratorActions.BaseSlotegratorAction | undefined
    const { request, creditBalance, activeBet, actionDoc } = inputs

    // Spy & Mock Setup
    jest
      .spyOn(slotegratorActions, 'getAction')
      .mockImplementation(() => Promise.resolve(actionDoc ?? null))
    jest
      .spyOn(slotegratorActions, 'updateAction')
      .mockImplementation(() => Promise.resolve(null))
    jest
      .spyOn(userBalance, 'creditBalance')
      .mockImplementation(() => Promise.resolve(creditBalance))

    // Run the Tests
    expect(() => {
      _action = REFUND_EVENT.resolveAction(request)
    }).not.toThrow()

    if (_action) {
      const action = { ..._action, _id: new Types.ObjectId() }
      await expect(
        REFUND_EVENT.process({ request, action, user, activeBet }),
      ).resolves.not.toThrow()
    }

    // Verify the Spies
    if (typeof outcomes.getAction === 'number') {
      expect(slotegratorActions.getAction).toHaveBeenCalledTimes(
        outcomes.getAction,
      )
    }

    if (typeof outcomes.updateAction === 'number') {
      expect(slotegratorActions.updateAction).toHaveBeenCalledTimes(
        outcomes.updateAction,
      )
    }

    if (typeof outcomes.creditBalance === 'number') {
      expect(userBalance.creditBalance).toHaveBeenCalledTimes(
        outcomes.creditBalance,
      )
      if (typeof outcomes.creditBalanceArgs === 'object') {
        expect(userBalance.creditBalance).toHaveBeenCalledWith(
          expect.objectContaining(outcomes.creditBalanceArgs),
        )
      }
    }
  })
})
