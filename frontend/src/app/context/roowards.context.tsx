import React from 'react'
import { type Updater, useImmer } from 'use-immer'
import { useSelector } from 'react-redux'
import { useSnackbar } from 'notistack'

import { roowardsWorker, stopRoowardsWorker } from 'app/core'
import { RoowardsBonusAmount } from 'app/constants'
import {
  type LevelProgress,
  type LevelsProgress,
  type Rooward,
  type RoowardTimespan,
  type LevelInfo,
} from 'app/types/roowards'
import { api } from 'common/util'
import { useIsLoggedIn } from 'app/hooks'

interface RoowardsContext {
  loading: boolean
  rewards: Rewards[]
  hasReload: boolean
  refetch: () => void
}

export const RoowardsStateContext = React.createContext<RoowardsContext | null>(
  null,
)
export const RoowardsDispatchContext =
  React.createContext<Updater<RoowardsContext> | null>(null)

type Rewards = LevelProgress & { type: keyof LevelsProgress; info: Rooward }

interface WorkerMessage {
  canClaim?: boolean
  currentLevel?: LevelProgress // check this
  currentLevelInfo: Rooward
  event:
    | 'levelUp'
    | 'rewardIsReady'
    | 'updateClaim'
    | 'updateClaimTimerText'
    | 'updateRewards'
  hasReload?: boolean
  intervalHandle?: ReturnType<typeof setInterval>
  rewards?: Rewards[]
  timerText?: string
  type: RoowardTimespan
}

type RoowardsProviderProps = React.PropsWithChildren<Record<never, never>>

const RoowardsProvider: React.FC<RoowardsProviderProps> = props => {
  const isLoggedIn = useIsLoggedIn()
  const { enqueueSnackbar } = useSnackbar()
  const totalWagered = useSelector(({ user }) => {
    let hiddenTotalBet = 0

    if (user) {
      hiddenTotalBet = user.hiddenTotalBet

      if (user.roowardsBonus) {
        if (user.roowardsBonus === true) {
          hiddenTotalBet += RoowardsBonusAmount
        } else if (user.roowardsBonus > 1) {
          hiddenTotalBet += user.roowardsBonus
        }
      }

      hiddenTotalBet = Math.max(0, hiddenTotalBet)
    }
    return hiddenTotalBet
  })

  const [state, setState] = useImmer<RoowardsContext>({
    loading: true,
    rewards: [],
    hasReload: false,
    refetch: () => {},
  })

  const refreshRewardsData = () => {
    if (isLoggedIn) {
      api
        .get<{
          levels: LevelsProgress
          levelInfo: LevelInfo
          hasReload: boolean
        }>('/roowards/get')
        .then(response => {
          roowardsWorker.postMessage({
            totalWagered,
            event: 'start',
            ...response,
          })
        })
        .catch()
    } else {
      stopRoowardsWorker()
    }
  }

  React.useEffect(() => {
    const onMessage = ({ data }: { data: WorkerMessage }) => {
      const { event, type, currentLevelInfo, currentLevel } = data

      if (event === 'updateRewards') {
        setState(r => {
          r.loading = false
          r.rewards = data.rewards!
          r.hasReload = data.hasReload!
        })
      } else if (event === 'levelUp' && currentLevel) {
        enqueueSnackbar('', {
          variant: 'roowardsToast',
          type,
          level: currentLevel,
          levelInfo: currentLevelInfo,
          autoHideDuration: 6000,
        })
      } else if (event === 'rewardIsReady' && currentLevel) {
        enqueueSnackbar('', {
          type,
          level: currentLevel,
          levelInfo: currentLevelInfo,
          mode: 'claim',
          autoHideDuration: 10000,
        })
      }
    }

    roowardsWorker.addEventListener('message', onMessage)

    setState(r => {
      r.loading = true
      r.refetch = refreshRewardsData
    })

    if (isLoggedIn) {
      api
        .get<{
          levels: LevelsProgress
          levelInfo: LevelInfo
          hasReload: boolean
        }>('/roowards/get')
        .then(response => {
          roowardsWorker.postMessage({
            totalWagered,
            event: 'start',
            ...response,
          })
        })
        .catch()
    } else {
      stopRoowardsWorker()
    }

    return () => {
      roowardsWorker.removeEventListener('message', onMessage)
      stopRoowardsWorker()
    }
  }, [isLoggedIn])

  React.useEffect(() => {
    roowardsWorker.postMessage({
      totalWagered,
      event: 'updateTotalWagered',
    })
  }, [totalWagered])

  return (
    <RoowardsStateContext.Provider value={state}>
      <RoowardsDispatchContext.Provider value={setState}>
        {props.children}
      </RoowardsDispatchContext.Provider>
    </RoowardsStateContext.Provider>
  )
}

export function useRoowards() {
  const ctx = React.useContext(RoowardsStateContext)

  if (!ctx) {
    throw new Error('useRewards() must be used inside RewardsProvider')
  }

  return ctx
}

export function useRoowardsDispatch() {
  const dispatch = React.useContext(RoowardsDispatchContext)

  if (!dispatch) {
    throw new Error('useRewardsDispatch() must be used inside RewardsProvider')
  }

  return dispatch
}

export default React.memo(RoowardsProvider)
