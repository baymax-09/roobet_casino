import { handleActions, createAction } from 'redux-actions'
import produce from 'immer'
import fromExponential from 'from-exponential'
import { type Reducer } from 'redux'

import {
  UserObjectBalanceFields,
  type BalanceType,
  type UserBalance,
  userObjectBalanceFieldsToBalanceType,
} from 'common/types'

export const incrementBalanceAction = 'balance/increment'
export const setBalancesAction = 'balances/set'
export const setUserBalancesAction = 'userBalances/set'

export const incrementBalance = createAction(incrementBalanceAction)
export const setBalances = createAction(setBalancesAction)
export const setUserBalances = createAction(setUserBalancesAction)

export interface TransactionCreatedPayload {
  delta: number
  balanceType: string
  currentBalance: number
  balanceUpdateTimestamp: string
}

const initialState: Record<BalanceType, number> = {
  cash: 0,
  crypto: 0,
  eth: 0,
  ltc: 0,
  usdt: 0,
  usdc: 0,
  xrp: 0,
  doge: 0,
  trx: 0,
}

const parseBalance = balance => parseFloat(fromExponential(balance))

export const balanceReducer: Reducer<UserBalance> = handleActions(
  {
    // We have to do this because the user has balance fields on it. May be possible to refactor later.
    [setUserBalancesAction]: (state, { payload }) =>
      produce(state, draft => {
        for (const b of UserObjectBalanceFields) {
          if (payload?.[b]) {
            draft[userObjectBalanceFieldsToBalanceType(b)] = payload[b]
              ? parseBalance(payload[b])
              : 0
          }
        }
        if (payload?.selectedBalanceType) {
          draft.selectedBalanceType = payload.selectedBalanceType
        }
      }),
    [incrementBalanceAction]: (
      state,
      { payload }: { payload: TransactionCreatedPayload },
    ) =>
      produce(state, draft => {
        const { balanceType, delta } = payload
        draft[balanceType] += parseBalance(delta)
      }),
    [setBalancesAction]: (state, { payload }) =>
      produce(state, draft => {
        for (const balanceType of Object.keys(payload)) {
          if (balanceType === 'selectedBalanceType') {
            draft[balanceType] = payload[balanceType]
          } else {
            draft[balanceType] = payload[balanceType]
              ? parseBalance(payload[balanceType])
              : 0
          }
        }
      }),
  },
  initialState,
)
