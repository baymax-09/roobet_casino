import { type FilterQuery, type SortOrder, type Types } from 'mongoose'

import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'

export type CoinFlipState = (typeof CoinFlipStates)[number]
export const CoinFlipStates = [
  'open',
  'started',
  'finished',
  'cancelled',
] as const

export type CoinFlipOutcome = (typeof CoinFlipOutcomes)[number]
export const CoinFlipOutcomes = ['heads', 'tails'] as const

interface CoinFlipGameFilter {
  userId: string
  _id?: string
}

interface JoinCoinflipGameArgs {
  gameId: string
  userId: string
  betId: string
  roundId: string
  username: string
  roundHash: string
  competitorNonce: number
}

export interface BaseCoinFlipGame {
  userIdAuthor: string
  usernameAuthor: string
  amount: number
  guessAuthor: CoinFlipOutcome
  status: CoinFlipState
  betIdByAuthor: string
  authorRoundId: string
  authorNonce: number
  /** is the author a Sponsor? */
  isAuthorSponsor: boolean
  /** defaults to 0 when blockHeight cannot be found */
  blockHeight: number

  /** clientSeed is the block hash for blockHeight */
  clientSeed?: string
  authorRoundHash?: string
  userIdCompetitor?: string
  usernameCompetitor?: string
  dismissedAuthor?: boolean
  dismissedCompetitor?: boolean
  betIdByCompetitor?: string
  outcome?: CoinFlipOutcome
  competitorRoundId?: string
  competitorRoundHash?: string
  competitorNonce?: number
}

export interface CoinFlipGame extends BaseCoinFlipGame {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const CoinFlipGamesSchema = new mongoose.Schema<CoinFlipGame>(
  {
    usernameAuthor: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    guessAuthor: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    authorNonce: {
      type: Number,
      required: true,
    },
    betIdByAuthor: {
      type: String,
      required: true,
      index: true,
    },
    blockHeight: {
      type: Number,
      default: 0,
      required: true,
    },
    authorRoundId: {
      type: String,
      required: true,
    },
    authorRoundHash: {
      type: String,
      required: true,
    },
    userIdAuthor: {
      type: String,
      index: true,
      required: true,
    },
    isAuthorSponsor: {
      type: Boolean,
      default: false,
    },

    clientSeed: String,
    dismissedAuthor: Boolean,
    dismissedCompetitor: Boolean,
    userIdCompetitor: {
      type: String,
      index: true,
    },
    usernameCompetitor: String,
    outcome: String,
    betIdByCompetitor: {
      type: String,
      index: true,
    },
    competitorRoundId: String,
    competitorRoundHash: String,
    competitorNonce: Number,

    createdAt: {
      type: Date,
      index: true,
      expires: 60 * 60 * 24 * 30 * 3,
    },
  },
  { timestamps: true },
)

CoinFlipGamesSchema.index({ userIdAuthor: 1, status: 1 })
CoinFlipGamesSchema.index({ userIdCompetitor: 1, status: 1 })

const CoinFlipGamesModel = mongoose.model<CoinFlipGame>(
  'coinflip_games',
  CoinFlipGamesSchema,
)

export async function getCoinFlipGameById(betId: string) {
  return await CoinFlipGamesModel.findOne({
    $or: [{ betIdByAuthor: betId }, { betIdByCompetitor: betId }],
  })
}

export async function insertCoinFlipGame(
  game: BaseCoinFlipGame,
): Promise<CoinFlipGame> {
  return await CoinFlipGamesModel.create(game)
}

const pageLength = 20
export async function getCoinFlipGamesForUser({
  userId,
  pageNumber = 0,
}: {
  userId: string
  pageNumber?: number
}): Promise<CoinFlipGame[]> {
  return await CoinFlipGamesModel.find({ userIdAuthor: userId })
    .skip(pageLength * pageNumber)
    .limit(pageLength)
    .lean()
}

export async function getCoinFlipGamesHistoryForUser({
  filterObj,
  sortObj,
}: {
  filterObj: CoinFlipGameFilter
  sortObj: Partial<Record<keyof CoinFlipGame, SortOrder>>
}): Promise<{ data: CoinFlipGame[]; count: number }> {
  const updatedFilterObj: FilterQuery<CoinFlipGame> = {
    $or: [
      { userIdAuthor: filterObj.userId },
      { userIdCompetitor: filterObj.userId },
    ],
  }
  if (filterObj._id) {
    updatedFilterObj._id = filterObj._id
  }

  const query = CoinFlipGamesModel.find(updatedFilterObj)

  const [data, count] = await Promise.all([
    query.sort(sortObj).lean<CoinFlipGame[]>(),
    CoinFlipGamesModel.countDocuments(updatedFilterObj),
  ])

  return {
    data,
    count,
  }
}

export async function getCoinFlipActiveGamesForUser({
  userId,
  withFinished = false,
}: {
  userId: string
  withFinished?: boolean
}): Promise<CoinFlipGame[]> {
  const statuses = withFinished
    ? ['open', 'started', 'finished']
    : ['open', 'started']

  return await CoinFlipGamesModel.find({
    userIdAuthor: userId,
    status: { $in: statuses },
    dismissedAuthor: { $ne: true },
  }).lean()
}

export async function getCoinFlipActiveGamesForOtherUsers({
  userId,
  pageNumber = 0,
}: {
  userId: string
  pageNumber?: number
}) {
  return await CoinFlipGamesModel.find({
    userIdAuthor: { $ne: userId },
    status: { $in: ['open', 'started'] },
  })
    .skip(pageLength * pageNumber)
    .limit(pageLength)
    .lean()
}

export async function addBotToCoinFlipGame({
  gameId,
  userId,
}: {
  gameId: string
  userId: string
}) {
  return await CoinFlipGamesModel.findOneAndUpdate(
    {
      _id: gameId,
      userIdAuthor: userId,
      status: 'open',
    },
    {
      userIdCompetitor: 'bot',
      status: 'started',
    },
    { new: true },
  ).lean()
}

export async function joinCoinFlipGame({
  gameId,
  userId,
  betId,
  roundId,
  username,
  roundHash,
  competitorNonce,
}: JoinCoinflipGameArgs) {
  return await CoinFlipGamesModel.findOneAndUpdate(
    {
      _id: gameId,
      status: 'open',
    },
    {
      userIdCompetitor: userId,
      status: 'started',
      betIdByCompetitor: betId,
      competitorRoundId: roundId,
      usernameCompetitor: username,
      competitorRoundHash: roundHash,
      competitorNonce,
    },
    { new: true },
  ).lean()
}

export async function updateCoinFlipGame(
  _id: string,
  payload: Partial<CoinFlipGame>,
) {
  return await CoinFlipGamesModel.findOneAndUpdate(
    { _id, status: 'started' },
    payload,
    { new: true },
  ).lean()
}

export async function findCoinFlipGameById(
  gameId: string,
): Promise<CoinFlipGame | null> {
  return await CoinFlipGamesModel.findById(gameId).lean()
}

export async function setGameAsRefunded({
  userId,
  gameId,
}: {
  userId: string
  gameId: string
}) {
  return await CoinFlipGamesModel.findOneAndUpdate(
    {
      _id: gameId,
      userIdAuthor: userId,
      status: 'open',
    },
    {
      status: 'cancelled',
    },
    { new: true },
  ).lean()
}

export async function setGameAsDismissed({
  userId,
  gameId,
}: {
  userId: string
  gameId: string
}): Promise<number> {
  const gamesUpdated = await CoinFlipGamesModel.updateMany(
    {
      _id: gameId,
      $or: [{ userIdAuthor: userId }, { userIdCompetitor: userId }],
    },
    [
      {
        $set: {
          dismissedAuthor: {
            $cond: {
              if: { $eq: ['$userIdAuthor', userId] },
              then: true,
              else: '$dismissedAuthor',
            },
          },
          dismissedCompetitor: {
            $cond: {
              if: { $eq: ['$userIdCompetitor', userId] },
              then: true,
              else: '$dismissedCompetitor',
            },
          },
        },
      },
    ],
  )

  return gamesUpdated.modifiedCount
}

export async function setAllGamesAsDismissed({
  userId,
}: {
  userId: string
}): Promise<number> {
  const gamesUpdated = await CoinFlipGamesModel.updateMany(
    {
      status: 'finished',
      $or: [{ userIdAuthor: userId }, { userIdCompetitor: userId }],
    },
    [
      {
        $set: {
          dismissedAuthor: {
            $cond: {
              if: { $eq: ['$userIdAuthor', userId] },
              then: true,
              else: '$dismissedAuthor',
            },
          },
          dismissedCompetitor: {
            $cond: {
              if: { $eq: ['$userIdCompetitor', userId] },
              then: true,
              else: '$dismissedCompetitor',
            },
          },
        },
      },
    ],
  )

  return gamesUpdated.modifiedCount
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: CoinFlipGamesModel.collection.name,
}
