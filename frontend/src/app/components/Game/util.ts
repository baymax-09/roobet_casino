import {
  type TPGame,
  type TPGameEssential,
  type NormalizedTPGame,
  type NormalizedTPGameEssential,
} from 'common/types'
import { getCachedSrc } from 'common/util'

function normalize(
  game: TPGameEssential | TPGame,
  type,
): NormalizedTPGameEssential | NormalizedTPGame {
  const mutatedGame = {
    ...game,
    searchImage: getCachedSrc({
      src: game.squareImage,
      width: 81,
      height: 81,
      quality: 50,
    }),
    cachedSquareImage: getCachedSrc({
      src: game.squareImage,
      width: 200,
      quality: 50,
    }),
    link: `/${type}/${game.identifier}`,
  }
  return mutatedGame
}

export function normalizeGameEssential(
  game: TPGameEssential,
  type,
): NormalizedTPGameEssential {
  return normalize(game, type) as NormalizedTPGameEssential
}

export function normalizeGame(game: TPGame, type): NormalizedTPGame {
  return normalize(game, type) as NormalizedTPGame
}
