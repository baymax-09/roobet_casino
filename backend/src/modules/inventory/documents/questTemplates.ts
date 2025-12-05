import { type FilterQuery } from 'mongoose'

import {
  QuestTemplateModel,
  type QuestTemplate,
  type QuestCriteriaType,
} from './questTemplate'

interface QuestTemplateCreateArgs {
  item: Omit<QuestTemplate, '_id'>
}

interface FilterQuestTemplateQuery {
  criteriaType: QuestCriteriaType
  name: string
}

/*
 * CREATE
 */
export async function createQuestTemplate({
  item,
}: QuestTemplateCreateArgs): Promise<QuestTemplate> {
  return await (await QuestTemplateModel.create(item)).toObject()
}

/*
 * READ
 */
export async function getQuestTemplates(
  filter: FilterQuery<FilterQuestTemplateQuery> = {},
): Promise<QuestTemplate[]> {
  return await QuestTemplateModel.find(filter).lean<QuestTemplate[]>()
}

export async function getQuestTemplate(
  filter: FilterQuery<FilterQuestTemplateQuery> = {},
): Promise<QuestTemplate | null> {
  return await QuestTemplateModel.findOne(filter).lean<QuestTemplate>()
}
