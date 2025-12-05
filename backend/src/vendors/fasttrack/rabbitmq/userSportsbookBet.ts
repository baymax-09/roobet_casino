import { type Options } from 'amqplib'

import { getCurrentDateTimeISO } from 'src/util/helpers/time'
import { getUserOrigin } from 'src/util/helpers/userOrigin'
import { getUserFiatCurrency } from 'src/modules/currency/types'
import {
  type BetSlip,
  type BetItem,
} from 'src/vendors/game-providers/slotegrator/sports/lib/types'
import { type ActiveBet } from 'src/modules/bet/documents/activeBetsMongo'

import { type SportsbookBetPayload, type Bet } from '../types'
import { publishAndLogMessage } from '../utils'

interface HandleUserSportsbookBetArgs {
  activeBet: ActiveBet
  rollback: boolean
}

export const publishUserSportsbookBetToFastTrack = async (
  message: HandleUserSportsbookBetArgs,
  messageOptions?: Options.Publish,
) => {
  const { activeBet, rollback = false } = message
  const { meta, state, userId } = activeBet

  if (!meta?.betslip) {
    return
  }

  const {
    uuid,
    amount,
    items,
    parameters: { total_odds },
  } = meta.betslip as BetSlip

  const messagePayload: SportsbookBetPayload = {
    activity_id: uuid,
    amount,
    bet_type: items.length > 1 ? 'Multi' : 'Single',
    odds: Number(total_odds),
    bets: getBetsFromItems(items),
    currency: getUserFiatCurrency(userId),
    exchange_rate: 1,
    is_cashout: state === 'refunded',
    origin: getUserOrigin(userId),
    status: rollback ? 'Rollback' : 'Approved',
    timestamp: getCurrentDateTimeISO(),
    type: state === 'settled' ? 'Settlement' : 'Bet',
    user_id: userId,
    bonus_wager_amount: meta.bonusAmount ?? 0,
  }

  const options = {
    ...messageOptions,
    type: 'SPORTSBOOK',
    persistent: true,
    headers: { cc: 'fasttrack' },
  }

  await publishAndLogMessage(
    'events.userSportsbookBet',
    messagePayload,
    options,
    userId,
  )
}

const getBetsFromItems = (items: BetItem[]) => {
  const bets: Bet[] = items.map(item => {
    const { event_id } = item
    const {
      market_name,
      sport_name,
      is_live,
      odds,
      tournament_name,
      outcome_name,
      scheduled,
      competitor_name,
    } = item.parameters

    const betItem: Bet = {
      event_name: event_id,
      market: market_name,
      match_start: scheduled ? new Date(scheduled).toISOString() : 'N/A',
      outcomes: [
        {
          criterion_name: market_name ?? 'N/A',
          outcome_label: outcome_name ?? 'N/A',
        },
      ],
      sports_name: sport_name,
      tournament_name,
      odds: Number(odds),
      is_live,
      meta: {
        competitor_name,
      },
    }
    return betItem
  })
  return bets
}
