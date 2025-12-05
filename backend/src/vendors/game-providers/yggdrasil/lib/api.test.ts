import * as fetch from 'node-fetch'
import * as test from '../test'
import {
  GameModeIntentMap,
  YggdrasilDisabledError,
  YggdrasilInvalidGameError,
  YggdrasilRemoteError,
  type GamesUpdaterResult,
} from '../types'
import * as constants from '../types/constants'
import {
  createYggdrasilSession,
  getYggdrasilLaunchParams,
  updateYggdrasilGamesList,
} from './api'
import * as authMod from './auth'

jest.mock('../../../../system/config', () => {
  const actual = jest.requireActual('../../../../system/config')
  return {
    ...actual,
    yggdrasil: {
      ...actual.yggdrasil,
      launchIntent: 'live',
    },
  }
})

describe('Client API - Games', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const yggdrasilGames = {
    games: [
      {
        id: 10522,
        name: 'Primal Hunter GigaBlox™',
        type: 'slot',
        globalReleaseDate: '2024-03-28T00:00:00+01:00',
        rtpLevels: [
          {
            rtp: 96.04,
            rtpGroup: 'global', // some games support multiple payout levels, but one is usually described as 'global'. It can be considered the default.
          },
          {
            rtp: 94,
            rtpGroup: '94',
          },
          {
            rtp: 90.5,
            rtpGroup: '90.5',
          },
          {
            rtp: 86,
            rtpGroup: '86',
          },
        ],
        features: [
          'Free spins', // 'Free spins' is an in-game feature, where a single bet may be rendered as multiple spins. Not to be confused with 'prepaids', where operator covers cost of players bets.
          'Gigablox',
        ],
      },
    ],
  }

  const cases = [
    {
      name: 'Gets Games As Expected',
      inputs: {
        enabled: true,
        resMeta: { status: 200, statusText: 'OK', ok: true },
        resData: yggdrasilGames,
      },
      expects: {
        throws: false,
        gameCount: yggdrasilGames.games.length,
        calls: {
          logError: { 0: [] },
        },
      },
    },
    {
      name: 'Bubbles Remote Errors As Expected',
      inputs: {
        enabled: true,
        resMeta: { status: 500, statusText: 'Server Error', ok: false },
        resData: {},
      },
      expects: {
        throws: new YggdrasilRemoteError(
          {
            status: 500,
            statusText: 'Server Error',
            url: expect.stringContaining('/games'),
          },
          expect.any(String),
        ),
        gameCount: 0,
        calls: {
          logError: { 1: [expect.any(Error), expect.any(String)] },
        },
      },
    },
    {
      name: 'Throws Error When Disabled',
      inputs: {
        enabled: false,
        resMeta: {},
        resData: {},
      },
      expects: {
        throws: new YggdrasilDisabledError(expect.any(String)),
        gameCount: 0,
        calls: {
          logError: { 1: ['Yggdrasil Is Disabled', expect.any(Object)] },
        },
      },
    },
    {
      name: 'Throws Error With Unexpected Data',
      inputs: {
        enabled: true,
        resMeta: { status: 200, statusText: 'OK', ok: true },
        resData: { games: { foo: 'bar' } },
      },
      expects: {
        throws: new YggdrasilInvalidGameError(expect.any(String)),
        gameCount: 0,
        calls: {
          logError: { 1: ['Yggdrasil Sent Invalid Games', expect.any(Object)] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { enabled, resMeta, resData } = inputs
    const { throws, calls, gameCount } = expects

    // Mock config
    jest.spyOn(constants, 'getConfig').mockReturnValue({ enabled })

    // Mock logger
    const logger = test.getMockedLogger()

    // Mock fetch
    const meta = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    const headers = new fetch.Headers(meta)
    const responseInit: fetch.ResponseInit = { headers }
    jest.spyOn(fetch, 'default').mockResolvedValueOnce(
      new fetch.Response(JSON.stringify(resData), {
        ...responseInit,
        ...resMeta,
      }),
    )

    if (throws !== false && typeof throws === 'object') {
      await expect(updateYggdrasilGamesList()).rejects.toThrow(throws)
    } else {
      let results: GamesUpdaterResult | undefined
      await expect(
        updateYggdrasilGamesList().then(res => {
          results = res
        }),
      ).resolves.not.toThrow()

      expect(results).toBeDefined()
      expect(results!.games).toBeDefined()
      expect(results!.recalls).toBeDefined()
      expect(Object.values(results!.games)).toHaveLength(gameCount)
      expect(logger.error).toHaveBeenCalledWithNthArgs(
        calls.logError,
        'logger.error',
      )
    }
  })
})

describe('Client API - Launch Params', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const gameId = 10522
  const region = 'malta'
  const modes = ['live', 'demo', 'test', 'unknown']
  const cases = modes.map(mode => ({
    name: `Gets Launch Params For ${mode[0].toUpperCase()}${mode.slice(
      1,
    )} Mode`,
    inputs: {
      mode,
      gameIdentifier: `${constants.YGGDRASIL_PROVIDER_NAME}:${gameId}`,
    },
    expects: {
      result: {
        intent: GameModeIntentMap[mode] ?? 'test',
        region,
        gameId,
      },
    },
  }))

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { mode, gameIdentifier } = inputs
    const { result } = expects

    const launchParams = getYggdrasilLaunchParams(mode, gameIdentifier)

    expect(launchParams).toBeDefined()
    expect(launchParams).toBeInstanceOf(Object)
    expect(launchParams).toEqual(result)
  })
})

describe('Client API - Session', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Creates Session As Expected',
      inputs: {
        user: { id: 1, name: 'test' },
      },
      expects: {
        result: expect.any(String),
        calls: {
          createAuthToken: { 1: [{ id: 1, name: 'test' }] },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { user } = inputs
    const { result, calls } = expects

    jest.spyOn(authMod, 'createAuthToken').mockReturnValue('test-token')

    const gameSessionId = await createYggdrasilSession(user)

    expect(gameSessionId).toBeDefined()
    expect(typeof gameSessionId).toBe('string')
    expect(gameSessionId).toEqual(result)
    expect(authMod.createAuthToken).toHaveBeenCalledWithNthArgs(
      calls.createAuthToken,
      'createAuthToken',
    )
  })
})
