import { type ExchangeAndFormatCurrency } from 'app/hooks'

export const roundBalance = (num: number) => Math.floor(num * 100) / 100

export const rouletteChoiceToColor = choice => {
  if (choice === 1) {
    return 'Red'
  }
  if (choice === 2) {
    return 'Silver'
  }
  if (choice === 3) {
    return 'Gold'
  }
}

export const initialBetAmount = (balance: number) => {
  const userBalance = balance ? Math.floor(balance * 100) / 100 : 0

  let defaultBalance = 0
  if (userBalance >= 0.01) {
    defaultBalance = 0.01
  }
  if (userBalance >= 1) {
    defaultBalance = 1
  }
  if (userBalance >= 5) {
    defaultBalance = 5
  }

  return defaultBalance
}

export const modifyBet = (
  balance: number,
  betAmount: number,
  modifier: string | number,
  formatter?: ExchangeAndFormatCurrency,
) => {
  if (balance < 0.01) {
    return 0.0
  }

  if (modifier === 'max') {
    if (formatter) {
      const { exchangedAmount: displayBalance } = formatter(balance)
      return roundBalance(displayBalance)
    }
    return roundBalance(balance)
  }
  // 'max' is the only valid string
  if (typeof modifier !== 'number') {
    return 0.0
  }

  if (!betAmount || Number.isNaN(betAmount)) {
    betAmount = initialBetAmount(balance)
  }

  let newBetAmount = Math.max(0.01, betAmount * modifier)

  if (newBetAmount > balance) {
    newBetAmount = balance
  }
  if (formatter) {
    const { exchangedAmount: displayBetAmount } = formatter(newBetAmount)
    newBetAmount = displayBetAmount
  }

  newBetAmount = parseFloat(newBetAmount.toFixed(2))

  return newBetAmount
}

export const toFloat = (value: string) => {
  const parsedValue = parseFloat(value)
  return isNaN(parsedValue) ? null : parsedValue
}
