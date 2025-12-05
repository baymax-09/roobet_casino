export const SPORTSBOOK_GAME_IDENTIFIER = 'slotegrator:sportsbook-1'

export const isSportsBettingGame = (gameIdentifier: string): boolean => {
  return gameIdentifier === SPORTSBOOK_GAME_IDENTIFIER
}
