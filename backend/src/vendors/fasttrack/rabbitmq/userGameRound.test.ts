import { publishUserGameRoundMessageToFastTrack } from './userGameRound'

import * as eventHandlers from '../../../util/rabbitmq/lib/eventHandlers'

describe('publishUserGameRoundMessageToFastTrack', () => {
  beforeEach(() => {
    jest
      .spyOn(eventHandlers, 'publishMessageToEventsExchange')
      .mockResolvedValue()
  })

  it('should return undefined when thirdParty is slotegrator', async () => {
    const message = {
      bet: {
        thirdParty: 'slotegrator',
      },
    }
    await expect(
      publishUserGameRoundMessageToFastTrack(message),
    ).resolves.not.toThrow()
    expect(eventHandlers.publishMessageToEventsExchange).not.toHaveBeenCalled()
  })

  it('should return a GameRound object when thirdParty is not slotegrator', async () => {
    const message = {
      bet: {
        userId: '123',
        category: 'slots',
        gameNameDisplay: 'Game Name',
        gameName: 'game_name',
        betId: 'bet_id',
        gameId: 'game_id',
        gameIdentifier: 'game_identifier',
        profit: 10,
        betAmount: 100,
        thirdParty: 'vendor',
      },
    }

    await expect(
      publishUserGameRoundMessageToFastTrack(message),
    ).resolves.not.toThrow()

    expect(eventHandlers.publishMessageToEventsExchange).toHaveBeenCalledWith(
      'events.userGameRound',
      expect.objectContaining({
        user_id: '123',
        round_id: 'bet_id',
        game_id: 'game_identifier',
        game_name: 'Game Name',
        game_type: 'slots',
        vendor_id: 'vendor',
        vendor_name: 'vendor',
        real_bet_user: 100,
        real_win_user: 110,
        real_bet_base: 100,
        real_win_base: 110,
        device_type: 'unknown',
        user_currency: expect.any(String),
        timestamp: expect.any(String),
        origin: expect.any(String),
      }),
      expect.objectContaining({
        type: 'GAME_ROUND',
        persistent: true,
        headers: { cc: 'fasttrack' },
      }),
    )
  })
})
