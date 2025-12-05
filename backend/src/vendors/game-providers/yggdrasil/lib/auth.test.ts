/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import jwt from 'jsonwebtoken'
import * as userPwdLib from '../../../../modules/auth/documents/user_password'
import * as test from '../test'
import {
  YGGDRASIL_PROVIDER_NAME,
  YGGDRASIL_SESSION_KEY_ALGORITHM,
  YGGDRASIL_SESSION_KEY_EXPIRATION,
} from '../types'
import { createAuthToken, getUserFromAuthToken, validateRequest } from './auth'

describe('Auth - Create Token', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Creates Token As Expected',
      inputs: {
        user: { id: 1, name: 'test' },
      },
      expects: {
        result: expect.any(String),
        calls: {
          jwtSign: {
            1: [
              { id: 1, service: YGGDRASIL_PROVIDER_NAME },
              expect.any(String),
              {
                algorithm: YGGDRASIL_SESSION_KEY_ALGORITHM,
                expiresIn: YGGDRASIL_SESSION_KEY_EXPIRATION,
              },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { user } = inputs
    const { result, calls } = expects

    jest.spyOn(jwt, 'sign')

    const token = createAuthToken(user)

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token).toEqual(result)
    expect(jwt.sign).toHaveBeenCalledWithNthArgs(calls.jwtSign, 'jwt.sign')
  })
})

describe('Auth - User From Token', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const testUser = { id: 1, name: 'test' }
  const cases = [
    {
      name: 'Gets User As Expected',
      inputs: {
        user: testUser,
      },
      expects: {
        result: testUser,
        calls: {
          decodeToken: {
            1: [expect.any(String), YGGDRASIL_PROVIDER_NAME],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { user } = inputs
    const { result, calls } = expects

    jest.spyOn(userPwdLib, 'decodeToken').mockResolvedValue({ user } as any)

    const decodedUser = await getUserFromAuthToken('token')

    expect(decodedUser).toBeDefined()
    expect(decodedUser).toBeInstanceOf(Object)
    expect(decodedUser).toEqual(result)
    expect(userPwdLib.decodeToken).toHaveBeenCalledWithNthArgs(
      calls.decodeToken,
      'userPwdLib.decodeToken',
    )
  })
})

describe('Auth - Validate Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const actualOrg = 'roobet'
  const nonAuthPaths = ['endwager']
  const initPaths = ['playerinfo']
  const authPaths = ['playerinfo', 'getbalance', 'wager']
  const userPlayers = [
    { id: 1, playerid: 1 },
    { id: 2, playerid: 1 },
  ]
  const orgs = [actualOrg, 'notroobet']
  const cases = orgs
    .map(org =>
      userPlayers
        .map(pair =>
          authPaths.concat(nonAuthPaths).map(path => ({
            name: `Validates ${org} ${path} Request ${
              pair.id === pair.playerid && org === actualOrg
                ? 'As Expected'
                : 'And Throws'
            }`,
            inputs: {
              req: {
                query: {
                  org,
                  sessiontoken: 'key',
                  ...(initPaths.includes(path)
                    ? {}
                    : { playerid: pair.playerid }),
                },
                url: `http://pambet.test/${path}.json`,
              },
              res: {
                status: (code: number) => ({
                  json: (data: any) => ({ code, data }),
                }),
              },
              next: jest.fn(),
              needsAuth: authPaths.includes(path),
              user: { id: pair.id },
            },
            expects: {
              throws:
                (!initPaths.includes(path) && pair.id !== pair.playerid) ||
                org !== actualOrg,
              calls: {
                decodeToken: {
                  1: [expect.any(String), YGGDRASIL_PROVIDER_NAME],
                },
              },
            },
          })),
        )
        .flat(),
    )
    .flat()

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { req, res, next, needsAuth, user } = inputs
    const { throws } = expects

    // Mocks
    jest.spyOn(userPwdLib, 'decodeToken').mockResolvedValue({ user } as any)
    test.getMockedLogger()

    if (throws !== false) {
      await expect(
        validateRequest(req as any, res as any, next),
      ).resolves.not.toThrow()
      expect(next).not.toHaveBeenCalled()
    } else {
      await expect(
        validateRequest(req as any, res as any, next),
      ).resolves.not.toThrow()
      expect(next).toHaveBeenCalled()
    }

    if (needsAuth) {
      expect(userPwdLib.decodeToken).toHaveBeenCalledWithNthArgs(
        expects.calls.decodeToken,
        'userPwdLib.decodeToken',
      )
    }
  })
})
