import { type NextFunction, type Request, type Response } from 'express'
import { HandActionType, HandWagerType } from '../types/player'
import { checkGameId, checkHandAction, checkStartCall } from './validation'

// Mocks for BlackjackError
jest.mock('../types/errors', () => ({
  BlackjackError: {
    logAndReturnForClient: jest.fn(error => {
      throw error
    }),
  },
  BlackjackInvalidGameIdError: class {
    constructor(
      public logScope,
      public gameId,
    ) {}
  },
  BlackjackInvalidRequestError: class {
    constructor(
      public gameId,
      public logScope,
    ) {}
  },
  BlackjackInvalidHandError: class {
    constructor(
      public gameId,
      public logScope,
      public userId,
      public handIndex,
      public action,
    ) {}
  },
  BlackjackAggregateError: class {
    constructor(
      public gameId,
      public logScope,
      public errors,
    ) {}
  },
  BlackjackNonGamePlayerError: class {
    constructor(
      public logScope,
      public gameId,
      public userId,
    ) {}
  },
}))

describe('Test checkGameId RequestHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Calls `next` When `gameId` Is Valid',
      inputs: {
        req: {
          params: { gameId: '123' },
        },
        res: {},
        next: jest.fn(),
      },
      expects: {
        nextCalled: true,
        errorThrown: false,
      },
    },
    {
      name: 'Throws An Error When `gameId` Is Empty',
      inputs: {
        req: {
          params: { gameId: '' },
        },
        res: {},
        next: jest.fn(),
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
    {
      name: 'Throws An Error When `gameId` Is Missing',
      inputs: {
        req: {
          params: { gameId: undefined as unknown as string },
        },
        res: {},
        next: jest.fn(),
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { req, res, next } = inputs
    const mockReq: Partial<Request> = { ...req }
    const mockRes: Partial<Response> = { ...res }
    const nextFunction: NextFunction = next

    try {
      checkGameId(mockReq as Request, mockRes as Response, nextFunction)
      expect(expects.errorThrown).toBe(false)
    } catch (error) {
      expect(expects.errorThrown).toBe(true)
    }

    if (expects.nextCalled) {
      expect(nextFunction).toHaveBeenCalled()
    } else {
      expect(nextFunction).not.toHaveBeenCalled()
    }
  })
})

describe('Test checkHandAction RequestHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Calls `next` When All Conditions Are Met',
      inputs: {
        action: HandActionType.Hit,
        req: {
          params: { gameId: '123' },
          user: { id: 'user1' },
          body: { handIndex: 1 },
        },
        isBlackjackActionRequest: true,
        isBlackjackInsureRequest: false,
      },
      expects: {
        nextCalled: true,
        errorThrown: false,
      },
    },
    {
      name: 'Throws When `gameId` Is Invalid',
      inputs: {
        action: HandActionType.Stand,
        req: {
          params: { gameId: undefined as unknown as string },
          user: { id: 'user1' },
          body: { handIndex: 0 },
        },
        isBlackjackActionRequest: true,
        isBlackjackInsureRequest: false,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
    {
      name: 'Throws When `handIndex` Is Invalid',
      inputs: {
        action: HandActionType.DoubleDown,
        req: {
          params: { gameId: '123' },
          user: { id: 'user1' },
          body: { handIndex: -1 },
        },
        isBlackjackActionRequest: true,
        isBlackjackInsureRequest: false,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
    {
      name: 'Throws When Insurance Request Is Invalid',
      inputs: {
        action: HandActionType.Insurance,
        req: {
          params: { gameId: '123' },
          user: { id: 'user1' },
          body: { handIndex: 0 },
        },
        isBlackjackActionRequest: true,
        isBlackjackInsureRequest: false,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
  ]

  it.each(cases)('$name', async ({ inputs, expects }) => {
    const { action, req, isBlackjackActionRequest, isBlackjackInsureRequest } =
      inputs
    const mockReq: Partial<Request> = { ...req }
    const mockRes: Partial<Response> = {}
    const nextFunction: NextFunction = jest.fn()

    // Mocking dependent functions
    jest.mock('../types/requests', () => ({
      isBlackjackActionRequest: jest
        .fn()
        .mockReturnValue(isBlackjackActionRequest),
      isBlackjackInsureRequest: jest
        .fn()
        .mockReturnValue(isBlackjackInsureRequest),
    }))

    const handler = checkHandAction(action)

    try {
      handler(mockReq as Request, mockRes as Response, nextFunction)
      if (expects.errorThrown) {
        expect(expects.errorThrown).toBe(false)
      }
    } catch (error) {
      if (!expects.errorThrown) {
        expect(expects.errorThrown).toBe(true)
      }
    }

    if (expects.nextCalled) {
      expect(nextFunction).toHaveBeenCalled()
    } else {
      expect(nextFunction).not.toHaveBeenCalled()
    }
  })
})

describe('Test checkStartCall RequestHandler', () => {
  const cases = [
    {
      name: 'Calls `next` For A Valid Start Game Request',
      inputs: {
        req: {
          params: { gameId: '123' },
          user: { id: 'user1' },
          body: {
            seats: [
              {
                playerId: 'user1',
                wagers: [
                  {
                    type: HandWagerType.Main,
                    amount: 0,
                  },
                ],
              },
            ],
          },
        },
        gameIdOrDefaultWithError: ['123', null],
        isStartGameRequest: true,
      },
      expects: {
        nextCalled: true,
        errorThrown: false,
      },
    },
    {
      name: 'Throws For Invalid Start Game Request',
      inputs: {
        req: {
          params: { gameId: '123' },
          user: { id: 'user1' },
          body: { seats: [{ playerId: 'user1' }] },
        },
        gameIdOrDefaultWithError: ['123', null],
        isStartGameRequest: false,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
    {
      name: 'Throws When User Is Not A Game Player',
      inputs: {
        req: {
          params: { gameId: '123' },
          user: { id: 'user2' },
          body: {
            seats: [
              {
                playerId: 'user1',
                wagers: [
                  {
                    type: HandWagerType.Main,
                    amount: 0,
                  },
                ],
              },
            ],
          },
        },
        gameIdOrDefaultWithError: ['123', null],
        isStartGameRequest: true,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
    {
      name: 'Throws For Invalid `gameId` In Start Game Request',
      inputs: {
        req: {
          params: { gameId: undefined as unknown as string },
          user: { id: 'user1' },
          body: { seats: [{ playerId: 'user1' }] },
        },
        gameIdOrDefaultWithError: [
          'missing-game-id',
          new Error('Missing Game ID'),
        ],
        isStartGameRequest: false,
      },
      expects: {
        nextCalled: false,
        errorThrown: true,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const mockReq: Partial<Request> = { ...req }
    const mockRes: Partial<Response> = {}
    const nextFunction: NextFunction = jest.fn()
    try {
      checkStartCall(mockReq as Request, mockRes as Response, nextFunction)
      if (expects.errorThrown) {
        expect(expects.errorThrown).toBe(false)
      }
    } catch (error) {
      if (!expects.errorThrown) {
        expect(expects.errorThrown).toBe(true)
      }
    }

    if (expects.nextCalled) {
      expect(nextFunction).toHaveBeenCalled()
    } else {
      expect(nextFunction).not.toHaveBeenCalled()
    }
  })
})
