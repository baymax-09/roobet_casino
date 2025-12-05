import { type DBCollectionSchema } from 'src/modules'
import { mongoose } from 'src/system'
import { scopedLogger } from 'src/system/logger'
import * as cache from 'src/util/redisModels/basicCache'
import {
  BLACKJACK_GAME_NAME,
  BlackjackAggregateError,
  BlackjackError,
  BlackjackGameNotFoundError,
  BlackjackMissingGameHashError,
  BlackjackMissingGameSeedError,
  BlackjackMissingPlayerHandError,
  BlackjackNoPlayersError,
  BlackjackUpsertFailedError,
  DealerSeatDefault,
  GameStatus,
  isPlayerSeat,
  type GameState,
  type Hand,
  type HandActionInsurance,
  type HandActionSplit,
  type HandActionWithShoe,
  type HandActions,
  type HandStatus,
  type PlayerCard,
  type PlayerSeat,
  type Table,
  type UserHandMainWager,
  type UserHandSideWager,
} from '../types'
import { getTableStatus } from '../utils'
import {
  CardSchemaBlock,
  GamesSchemaBlock,
  HandActionInsuranceSchemaBlock,
  HandActionSchemaBlock,
  HandActionSplitSchemaBlock,
  HandActionWithShoeSchemaBlock,
  HandMainWagerSchemaBlock,
  HandSchemaBlock,
  HandSideWagerSchemaBlock,
  HandStatusSchemaBlock,
  PlayerSchemaBlock,
  setHandActionsSchemaDiscriminators,
  toObjectOptions,
  type DBBlackjackGame,
} from './blackjackSchemas'

const logScope = 'blackjackGamesDocument'

export const BlackjackHandStatusSchema = new mongoose.Schema<HandStatus>(
  ...HandStatusSchemaBlock(),
)
export const BlackjackCardSchema = new mongoose.Schema<PlayerCard>(
  ...CardSchemaBlock(),
)
export const BlackjackHandActionSchema = new mongoose.Schema<HandActions>(
  ...HandActionSchemaBlock(),
)
export const BlackjackHandActionWithShoeSchema =
  new mongoose.Schema<HandActionWithShoe>(...HandActionWithShoeSchemaBlock())
export const BlackjackHandActionInsuranceSchema =
  new mongoose.Schema<HandActionInsurance>(...HandActionInsuranceSchemaBlock())
export const BlackjackHandActionSplitSchema =
  new mongoose.Schema<HandActionSplit>(...HandActionSplitSchemaBlock())

setHandActionsSchemaDiscriminators(
  BlackjackHandActionSchema,
  BlackjackHandActionWithShoeSchema,
  BlackjackHandActionInsuranceSchema,
  BlackjackHandActionSplitSchema,
)

export const BlackjackHandSideWagerSchema =
  new mongoose.Schema<UserHandSideWager>(...HandSideWagerSchemaBlock())
const BlackjackHandMainWagerSchema = new mongoose.Schema<UserHandMainWager>(
  ...HandMainWagerSchemaBlock(BlackjackHandSideWagerSchema),
)
const BlackjackHandSchema = new mongoose.Schema<Hand>(
  ...HandSchemaBlock(
    BlackjackHandMainWagerSchema,
    BlackjackCardSchema,
    BlackjackHandStatusSchema,
    BlackjackHandActionSchema,
  ),
)
const BlackjackPlayerSchema = new mongoose.Schema<PlayerSeat>(
  ...PlayerSchemaBlock(BlackjackHandSchema),
)
const BlackjackGamesSchema = new mongoose.Schema<DBBlackjackGame>(
  GamesSchemaBlock(BlackjackPlayerSchema),
  { timestamps: true, toObject: toObjectOptions },
)

BlackjackGamesSchema.index({ createdAt: 1 })

/**
 * The Blackjack game model.
 */
export const BlackjackGameModel = mongoose.model<DBBlackjackGame>(
  'blackjack_games',
  BlackjackGamesSchema,
)

/**
 * The number of seconds to cache a game.
 *
 * Note: Most single player Blackjack games complete in 1-3 minutes, allowing 5 minutes
 */
export const GameCacheSeconds = 60 * 5

/**
 * The maximum number of seconds to lock a game for an action.
 *
 * Note: Three seconds per action should be insanely excessive
 */
export const ActionLockSeconds = 3

/**
 * The cache key generator for write thru data caching.
 *
 * Used to protect cache access from concurrent actions in
 * {@link upsertGame}, {@link getGameById}, and {@link deleteGame}
 * @param gameId The game ID.
 * @returns The compound cache key.
 */
export const cacheKey = (gameId: string) => ['blackjack', `game_${gameId}`]

/**
 * Starts a game of blackjack.
 * @param hash The final game hash.
 * @param players The game seats.
 * @returns A {@link GameState} object.
 */
export async function createGame(
  seed: string,
  player: PlayerSeat,
): Promise<GameState> {
  const game: GameState = {
    id: '',
    hash: '',
    seed,
    players: [player, DealerSeatDefault],
    status: GameStatus.Pending,
  }

  const errors = validateCreateGameRequest(game)
  if (errors.length > 0) {
    throw BlackjackError.logAndReturn(
      new BlackjackAggregateError(game.id, logScope, errors),
    )
  }

  scopedLogger(BLACKJACK_GAME_NAME)(logScope, { userId: player.playerId }).info(
    'Creating game',
    { game: JSON.stringify(game) },
  )
  return (await BlackjackGameModel.create(game)).toObject<GameState>()
}

/**
 * Validates a game creation request.
 * @param game The game to be created.
 * @returns An array of {@link BlackjackError} objects, an empty array is a good result.
 */
function validateCreateGameRequest(game: GameState): BlackjackError[] {
  const errors: BlackjackError[] = []
  if (!game.seed || game.seed.trim().length === 0) {
    errors.push(new BlackjackMissingGameSeedError(game.id, logScope))
  }
  // Filter undefined players and make sure there's at least 2 (1 client & 1 dealer)
  const remotePlayers = game.players.filter(isPlayerSeat)
  if (game.players.length < 2 || remotePlayers.length < 1) {
    errors.push(new BlackjackNoPlayersError(game.id, logScope))
  }
  return errors
}

/**
 * Starts a game of blackjack.
 * @param hash The final game hash.
 * @param players The game seats.
 * @returns A {@link GameState} object.
 */
export async function startGame(
  id: string,
  hash: string,
  players: Table,
): Promise<GameState> {
  const pendingGame = await getGameById(id)
  const game: GameState = {
    ...pendingGame,
    hash,
    players,
    status: getTableStatus(players),
  }

  const errors = validateStartGameRequest(game)
  if (errors.length > 0) {
    throw BlackjackError.logAndReturn(
      new BlackjackAggregateError(game.id, logScope, errors),
    )
  }

  return await upsertGame(game)
}

/**
 * Validates a game start request.
 * @param game The game to be started.
 * @returns An array of {@link BlackjackError} objects, an empty array is a good result.
 */
function validateStartGameRequest(game: GameState): BlackjackError[] {
  const errors: BlackjackError[] = []
  if (!game.hash || game.hash.length === 0) {
    errors.push(new BlackjackMissingGameHashError(game.id, logScope))
  }
  if (game.players.some(player => player.hands.length < 1)) {
    errors.push(new BlackjackMissingPlayerHandError(game.id, logScope))
  }
  return errors
}

/**
 * Updates or inserts a game into the database.
 * @param game The game to upsert.
 * @returns The upserted game.
 * @throws {@link BlackjackGameUpsertFailedError} if the game fails to upsert.
 */
export async function upsertGame(game: GameState): Promise<GameState> {
  const { id } = game
  try {
    const result = await BlackjackGameModel.updateOne({ _id: id }, game, {
      upsert: true,
    })

    if (!result.acknowledged) {
      throw BlackjackError.logAndReturn(
        new BlackjackUpsertFailedError(id, logScope, result),
      )
    }

    const [name, key] = cacheKey(id)
    await cache.set(name, key, game, GameCacheSeconds)
  } catch (err) {
    throw BlackjackError.logAndReturn(err, logScope)
  }

  return game
}

/**
 * Gets a game by its ID.
 * @param gameId The game ID.
 * @returns A {@link GameState} object.
 * @throws A {@link BlackjackGameNotFoundError} if the game is not found.
 */
export async function getGameById(gameId: string): Promise<GameState> {
  const [name, key] = cacheKey(gameId)
  return await cache.cached(name, key, GameCacheSeconds, async () => {
    const gameRecord = await BlackjackGameModel.findById(gameId)
    if (!gameRecord) {
      throw new BlackjackGameNotFoundError(gameId, logScope)
    }
    return gameRecord.toObject<GameState>()
  })
}

/**
 * Gets all games for a player.
 * @param playerId The player ID.
 * @returns An array of {@link GameState} objects, or an empty array
 * if the player has no active games.
 */
export async function getGamesForPlayer(
  playerId: string,
): Promise<GameState[]> {
  return (await BlackjackGameModel.find({ 'players.playerId': playerId })).map(
    game => game.toObject<GameState>(),
  )
}

/**
 * Check if a game exists by its ID, and optionally in a particular {@link status}.
 * @param gameId The game ID.
 * @param status The game status to check for, or undefined to not care.
 * @returns `true` if the game exists and is in the {@link status} or the {@link status} is `undefined`,
 * `false` otherwise.
 */
export async function gameExists(
  gameId: string,
  status?: GameStatus,
): Promise<boolean> {
  const game = await getGameById(gameId)
  return !!game && (status === undefined || game.status === status)
}

/**
 * Deletes a {@link GameState} by its {@link GameState.id id}, and invalidates it in the {@link cache}.
 * @param gameId The {@link GameState.id id} of the game to delete.
 */
export async function deleteGame(gameId: string): Promise<void> {
  const result = await BlackjackGameModel.deleteOne({ _id: gameId })
  if (result.acknowledged && result.deletedCount === 1) {
    const [name, key] = cacheKey(gameId)
    await cache.invalidate(name, key)
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: BlackjackGameModel.collection.name,
}
