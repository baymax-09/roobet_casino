import * as currencyLib from '../../../../../modules/currency/lib/currencyFormat'
import * as balanceLib from '../../../../../modules/user/balance/lib'
import * as test from '../../test'
import {
  YGGDRASIL_LAUNCH_ORG,
  YggdrasilInvalidSessionTokenError,
} from '../../types'
import * as authLib from '../auth'
import { handleYggdrasilPlayerInfo } from './playerInfo'

describe('Player Info Handler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Get A Response As Expected',
      inputs: {
        req: {
          org: YGGDRASIL_LAUNCH_ORG,
          sessionToken: 'test',
          lang: 'en',
          categories: [],
          tags: [],
          version: 5,
        },
        user: {
          id: 'e28115b5-e609-486b-a17a-159827a8ee36',
          countryCode: 'US',
        },
        balance: {
          balance: 100,
          currency: 'usdc',
        },
      },
      expects: {
        throws: false,
        result: {
          code: 0,
          data: {
            balance: 100,
            country: 'US',
            currency: 'usd',
            homeCurrency: 'usd',
            organization: YGGDRASIL_LAUNCH_ORG,
            playerId: 'e28115b5e609486ba17a159827a8ee36',
          },
        },
        calls: {
          loggerError: { 0: [] },
          userFromToken: { 1: ['test'] },
          getSelectedBalanceFromUser: {
            1: [
              {
                user: {
                  countryCode: 'US',
                  id: 'e28115b5-e609-486b-a17a-159827a8ee36',
                },
              },
            ],
          },
          currencyExchange: { 1: [100, 'usd'] },
        },
      },
    },
    {
      name: 'Throws Without User From Token',
      inputs: {
        req: {
          org: YGGDRASIL_LAUNCH_ORG,
          sessionToken: 'test',
          lang: 'en',
          categories: [],
          tags: [],
          version: 5,
        },
        user: null,
        balance: null,
      },
      expects: {
        throws: new YggdrasilInvalidSessionTokenError(
          'test',
          expect.any(String),
        ),
        result: {},
        calls: {
          loggerError: {
            1: [
              'Yggdrasil Sent An Invalid Session Token',
              { gameId: 'N/A', token: 'test' },
            ],
          },
          userFromToken: { 1: ['test'] },
          getSelectedBalanceFromUser: { 0: [] },
          currencyExchange: { 0: [] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { req, user, balance } = inputs
    const { throws, result, calls } = expects

    // Mocks
    const logger = test.getMockedLogger()

    jest.spyOn(authLib, 'getUserFromAuthToken').mockResolvedValue(user)
    jest
      .spyOn(balanceLib, 'getSelectedBalanceFromUser')
      .mockResolvedValue({ balance: balance?.balance ?? 0, balanceType: 'usd' })
    jest
      .spyOn(currencyLib, 'currencyExchange')
      .mockResolvedValue(balance?.balance ?? 0)

    // Test
    if (throws !== false && typeof throws === 'object') {
      await expect(handleYggdrasilPlayerInfo(req)).rejects.toThrow(throws)
    } else {
      await expect(handleYggdrasilPlayerInfo(req)).resolves.toEqual(result)
    }

    expect(balanceLib.getSelectedBalanceFromUser).toHaveBeenCalledWithNthArgs(
      calls.getSelectedBalanceFromUser,
      'getSelectedBalanceFromUser',
    )
    expect(authLib.getUserFromAuthToken).toHaveBeenCalledWithNthArgs(
      calls.userFromToken,
      'getUserFromAuthToken',
    )
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.loggerError,
      'logger.error',
    )
  })
})
