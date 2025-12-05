import { type Options } from 'amqplib'

import { isHouseGameName } from 'src/modules/game/types'
import { getUserOrigin } from 'src/util/helpers/userOrigin'
import { getUserFiatCurrency } from 'src/modules/currency/types'
import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { type BetHistory } from 'src/modules/bet/types'

import { type GameRound } from '../types'
import { publishAndLogMessage } from '../utils'

interface HandleUserGameRoundArgs {
  bet: BetHistory
}

export const publishUserGameRoundMessageToFastTrack = async (
  message: HandleUserGameRoundArgs,
  messageOptions?: Options.Publish,
) => {
  const { bet } = message
  const {
    userId,
    category,
    gameNameDisplay,
    gameName,
    betId,
    gameId,
    gameIdentifier,
    profit,
    betAmount,
    thirdParty,
  } = bet

  // Sportsbook bets will be handled in their own events:  { type: 'SPORTSBOOK' }
  if (thirdParty === 'slotegrator') {
    return
  }

  const isHouseGame = isHouseGameName(gameName)
  const user_currency = getUserFiatCurrency(userId)
  const timestamp = getCurrentDateTimeISO()
  const origin = getUserOrigin(userId)

  const messagePayload: GameRound = {
    user_id: userId,
    round_id: isHouseGame ? gameId : betId,
    game_id: gameIdentifier!,
    game_name: gameNameDisplay || gameName,
    game_type: category!,
    vendor_id: isHouseGame ? 'inhouse' : thirdParty!,
    vendor_name: isHouseGame ? 'inhouse' : thirdParty,
    real_bet_user: betAmount,
    real_win_user: betAmount + (profit ?? 0),
    real_bet_base: betAmount,
    real_win_base: betAmount + (profit ?? 0),
    device_type: 'unknown', // Is there someway for us to get this with the bet?
    user_currency,
    timestamp,
    origin,
    // Do we care about bonuses??
    // bonus_bet_user?: number
    // bonus_win_user?: number
    // bonus_bet_base?: number
    // bonus_win_base?: number
  }

  const options = {
    ...messageOptions,
    type: 'GAME_ROUND',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userGameRound',
    messagePayload,
    options,
    userId,
  )
}
