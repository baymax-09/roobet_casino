import React from 'react'

import { DataTable } from 'mrooi'
import { useAxiosGet, useToasts } from 'common/hooks'
import { unCamelCase } from 'admin/util/main'

import { type UserData } from '../types'

const columns = [
  {
    name: 'game',
    label: 'Game',
  },
  {
    name: 'activeGameId',
    label: 'Active Game ID',
  },
  {
    name: 'betAmount',
    label: 'Bet Amount',
  },
  {
    name: 'betId',
    label: 'Bet ID',
  },
]

interface ActiveGamesProps {
  userData: UserData
}

interface ActiveGameData {
  activeGameId: string
  minesCount: number
  bet: unknown
  provablyFairInfo: unknown
  playedCards: unknown
  multiplier: number
}

interface ActiveGamesData {
  minesGames: ActiveGameData
  towersGames: ActiveGameData
  linearMines: ActiveGameData
}

export const ActiveGames: React.FC<ActiveGamesProps> = ({ userData }) => {
  const { toast } = useToasts()

  const [{ data }] = useAxiosGet<ActiveGamesData>(
    `/admin/user/activeGames?userId=${userData.user.id}`,
    {
      onError: error => {
        toast.error(error.response.data)
      },
    },
  )

  const activeGames = React.useMemo(() => {
    if (!data) {
      return []
    }

    return Object.keys(data).map(key => {
      const game = data[key]
      return {
        game: unCamelCase(key),
        activeGameId: game.activeGameId,
        betAmount: game.bet.betAmount,
        betId: game.bet.id,
      }
    })
  }, [data])

  return (
    <div>
      <DataTable title="Active Games" data={activeGames} columns={columns} />
    </div>
  )
}
