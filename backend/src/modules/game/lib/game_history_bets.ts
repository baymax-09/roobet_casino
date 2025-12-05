import { type SortOrder } from 'mongoose'

import {
  getMinesHistoryForUserNoLimit,
  type MinesHistory,
} from 'src/modules/mines/documents/mines_history'
import {
  getPlinkoHistoryForUserNoLimit,
  type PlinkoGame,
} from 'src/modules/plinko/documents/plinko_history'
import {
  getTowersHistoryForUser,
  type TowersHistory,
} from 'src/modules/towers/documents/towers_history'
import {
  type CoinFlipGame,
  getCoinFlipGamesHistoryForUser,
} from 'src/modules/coinflip/documents/coinFlipGames'

/** @todo add new house games (linearmines, hilo) */
const GAMES_WITH_HISTORY = ['mines', 'towers', 'plinko', 'coinflip'] as const
type GameNameWithHistory = (typeof GAMES_WITH_HISTORY)[number]
const isGameNameWithHistory = (value: any): value is GameNameWithHistory =>
  GAMES_WITH_HISTORY.includes(value)
type HistoryQuery = Record<
  GameNameWithHistory,
  () => Promise<{ data: object[]; count: number }>
>

interface GameHistoryFilter {
  userId: string
  _id?: string
  gameName?: string
}

export async function houseGameHistoryBets(
  limit = 25,
  page = 0,
  sortObj: Record<string, SortOrder> = { createdAt: -1 },
  filterObj: GameHistoryFilter,
) {
  const gameName = filterObj?.gameName

  interface gameHistoryTypes {
    gameData: MinesHistory[] | TowersHistory[] | PlinkoGame[] | CoinFlipGame[]
  }

  const gameRoundsData = (
    data: gameHistoryTypes['gameData'],
    gameName: GameNameWithHistory,
  ) => {
    const mapped = data.map(gameRound => ({
      ...gameRound,
      gameName,
    }))
    return mapped
  }

  const gamehistoryQuery: HistoryQuery = {
    mines: async () => {
      const { data, count } = await getMinesHistoryForUserNoLimit({
        filterObj,
        sortObj,
      })
      const mappedData = gameRoundsData(data, 'mines')
      return {
        data: mappedData,
        count,
      }
    },
    plinko: async () => {
      const { data, count } = await getPlinkoHistoryForUserNoLimit({
        filterObj,
        sortObj,
      })
      const mappedData = gameRoundsData(data, 'plinko')
      return {
        data: mappedData,
        count,
      }
    },
    coinflip: async () => {
      const { data, count } = await getCoinFlipGamesHistoryForUser({
        filterObj,
        sortObj,
      })
      const mappedData = gameRoundsData(data, 'coinflip')
      return {
        data: mappedData,
        count,
      }
    },
    towers: async () => {
      const { data, count } = await getTowersHistoryForUser({
        filterObj,
        sortObj,
      })
      const mappedData = gameRoundsData(data, 'towers')
      return {
        data: mappedData,
        count,
      }
    },
  }

  if (isGameNameWithHistory(gameName)) {
    const { data, count } = await gamehistoryQuery[gameName]()
    return {
      page,
      limit,
      data,
      count,
    }
  } else {
    const histories = await Promise.all(
      GAMES_WITH_HISTORY.map(gameName => {
        return gamehistoryQuery[gameName]()
      }),
    )
    const { data, count } = histories.reduce(
      (acc, curr) => {
        return {
          data: [...acc.data, ...curr.data],
          count: acc.count + curr.count,
        }
      },
      { data: [], count: 0 },
    )
    const sortKey = Object.keys(sortObj)[0]
    const sortDirection = sortObj[sortKey]
    const unsortedHistory = data.flat()
    const sortedHistory = unsortedHistory.sort((a: any, b: any) => {
      if (sortDirection === 1) {
        return a[sortKey] - b[sortKey]
      } else {
        return b[sortKey] - a[sortKey]
      }
    })
    const final = sortedHistory.slice(page * limit, page * limit + limit)
    return {
      page,
      limit,
      count,
      data: final,
    }
  }
}
