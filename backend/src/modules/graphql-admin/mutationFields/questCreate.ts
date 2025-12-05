import { GraphQLError } from 'graphql'
import { mutationField, nonNull, inputObjectType } from 'nexus'

import { getUserById } from 'src/modules/user'

import { getQuestTemplate } from 'src/modules/inventory/documents/questTemplates'
import { QuestsDAO } from 'src/modules/inventory/lib'

const QuestCreateInput = inputObjectType({
  name: 'QuestCreateInput',
  definition(type) {
    type.nonNull.id('questTemplateId', {
      auth: null,
      description: 'The id of the quest template.',
    })
    type.nonNull.string('userId', {
      auth: null,
      description: 'The id of the user that will begin the quest.',
    })
  },
})

export const QuestCreateFromTemplateMutationField = mutationField(
  'questCreateFromTemplate',
  {
    description: 'Creates a quest from a quest template.',
    type: nonNull('Quest'),
    args: { data: nonNull(QuestCreateInput) },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'inventory', action: 'create' }],
    },
    resolve: async (_, { data: { questTemplateId, userId } }) => {
      const filter = { _id: questTemplateId }
      const questTemplate = await getQuestTemplate(filter)
      if (!questTemplate) {
        throw new GraphQLError('No quest template found.', {})
      }
      const validUser = await getUserById(userId)
      if (!validUser) {
        throw new GraphQLError('Invalid user id provided.', {})
      }
      const payload = {
        criteriaSettings: questTemplate.criteriaSettings,
        criteriaType: questTemplate.criteriaType,
        rewardId: questTemplate.rewardId,
        name: questTemplate.name,
        userId,
        completed: false,
        ...(questTemplate.criteriaType === 'NEW_PLAYER_INCENTIVE' && {
          userWageredAmountUSD: 0,
        }),
      }
      return await QuestsDAO.createQuest({ payload })
    },
  },
)
