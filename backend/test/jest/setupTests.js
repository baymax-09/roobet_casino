const redisMock = require('redis-mock')
const rethinkMock = require('rethinkdb-mock')
const ObjectId = require('mongoose').Types.ObjectId

jest.mock('redis', () => redisMock)
jest.mock('rethinkdbdash', rethinkMock)
jest.mock('socket.io-redis', () => ({
  createAdapter: jest.fn(),
}))

const mongoMock = () => {
  const Schema = jest.fn().mockImplementation(() => ({
    index: jest.fn(),
    plugin: jest.fn(),
    virtual: () => ({
      get: jest.fn(),
    }),
    post: jest.fn(),
    discriminator: jest.fn(),
  }))

  Schema.Types = {
    Mixed: '',
  }

  return {
    Schema,
    model: name => ({
      collection: {
        name,
      },
      create: entity => ({
        ...entity,
        _id: new ObjectId(),
        toObject: () => entity,
      }),
      insertMany: entities =>
        entities.map(entity => ({
          ...entity,
          toObject: () => entity,
        })),
    }),
    index: jest.fn(),
  }
}

jest.mock('src/system', () => ({
  winston: jest.requireActual('src/system/logger').winston,
  scopedLogger: () => jest.requireActual('src/system/logger').winston,
  config: jest.requireActual('src/system/config').config,
  initializeAWS: jest.fn(),
  r: {
    table: jest.fn(),
    row: jest.fn(field => ({
      merge: jest.fn(data => ({ field, data, op: 'merge' })),
      add: jest.fn(data => ({ field, data, op: 'add' })),
    })),
  },
  redis: {
    multi: jest.fn(),
  },
  io: {
    to: () => ({
      emit: jest.fn(),
    }),
  },
  mongoose: mongoMock(),
  megaloMongo: mongoMock(),
  schema: {
    migrate: jest.fn(),
  },
}))

jest.mock('src/util/features', () => ({
  getFeatureFlag: jest.fn().mockImplementation(() => {}),
  determineSingleFeatureAccess: jest.fn().mockImplementation(({}) => false),
}))

jest.mock('src/util/named-lock', () => {
  let failNextLock = false
  const usableMutex = { release: () => Promise.resolve() }

  return {
    MutexLock: {
      acquireLock: async (_userId, _namespace, _resource, _expiresInMS) => {
        if (failNextLock) {
          failNextLock = false
          return null
        }
        return usableMutex
      },
      failNextLock: value => {
        failNextLock = !!value
      },
    },
  }
})
