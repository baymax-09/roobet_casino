import { objectType, unionType, enumType } from 'nexus'
import path from 'path'

export const QuestCriteriaType = enumType({
  name: 'QuestCriteriaType',
  description:
    'The type of criteria a user must complete to be eligible to start the quest.',
  members: [
    {
      name: 'PAGE_VIEW',
      description:
        'If the user visits a specified page, they meet the criteria.',
    },
    {
      name: 'NEW_PLAYER_INCENTIVE',
      description:
        'If the user performs all specified requirements (such as depositing a certain amount), they meet the criteria.',
    },
  ],
})

export const PageViewQuestSettingsType = objectType({
  name: 'PageViewQuestSettings',
  description: 'The settings for the PAGE_VIEW quest type.',
  isTypeOf(data) {
    return Boolean('urlPattern' in data && data.urlPattern?.length)
  },
  definition(type) {
    type.nonNull.string('urlPattern', {
      auth: null,
      description:
        'Should be a valid url pattern, such as `/mines` or `/page/:id`.',
    })
  },
})

export const NewPlayerIncentiveQuestSettingsType = objectType({
  name: 'NewPlayerIncentiveQuestSettings',
  description: 'The settings for the NEW_PLAYER_INCENTIVE quest type.',
  isTypeOf(data) {
    return Boolean(
      'wageredAmountUSD' in data &&
        data.wageredAmountUSD &&
        data.wageredAmountUSD > 0,
    )
  },
  definition(type) {
    type.nonNull.float('wageredAmountUSD', {
      auth: null,
      description:
        'The amount (USD) the user will need to deposit into their account to complete the quest.',
    })
  },
})

export const QuestCriteriaSettingsType = unionType({
  name: 'QuestCriteriaSettings',
  description: 'The union type of all quest settings.',
  definition(type) {
    type.members(PageViewQuestSettingsType, NewPlayerIncentiveQuestSettingsType)
  },
})

export const QuestTemplateType = objectType({
  name: 'QuestTemplate',
  description:
    'Contains all the configuration information that will be used in quests. Eg criteriaSettings.',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBQuestTemplate',
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
    type.objectId('rewardId', {
      auth: null,
      description:
        'The reward that the user will recieve upon completion of the quest.',
    })
  },
})
