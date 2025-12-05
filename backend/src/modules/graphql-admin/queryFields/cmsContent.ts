import { queryField, stringArg, nonNull } from 'nexus'

import { getCmsDocument } from 'src/modules/cms/documents/cms_content'

import { CMSContentType } from '../types/cmsContent'

export const CMSContentQueryField = queryField('cmsContent', {
  type: CMSContentType,
  args: { name: nonNull(stringArg()), lang: nonNull(stringArg()) },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'legal', action: 'read' }],
  },
  resolve: async (_, args) =>
    (await getCmsDocument(args.name, args.lang)) ?? null,
})
