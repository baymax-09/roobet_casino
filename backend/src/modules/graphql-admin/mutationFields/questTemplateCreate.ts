import { mutationField, nonNull, inputObjectType } from 'nexus'

import { QuestsTemplatesDAO } from 'src/modules/inventory/lib'

const QuestSettingsInput = inputObjectType({
  name: 'QuestSettingsInput',
  definition(type) {
    type.string('urlPattern', {
      auth: null,
      description:
        'Should be a valid url pattern, such as `/mines` or `/page/:id`. Usable with the PAGE_VIEW criteriaType',
    })
    type.float('wageredAmountUSD', {
      auth: null,
      description:
        'The amount (USD) the user will need to deposit into their account to complete the quest.',
    })
  },
})

const QuestTemplateCreateInput = inputObjectType({
  name: 'QuestTemplateCreateInput',
  definition(type) {
    type.nonNull.string('name', {
      auth: null,
      description: 'The name of this quest.',
    })
    type.nonNull.field('criteriaType', {
      auth: null,
      description:
        'The type of criteria a user must complete to be eligible to start the quest.',
      type: 'QuestCriteriaType',
    })
    type.nonNull.field('criteriaSettings', {
      auth: null,
      description:
        'The settings of the criteria a user must complete to be eligible to start the quest.',
      type: QuestSettingsInput,
    })
    type.objectId('rewardId', {
      auth: null,
      description:
        'The reward that the user will recieve upon completion of the quest.',
    })
  },
})

export const QuestTemplateCreateMutationField = mutationField(
  'questTemplateCreate',
  {
    description: 'Creates a quest template.',
    type: nonNull('QuestTemplate'),
    args: { data: nonNull(QuestTemplateCreateInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'create' }],
    },
    resolve: async (_, { data }) => {
      return await QuestsTemplatesDAO.createQuestTemplate({ item: data })
    },
  },
)
