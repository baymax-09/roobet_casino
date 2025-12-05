export type QuestCriteriaType = 'PAGE_VIEW' | 'NEW_PLAYER_INCENTIVE'

interface NewPlayerIncentiveCriteriaSettings {
  wageredAmountUSD?: number
}

interface PageViewCriteriaSettings {
  urlPattern?: string
}

export type QuestCriteriaSettings =
  | NewPlayerIncentiveCriteriaSettings
  | PageViewCriteriaSettings

export interface QuestTemplate {
  id: string
  name: string
  criteriaType: QuestCriteriaType
  rewardId: string
}

export interface DBQuestTemplate extends QuestTemplate {
  criteriaSettings: QuestCriteriaSettings
}

export interface DefaultQuest extends QuestTemplate {
  urlPattern?: string
  wageredAmountUSD?: number
}

export interface QuestTemplateResults {
  questTemplates: DBQuestTemplate[]
}

export interface Quest extends QuestTemplate {
  userId: string
  completed: boolean
  userWageredAmountUSD?: number
  progress: number
}

export interface QuestsResults {
  quests: Quest[]
}
export interface QuestsResultsACP {
  questsACP: Quest[]
}
/*
 * ERROR TYPES
 */
export type QuestTemplateError = Partial<Record<keyof DefaultQuest, string>>
