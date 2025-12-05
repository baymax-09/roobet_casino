import { objectType } from 'nexus'
import path from 'path'

import { QuestCriteriaSettingsType, QuestCriteriaType } from './questTemplate'

export const QuestType = objectType({
  name: 'Quest',
  description:
    'A quest gives users a set of criteria that they must complete. They may receive a reward upon completion, or can be a general criteria that must be met.',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBQuest',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier for the quest.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.string('name', {
      auth: null,
      description: 'The name for the quest.',
    })
    type.nonNull.string('userId', {
      auth: null,
      description: 'The user id associated with the quest.',
    })
    type.nonNull.field('criteriaType', {
      auth: null,
      description:
        'The type of criteria a user must complete to be eligible to start the quest.',
      type: QuestCriteriaType,
    })
    type.nonNull.field('criteriaSettings', {
      auth: null,
      description:
        'The settings of the criteria a user must complete to be eligible to complete the quest.',
      type: QuestCriteriaSettingsType,
    })
    type.nonNull.boolean('completed', {
      auth: null,
      description: 'A flag for if the user has completed the quest.',
    })
    type.objectId('rewardId', {
      auth: null,
      description:
        'The reward that the user will recieve upon completion of the quest.',
    })
    type.float('userWageredAmountUSD', {
      auth: null,
      description:
        'The amount that the user has currently wagered towards the quest goal.',
    })
    type.float('progress', {
      auth: null,
      description: 'The current progress percentage towards the quest.',
    })
  },
})
