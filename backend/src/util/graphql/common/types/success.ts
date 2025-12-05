import { objectType } from 'nexus'

export const SuccessType = objectType({
  name: 'Success',
  definition(type) {
    type.nonNull.boolean('success')
  },
})
