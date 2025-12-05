import { gameLogger } from '../../lib/logger'
import { CoinFlipResolutionInterface } from 'src/modules/coinflip'
import { sleep } from 'src/util/helpers/timer'

import { publishGameResolutionEvent } from '../../rabbitmq'
import {
  GameResolutionError,
  type AvailableGames,
  type GameResolutionMessage,
  type GameResolutionInterface,
  type GameResolutionInterfaceResponse,
  type GameResolutionActionResponse,
} from '../../types'

const GameInterfaces: Record<AvailableGames, GameResolutionInterface<any>> = {
  coinflip: CoinFlipResolutionInterface,
}

async function responseHandler<T>(
  message: GameResolutionMessage<T>,
  action: (
    message: GameResolutionMessage<T>,
  ) => Promise<GameResolutionInterfaceResponse<T>>,
): Promise<GameResolutionActionResponse<T>> {
  const response = await action(message)
  if (response.success) {
    return {
      message: {
        ...message,
        gameInfo: response.gameInfo,
      },
    }
  }

  if (!response.success) {
    throw new GameResolutionError(response.error.message, response.error.code)
  } else {
    const message = 'Game Resolution Error - Uncaught Failure'
    throw new GameResolutionError(message)
  }
}

export async function handler<T>(message: GameResolutionMessage<T>) {
  const { attempts = 0, gameName, gameInfo, balanceUpdateTimestamp } = message

  if (attempts > 0) {
    await sleep(200)
  }

  // fetch relevant hooks for this particular game
  const { validateGame, calculateGameResult, closeoutBet, onError } =
    GameInterfaces[gameName]

  try {
    // pre-process message data
    const { message: validationMessage } = await responseHandler<T>(
      { attempts, gameName, gameInfo },
      validateGame,
    )

    // calculate game result
    // game should be finalized and ended -- the game should not be replayable
    const { message: outcomeMessage } = await responseHandler<T>(
      validationMessage,
      calculateGameResult,
    )

    // closeout bet(s)
    await responseHandler<T>(
      { ...outcomeMessage, balanceUpdateTimestamp },
      closeoutBet,
    )
  } catch (error) {
    const isKnownError = error instanceof GameResolutionError
    const errorTitle = isKnownError ? 'Known' : 'Unknown'

    gameLogger('GameResolutionMessage', { userId: null }).error(
      `Game Resolution Queue ${errorTitle} Error - ${error.message}`,
      { gameInfo: message.gameInfo, isKnownError, errorTitle },
      error,
    )
    const shouldRetry = await onError(message, error)
    if (shouldRetry) {
      publishGameResolutionEvent({
        ...message,
        attempts: attempts + 1,
      })
    }
  }
}
