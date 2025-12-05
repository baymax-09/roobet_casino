import { makeSchema } from 'nexus'
import path from 'path'

import { config } from 'src/system'
import {
  authPlugin,
  DateScalar,
  JsonScalar,
  ObjectIdScalar,
  UUIDScalar,
  NonEmptyStringScalar,
  PositiveIntScalar,
  PositiveFloatScalar,
  featureFlagPlugin,
  requestValidatorsPlugin,
  headersPlugin,
  cacheValidatorPlugin,
} from 'src/util/graphql'
import { CommonGQL } from '../common'

import { type SchemaConfig } from 'nexus/dist/core'

export type GraphName = 'product' | 'admin'

const resolveGenDir = (directory: string, _path: string) =>
  path.join(directory, '..', '/generated', _path)

const customScalars = () => [
  DateScalar,
  ObjectIdScalar,
  JsonScalar,
  UUIDScalar,
  NonEmptyStringScalar,
  PositiveIntScalar,
  PositiveFloatScalar,
]

const buildSchema = (directory: string, schema: SchemaConfig): SchemaConfig => {
  return {
    features: {
      abstractTypeStrategies: {
        resolveType: false,
        isTypeOf: true,
      },
    },
    shouldGenerateArtifacts: config.isLocal,
    outputs: config.isLocal
      ? {
          schema: resolveGenDir(directory, 'schema.gen.graphql'),
          typegen: resolveGenDir(directory, 'nexusTypes.gen.ts'),
        }
      : false,
    contextType: {
      module: path.resolve(__dirname),
      export: 'Context',
    },
    plugins: [
      authPlugin(),
      featureFlagPlugin(),
      requestValidatorsPlugin(),
      headersPlugin(),
      cacheValidatorPlugin(),
    ],
    types: [...customScalars(), ...CommonGQL, ...schema.types],
  }
}

export const makeRootSchema = (
  directory: string,
  schema: SchemaConfig['types'],
) =>
  makeSchema(
    buildSchema(directory, {
      types: schema,
    }),
  )
