import { APIValidationError } from 'src/util/errors'
import { config } from 'src/system'
import {
  type CoinFlipOutcome,
  CoinFlipOutcomes,
} from '../documents/coinFlipGames'
import { exchangeAndFormatCurrency } from 'src/modules/currency/lib/currencyFormat'

const { maxBet, minBet } = config.coinflip

export async function validateOpenGameInputs(
  amount: any,
  guess: any,
  count: any,
  user: any,
) {
  if (!amount) {
    throw new APIValidationError('supply__amount')
  }

  if (isNaN(amount)) {
    throw new APIValidationError('invalid_amount')
  }

  if (amount > maxBet) {
    const convertedMax = await exchangeAndFormatCurrency(maxBet, user)
    throw new APIValidationError('bet__convertedMaximum_bet', [
      `${convertedMax}`,
    ])
  }

  if (amount < minBet) {
    const convertedMin = await exchangeAndFormatCurrency(minBet, user)
    throw new APIValidationError('bet__convertedMinimum_bet', [
      `${convertedMin}`,
    ])
  }

  if (typeof guess !== 'string') {
    throw new APIValidationError('Guess value must be a string.')
  }

  if (!CoinFlipOutcomes.includes(guess as CoinFlipOutcome)) {
    throw new APIValidationError('invalid_guess')
  }

  if (!count) {
    throw new APIValidationError('supply__count')
  }

  if (isNaN(count)) {
    throw new APIValidationError('invalid_count')
  }

  const parsedCount = parseInt(count)
  if (parsedCount < 1 || parsedCount > 10) {
    throw new APIValidationError('count__range')
  }
}
