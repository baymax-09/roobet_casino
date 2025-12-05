import { config } from 'src/system'
import { type Types as UserTypes } from 'src/modules/user'
import type mongoose from 'mongoose'
import { Types } from 'mongoose'

import {
  generateHash,
  saltWithNewSeed,
} from 'src/modules/game/lib/provably_fair/sharedAlgorithms'
import { type HouseGameName, type GameRound } from '../../types'

/**
 * Call this function after a player rolls a number to increase the
 * nonce stored for their round of play.
 */
export async function incrementRoundNonce<T extends GameRound>(
  userId: string,
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
) {
  const result: T | null = await gameRoundTable.findOneAndUpdate(
    {
      userId,
      roundOver: false,
      gameName,
    },
    { $inc: { nonce: 1 } },
    {
      new: true,
      lean: true,
    },
  )
  return result ? { ...result, id: result._id.toString() } : null
}

/**
 * This function is called within this document ONLY. Do not export!
 * The seed should NEVER make its way to frontend.
 * If the round seed ever leaves this file, it should do so HASHED.
 */
function generateRoundSeed(gameName: HouseGameName, roundId: string) {
  const serverSeed = config[gameName].seed
  return saltWithNewSeed(serverSeed, roundId)
}

/**
 * Call this function to generate the hash of the round's private serverSeed.
 * The user must see this hash before any game in the round begins, so that they
 * know the results could not be changed.
 *
 * Safe to share. Safe for FE
 */
export function generateRoundHash(gameName: HouseGameName, roundId: string) {
  const secretHash = generateRoundSeed(gameName, roundId)
  const publicHash = generateHash(gameName, secretHash)

  return {
    secretHash,
    publicHash,
  }
}

/**
 * Call this function to get the results of a game.
 * Randomly generates a number between 0 and 99.99
 */
export function rollNumber(hash: string) {
  let index = 0
  let lucky = parseInt(hash.substring(index * 5, index * 5 + 5), 16)

  // keep grabbing characters from the hash while greater than
  while (lucky >= Math.pow(10, 6)) {
    index++
    lucky = parseInt(hash.substring(index * 5, index * 5 + 5), 16)

    // if we reach the end of the hash, just default to highest number
    if (index * 5 + 5 > 128) {
      lucky = 9999
      break
    }
  }

  lucky %= Math.pow(10, 4)
  lucky /= Math.pow(10, 2)
  return lucky
}

export interface GameEndHash {
  hash: string
  roundEnded: boolean
}

export interface GameRoundHash {
  hash: string
  previousRoundSeed: GameEndHash | null
}

// starts a round and returns the hash to start the round.
export async function startGameHashRound<T extends GameRound>(
  user: UserTypes.User,
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
): Promise<GameRoundHash & { newRound: T }> {
  // generate Object ID for new round
  const _id = new Types.ObjectId()

  // end any active rounds before creating a new one
  const previousRoundSeed = await endCurrentRoundForUser(
    user,
    gameName,
    gameRoundTable,
  )

  // generate the roundSeed and then hash it -- save the encrypted roundSeed on the round doc
  const { publicHash: hash } = generateRoundHash(gameName, _id.toString())
  const newRound: T = (
    await gameRoundTable.create({
      _id,
      userId: user.id,
      gameName,
      roundOver: false,
      hash,
    })
  ).toObject()

  return {
    hash,
    previousRoundSeed,
    newRound: { ...newRound, id: _id.toString() },
  }
}

// used when starting a new round or ending a round (via /game/endRoute)
// only called in a couple places
export async function getOrCreateRoundForUser<T extends GameRound>(
  user: UserTypes.User,
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
): Promise<{
  newRound: boolean
  currentRound: T
  roundStartInfo: GameRoundHash | null
}> {
  const currentRound = await getCurrentRoundForUser<T>(
    user,
    gameName,
    gameRoundTable,
  )
  if (currentRound) {
    return { newRound: false, currentRound, roundStartInfo: null }
  } else {
    // if no round exists, start one.
    const roundStartInfo = await startGameHashRound(
      user,
      gameName,
      gameRoundTable,
    )
    const newRound = await getCurrentRoundForUser<T>(
      user,
      gameName,
      gameRoundTable,
    )
    // newRound really should come back as nonNull
    return { newRound: true, roundStartInfo, currentRound: newRound! }
  }
}

export async function getCurrentRoundForUser<T extends GameRound>(
  user: UserTypes.User,
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
): Promise<T | null> {
  const currentRound: T | null = await gameRoundTable
    .findOne({
      userId: user.id,
      roundOver: false,
      gameName,
    })
    .lean()
  return currentRound
    ? { ...currentRound, id: currentRound._id.toString() }
    : null
}

// used when verifying bets and ending a round (via /game/endRoute)
export async function endCurrentRoundForUser(
  user: UserTypes.User,
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
): Promise<GameEndHash | null> {
  const currentRound = await getCurrentRoundForUser(
    user,
    gameName,
    gameRoundTable,
  )
  if (!currentRound) {
    // throw new APIValidationError("This bet must be verified by the user who made the bet first.")
    return null
  }
  return await endGameHashRound(gameName, gameRoundTable, currentRound.id!)
}

/*
 * Call this function to end a round for a user. The function checks to see if
 * the db was successfully updated before revealing the private serverSeed for
 * the newly ended round.
 */
export async function endGameHashRound(
  gameName: HouseGameName,
  gameRoundTable: mongoose.Model<any>,
  roundId: string,
): Promise<GameEndHash | null> {
  const hash = generateRoundSeed(gameName, roundId)
  const result = await gameRoundTable.findOneAndUpdate(
    {
      _id: roundId,
    },
    {
      roundOver: true,
      seed: hash,
      completedAt: new Date(),
    },
    {
      new: true,
    },
  )

  if (result) {
    return { hash, roundEnded: !!hash }
  } else {
    return null
  }
}
