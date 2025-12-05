import path from 'path'
import { objectType } from 'nexus'

export const UserSystemStatusType = objectType({
  name: 'UserSystemStatus',
  sourceType: {
    module: path.resolve(
      __dirname,
      '../../../..',
      'src/modules/userSettings/lib/index.ts',
    ),
    export: 'UserSystemStatus',
  },
  definition(type) {
    type.nonNull.boolean('enabled')
    type.string('requiredKycLevel')
  },
})
