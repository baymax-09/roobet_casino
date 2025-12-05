import { objectType } from 'nexus'

export const CMSContentType = objectType({
  name: 'CMSContent',
  sourceType: {
    module: __dirname,
    export: 'DBCMSContent',
  },
  definition(type) {
    type.nonNull.string('lang')
    type.nonNull.string('name')
    type.nonNull.string('title')
    type.nonNull.string('content')
    type.nonNull.string('format')
    type.string('content_html')
  },
})
