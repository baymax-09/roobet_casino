import { combineReducers } from 'redux'

import { crashReducer } from './crash'
import { userReducer } from './user'
import { settingsReducer } from './settings'
import { colorsReducer } from './colors'
import { socketsReducer } from './sockets'
import { balanceReducer } from './balances'

type BaseReducerMap<S> = {
  [K in keyof S]: (state: S[K], action: any) => S
}

type InferRootState<ReducerMap extends BaseReducerMap<S>, S = any> = {
  [K in keyof ReducerMap]: ReturnType<ReducerMap[K]>
}

const allReducers = {
  crash: crashReducer,
  user: userReducer,
  settings: settingsReducer,
  colors: colorsReducer,
  sockets: socketsReducer,
  balances: balanceReducer,
}

export const reducers = combineReducers(allReducers)

export type RootState = InferRootState<typeof allReducers>
