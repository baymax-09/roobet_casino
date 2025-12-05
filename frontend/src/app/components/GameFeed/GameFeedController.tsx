import React from 'react'

import { defaultSocket } from 'app/lib/sockets'
import { normalizeBet } from 'app/util'
import { type BetHistory, type NormalizedBet } from 'common/types/bets'
import { useAxiosGet } from 'common/hooks'

import { type _tabs } from './GameFeed'
import { GameFeedView } from './GameFeedView'

export const MAX_BETS = 12

interface BetHistoryApiResponse {
  recentBets: BetHistory[]
  highRollers: BetHistory[]
  luckyWins: BetHistory[]
}

interface GameFeedTabProps {
  tabKey: (typeof _tabs)[number]['key']
}

const clamp = (bets: NormalizedBet[]) => {
  return [...bets].slice(0, MAX_BETS)
}

export const GameFeedController: React.FC<GameFeedTabProps> = ({ tabKey }) => {
  const [bets, setBets] = React.useState<NormalizedBet[]>([])

  // All bet data.
  const [{ data: allBetData, loading: betHistoryLoading }] =
    useAxiosGet<BetHistoryApiResponse>(
      `/bet/getRecentBetHistory?tab=${tabKey}`,
      {
        skip: !['highrollers', 'all', 'luckywins'].includes(tabKey),
      },
    )

  // User bet data.
  const [{ data: userBetData, loading: userBetLoading }] = useAxiosGet<
    BetHistory[]
  >('/bet/getUserHistory', {
    skip: tabKey !== 'user',
  })

  const loading = userBetLoading || betHistoryLoading

  // Update bets.
  React.useEffect(() => {
    if (loading) {
      return
    }

    if (tabKey === 'user' && userBetData) {
      const normalizedBets = userBetData.map(bet => normalizeBet(bet))

      setBets(clamp(normalizedBets))
    }

    if (tabKey !== 'user' && allBetData) {
      const { recentBets, highRollers, luckyWins } = allBetData

      let feed: BetHistory[] = []

      if (tabKey === 'highrollers') {
        feed = highRollers
      }

      if (tabKey === 'luckywins') {
        feed = luckyWins
      }

      if (tabKey === 'all') {
        feed = recentBets
      }

      const normalizedBets = feed.map(bet => normalizeBet(bet))

      setBets(clamp(normalizedBets))
    }

    const addBet = (bet: BetHistory) => {
      setBets(bets => {
        /**
         * For some reason, if the socket subscribes at the same time as the initial
         * payload, the socket may receive a bet that has already been added. This
         * may cause rendering issues when there are identical ids.
         */
        if (bets.find(b => b._id === bet._id)) {
          return bets
        }

        return clamp([normalizeBet(bet), ...bets])
      })
    }

    const onNewBet = (bet: BetHistory) => {
      if (tabKey === 'user') {
        return
      } else if (tabKey === 'highrollers') {
        if (bet.payoutValue < 100) {
          return
        }
      } else if (tabKey === 'luckywins') {
        if (bet.mult < 25 || bet.betAmount < 0.1) {
          return
        }
      }

      addBet(bet)
    }

    const onNewSelfBet = (bet: BetHistory) => {
      window.dataLayer.push({
        event: 'bet',
        betAmount: parseFloat(`${bet.betAmount}`),
      })

      if (tabKey !== 'user') {
        return
      }

      addBet(bet)
    }

    defaultSocket._socket.on('new_bet', onNewBet)
    defaultSocket._socket.on('new_bet_self', onNewSelfBet)

    return () => {
      /**
       * Need to force a rerender of the list so that animations work properly, otherwise
       * when switching tabs, react would use the same bet element from the previous tab on the new tab
       * and it would mess up the animations.
       */
      setBets([])
      defaultSocket._socket.off('new_bet', onNewBet)
      defaultSocket._socket.off('new_bet_self', onNewSelfBet)
    }
  }, [loading])

  return <GameFeedView tabKey={tabKey} loading={loading} rows={bets} />
}
