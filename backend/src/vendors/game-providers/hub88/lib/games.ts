import * as api from './api'

export function getIdentifierForGameCode(gameCode: string) {
  return `hub88:${gameCode}`
}

export async function listGames() {
  return await api.listGames()
}
