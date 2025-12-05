import { GraphQLError, Kind } from 'graphql'
import { Types } from 'mongoose'
import { validate as validateUUID } from 'uuid'
import { scalarType, asNexusMethod } from 'nexus'
import {
  GraphQLNonEmptyString,
  GraphQLPositiveInt,
  GraphQLPositiveFloat,
} from 'graphql-scalars'

export const NonEmptyStringScalar = asNexusMethod(
  GraphQLNonEmptyString,
  'nonEmptyString',
  'string',
)
export const PositiveIntScalar = asNexusMethod(
  GraphQLPositiveInt,
  'positiveInt',
  'number',
)
export const PositiveFloatScalar = asNexusMethod(
  GraphQLPositiveFloat,
  'positiveFloat',
  'number',
)

export const DateScalar = scalarType({
  name: 'Date',
  asNexusMethod: 'date',
  sourceType: 'Date',
  description: 'Date field that gets serialized to an ISO string.',
  parseValue(value: any) {
    if (typeof value !== 'string') {
      throw new GraphQLError(
        `Can only parse string values but got a: ${typeof value}`,
        {},
      )
    }

    return new Date(value)
  },
  serialize(value: any) {
    if (isNaN(Date.parse(value))) {
      throw new GraphQLError(
        `Can only serialize date objects but got a: ${typeof value}`,
        {},
      )
    }

    return new Date(value).toISOString()
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
  },
})

export const JsonScalar = scalarType({
  name: 'Json',
  asNexusMethod: 'json',
  description: 'Shapeless JSON object scalar.',
  sourceType: 'string',
  parseValue(value) {
    return value
  },
  serialize(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast.fields
    }
    return null
  },
})

const getParsedObjectId = (value: any, errorMsg = '') => {
  try {
    if (!Types.ObjectId.isValid(value)) {
      throw new Error()
    }
    return new Types.ObjectId(value)
  } catch (err) {
    throw new GraphQLError(
      errorMsg.length
        ? errorMsg
        : `Error parsing input "${value}" as valid ObjectId`,
      {},
    )
  }
}

export const ObjectIdScalar = scalarType({
  name: 'ObjectId',
  asNexusMethod: 'objectId',
  sourceType: {
    module: __dirname,
    export: 'MongooseObjectId',
  },
  description:
    'A type for storing and validating ObjectIds for use with mongodb.',
  serialize(value: any) {
    return getParsedObjectId(
      value,
      `Error serializing value "${value}" as valid ObjectId`,
    ).toString()
  },
  parseValue(value: any) {
    return getParsedObjectId(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return getParsedObjectId(ast.value)
    }
    throw new GraphQLError(
      `Error serializing ast as valid ObjectId. Expected ${Kind.STRING} or ${Kind.INT} but received ${ast.kind}`,
      {},
    )
  },
})

const getParsedUUID = (value: any, errorMsg = '') => {
  try {
    if (!validateUUID(value)) {
      throw new Error()
    }
    return value
  } catch (err) {
    throw new GraphQLError(
      errorMsg.length
        ? errorMsg
        : `Error parsing input "${value}" as valid UUID`,
      {},
    )
  }
}

export const UUIDScalar = scalarType({
  name: 'UUID',
  asNexusMethod: 'uuid',
  description:
    'A type for storing and validating UUIDs for use with older document stores.',
  sourceType: 'string',
  serialize(value: any) {
    return getParsedUUID(
      value,
      `Error serializing value "${value}" as valid UUID`,
    ).toString()
  },
  parseValue(value: any) {
    return getParsedUUID(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return getParsedUUID(ast.value)
    }
    throw new GraphQLError(
      `Error serializing ast as valid UUID. Expected ${Kind.STRING} but received ${ast.kind}`,
      {},
    )
  },
})
