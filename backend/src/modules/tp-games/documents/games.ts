import {
  type FilterQuery,
  type PipelineStage,
  type UpdatePayload,
  type Types,
} from 'mongoose'

import { config, mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { mongoChangeFeedHandler } from 'src/util/mongo'
import {
  publishTPGameChangeEvent,
  FASTTRACK_GAME_FIELDS,
  validFastTrackUpdateField,
} from 'src/vendors/fasttrack'
import { type Category } from 'src/modules/bet/types'

import { TPBlocks } from 'src/modules/tp-games/documents'
import { gamesLogger } from '../lib/logger'

export const TP_GAME_ORIGINALS = [
  'title',
  'payout',
  'provider',
  'category',
  'description',
  'identifier',
  'blacklist',
] as const
export const TP_GAME_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'declined',
] as const
export const TP_GAME_DEVICES = ['desktop', 'mobile'] as const

export type TPGameOriginals = (typeof TP_GAME_ORIGINALS)[number]
export type TPGameApprovalStatus = (typeof TP_GAME_APPROVAL_STATUSES)[number]
export type TPGameDevice = (typeof TP_GAME_DEVICES)[number]
export type TPGameDevices = TPGameDevice[]

interface CategoryFilter {
  searchedCategory?: string
  category?: string[]
  aggregator?: string[]
  tag?: string[]
  provider?: string[]
  approvalStatus?: string[]
}

export interface GamesFilter {
  title?: string
  categories?: string[]
  aggregators?: string[]
  tags?: string[]
  providers?: string[]
  approvalStatuses?: string[]
}

export interface GetTPGames {
  ascending?: boolean | null
  category?: string | null
  count?: boolean | null
  device?: string | null
  orderBy?: string | null
  provider?: string | null
  providers?: string[] | null
  samples?: number | null
  search?: string | null
  title?: string | null
  limit: number
  page?: number
}

export interface TPGameProvider {
  provider: string
  numGames: number
}

export interface TPGameBase {
  title: string
  devices: TPGameDevices
  hasFreespins: boolean
  identifier: string
  /** Standardized, parsable aggregator name. This is equal to providerInternal for direct integrations. */
  aggregator: string
  /** Human readable game provider name (e.g. Play'n Go). */
  provider: string
  /** Standardized, parsable game provider name (e.g. playngo). */
  providerInternal: string
  category: Category
  blacklist: string[]
  disabled?: boolean
  popularity?: number
  hasFunMode: boolean
  /**
   * The provider ID for a game. Typically the right hand side of a game identifier (e.g. hacksaw:1001 => gid = 1001 ).
   * A current exception would be Softswiss where the provider gid is also our identifier (e.g. softswiss:AmericanRoulette is gid AND identifier).
   */
  gid: string
  squareImage?: string
  description?: string
  payout?: number
  /** Roobet tags that are applied to this game. */
  tags?: string[]
  /** Because tags do not track their member games and games are ordered in tags, each game must track its own position in each tag game list it is in. */
  tagPriorities?: Record<string, number>
  originals?: Partial<{ [P in TPGameOriginals]: TPGame[P] }>
  live?: boolean | null
  /**
   * Some providers/aggregators have separate gid for the same game for desktop & mobile.
   * Currently, just Playngo.
   */
  gidNumericDesktop?: string
  /**
   * Some providers/aggregators have separate gid for the same game for desktop & mobile.
   * Currently, just Playngo.
   */
  gidNumericMobile?: string
  approvalStatus?: TPGameApprovalStatus
  /** Used by client to load iframe Roobet hosted games (e.g. dice.games). */
  iframeSubdomain?: string
}

export interface TPGameCategory {
  category: string
  games: string[]
}

export interface TPGameCategoryUpdate {
  category: string
  addedGames: string[]
  removedGames: string[]
}

export interface TPGameStatusUpdate {
  games: string[]
  category: string
}

export interface TPGame extends TPGameBase {
  _id: Types.ObjectId
  /** Because game data can be fetched before it is released, we do not want to use createdAt as the release date. This can be in the future. */
  releasedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface TPGameMetaData {
  categories: string[]
  aggregators: string[]
  providers: string[]
}

const TPGamesSchema = new mongoose.Schema<TPGame>(
  {
    title: { type: String },
    devices: { type: [String] },
    hasFreespins: { type: Boolean },
    identifier: { type: String, index: true, unique: true },
    aggregator: { type: String, index: true },
    provider: { type: String },
    providerInternal: { type: String },
    category: { type: String },
    blacklist: { type: [String] },
    disabled: { type: Boolean },
    popularity: { type: Number },
    hasFunMode: { type: Boolean },
    payout: { type: Number },
    gid: { type: String },
    squareImage: { type: String },
    originals: { type: Object, select: false },
    description: { type: String },
    tags: { type: [String], index: true, sparse: true },
    tagPriorities: { type: Object },
    live: { type: Boolean },
    gidNumericDesktop: { type: String },
    gidNumericMobile: { type: String },
    approvalStatus: {
      type: String,
      index: true,
      enum: TP_GAME_APPROVAL_STATUSES,
      default: 'pending',
    },
    iframeSubdomain: { type: String },
    releasedAt: { type: Date, required: true, default: new Date() },
  },
  { timestamps: true },
)

TPGamesSchema.index(
  { gidNumericDesktop: 1, providerInternal: 1 },
  { sparse: true },
)
TPGamesSchema.index(
  { gidNumericMobile: 1, providerInternal: 1 },
  { sparse: true },
)

// For getting all games with TP Blocks applied
const HintedIndex = {
  provider: 1,
  providerInternal: 1,
  category: 1,
  approvalStatus: 1,
} as const
TPGamesSchema.index(HintedIndex)

export const TPGamesModel = mongoose.model<TPGame>('tp_games', TPGamesSchema)

const addMatchFilter = (
  aggregation: PipelineStage[],
  fieldName: string,
  filterValues: string[] | undefined,
) => {
  if (filterValues) {
    const values = Array.isArray(filterValues) ? filterValues : [filterValues]

    if (values.length > 0) {
      const matchFields: { $match: Record<string, any> } = {
        $match: {},
      }

      matchFields.$match[fieldName] = { $in: values }

      aggregation.push(matchFields)
    }
  }
}

export async function tableSearchTPGames(
  limit = 25,
  page = 0,
  filterObj: GamesFilter,
): Promise<{
  page: number
  limit: number
  count: number
  data: TPGame[]
}> {
  const aggregation: PipelineStage[] = []

  if (filterObj && filterObj.title) {
    const searchTitle: any = {
      $match: {
        title: { $regex: filterObj.title, $options: 'i' },
      },
    }
    aggregation.push(searchTitle)
  }

  if (filterObj) {
    addMatchFilter(aggregation, 'category', filterObj.categories)
    addMatchFilter(aggregation, 'approvalStatus', filterObj.approvalStatuses)
    addMatchFilter(aggregation, 'aggregator', filterObj.aggregators)
    addMatchFilter(aggregation, 'provider', filterObj.providers)
    addMatchFilter(aggregation, 'tags', filterObj.tags)
  }

  aggregation.push({
    $facet: {
      totalData: [{ $skip: page * limit }, { $limit: limit }],
      totalCount: [{ $count: 'total' }],
    },
  })

  const aggregatedData = await TPGamesModel.aggregate(aggregation)

  return {
    limit,
    page,
    count: aggregatedData[0]?.totalCount[0]?.total ?? 0,
    data: aggregatedData[0]?.totalData ?? [],
  }
}

export async function tableSearchTPGameCategories(
  limit = 25,
  page = 0,
  filterObj: CategoryFilter,
): Promise<{
  limit: number
  page: number
  count: number
  data: TPGameCategory[]
}> {
  const aggregation: PipelineStage[] = []
  if (filterObj && filterObj.searchedCategory) {
    const searchCategory = {
      $match: {
        category: { $regex: filterObj.searchedCategory, $options: 's' },
      },
    }
    aggregation.push(searchCategory)
  }

  // Adding match for each filter to aggregation
  if (filterObj) {
    addMatchFilter(aggregation, 'category', filterObj.category)
    addMatchFilter(aggregation, 'approvalStatus', filterObj.approvalStatus)
    addMatchFilter(aggregation, 'aggregator', filterObj.aggregator)
    addMatchFilter(aggregation, 'provider', filterObj.provider)
    addMatchFilter(aggregation, 'tags', filterObj.tag)
  }

  aggregation.push(
    {
      $project: {
        identifier: 1,
        category: {
          $cond: {
            $ifNull: ['$category', 'unknown'],
          },
        },
      },
    },
    {
      $group: {
        _id: '$category',
        category: { $first: '$category' },
        games: { $push: '$identifier' },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    { $skip: page * limit },
  )

  const aggregatedData = await TPGamesModel.aggregate(aggregation)

  return {
    limit,
    page,
    count: aggregatedData.length,
    data: aggregatedData,
  }
}

export async function updateGameCategories(
  addedGamesIdentifiers: string[],
  addedGamesCategory: string,
  removedGamesIdentifiers: string[],
): Promise<void> {
  // Update added games to new category
  await TPGamesModel.updateMany(
    { identifier: { $in: addedGamesIdentifiers } },
    { $set: { category: addedGamesCategory } },
  )

  // Update removed games to unknown category
  await TPGamesModel.updateMany(
    { identifier: { $in: removedGamesIdentifiers } },
    { $set: { category: 'unknown' } },
  )
}

export async function updateGame(
  filter: FilterQuery<TPGame>,
  payload: UpdatePayload<TPGame>,
): Promise<TPGame> {
  // TODO stop merging the blacklist with the global blocklist on update, our list can change.
  if ('$set' in payload && payload.$set?.blacklist) {
    for (const blockedCountryCode of Object.keys(config.countryBlocks.list)) {
      payload.$set.blacklist = [...payload.$set.blacklist].concat(
        blockedCountryCode,
      )
    }
  }
  // TODO stop merging the blacklist with the global blocklist on update, our list can change.
  if ('$setOnInsert' in payload && payload.$setOnInsert?.blacklist) {
    for (const blockedCountryCode of Object.keys(config.countryBlocks.list)) {
      payload.$setOnInsert.blacklist = [
        ...payload.$setOnInsert.blacklist,
      ].concat(blockedCountryCode)
    }
  }
  return await TPGamesModel.findOneAndUpdate(
    filter,
    {
      ...payload,
    },
    {
      new: true,
      upsert: true,
    },
  )
}

export async function updateGames(
  filter: FilterQuery<TPGame>,
  payload: UpdatePayload<TPGame>,
): Promise<void> {
  await TPGamesModel.updateMany(filter, payload, {
    new: true,
    upsert: true,
  })
}

export async function updateGamesStatus(
  updatedIdentifiers: string[],
  approvalStatus: string,
): Promise<void> {
  await TPGamesModel.updateMany(
    { identifier: { $in: updatedIdentifiers } },
    { $set: { approvalStatus } },
  )
}

export async function disableGame(
  gameIdenfitier: string,
): Promise<TPGame | null> {
  return await TPGamesModel.findOneAndUpdate(
    { identifier: gameIdenfitier },
    { $set: { approvalStatus: 'declined' } },
    { new: true, upsert: true },
  )
}

export async function deleteGames(filter: FilterQuery<TPGame>) {
  await TPGamesModel.deleteMany(filter).lean()
}

export async function getGame(
  filter: FilterQuery<TPGame>,
): Promise<TPGame | null> {
  return await ((await TPGamesModel.findOne(filter))?.toObject() ?? null)
}

export async function getGamesByAggregator(
  aggregator: string,
): Promise<TPGame[]> {
  const gameData = await TPGamesModel.find({ aggregator })
  return gameData.map(game => game.toObject())
}

export async function getGamesByTagIds(tagIds: string[]): Promise<TPGame[]> {
  const gameData = await TPGamesModel.find({
    tags: { $in: tagIds },
    approvalStatus: 'approved',
  })
  return gameData.map(game => game.toObject())
}

export async function findGamesByQuery(
  gameQueries: FilterQuery<TPGame[]>,
): Promise<TPGame[]> {
  return await TPGamesModel.find({ $or: gameQueries })
}

const flattenFilterQuery = (
  matches: Array<[FilterQuery<TPGame>, boolean]>,
): FilterQuery<TPGame> => {
  return matches.reduce<FilterQuery<TPGame>>((matches, [filter, include]) => {
    if (include) {
      return {
        ...matches,
        ...filter,
      }
    }

    return matches
  }, {})
}

/**
 * Constructs aggregation for querying the games collection.
 *
 * @returns A array of {@link PipelineStage}, or undefined if the passed parameters are invalid.
 */
async function getGamesAggregation({
  ascending,
  category,
  device = 'desktop',
  limit,
  orderBy,
  page = 0,
  provider,
  providers,
  samples,
  search,
  title,
}: GetTPGames): Promise<PipelineStage[] | undefined> {
  // Determine if we should should search via $search or $match.
  const shouldUseAtlasSearch = search && !config.isLocal

  // Determine search options.
  const sortIndex = orderBy || 'title'
  const sortDirection = ascending ? 1 : -1

  // Game disables.
  const gameDisablesMatch = await TPBlocks.getMatchDisabledAggregationStage()

  const matchFilter = flattenFilterQuery([
    // Desktop or mobile device, required.
    [{ devices: device }, true],

    // Approval status, required.
    [{ approvalStatus: 'approved' }, true],

    // Game category.
    [{ category }, !!category],

    // Game title.
    [{ title: { $regex: new RegExp(String('^' + title), 'i') } }, !!title],

    // Game provider.
    [
      {
        provider: { $regex: new RegExp(String('^' + provider), 'i') },
      },
      !!provider,
    ],

    // Game providers, multiple.
    [
      {
        provider: { $in: providers },
      },
      !!providers && providers.length > 0,
    ],
  ])

  const aggregation: PipelineStage[] = [
    gameDisablesMatch,
    { $match: matchFilter },
    { $project: { payout: 0 } },
  ]

  if (search) {
    // Only permit alphanumeric search values.
    const escapedSearch = search?.replace(/[^0-9A-Za-z ]/g, '')

    // If no search phrase is present after escaping, return undefined.
    if (!escapedSearch) {
      return undefined
    }

    // Atlas Search is only available on shared/dedicated clusters, not serverless instances or local.
    if (!shouldUseAtlasSearch) {
      aggregation.push({
        $match: {
          title: { $regex: escapedSearch, $options: 'i' },
        },
      })
    } else {
      // The $search step must come first. Thus, unshift.
      aggregation.unshift({
        $search: {
          index: 'title',
          compound: {
            must: [
              {
                autocomplete: {
                  query: escapedSearch,
                  path: 'title',
                },
              },
            ],
            should: [
              {
                text: {
                  query: 'roobet',
                  path: 'aggregator',
                  score: { boost: { value: 1 } },
                },
              },
            ],
          },
          // Disabling Atlas search sorting as it's returning
          // unwanted results. We'll be removing this search option
          // entirely soon.
          // sort: {
          //   // Sorting order.
          //   [sortIndex]: sortDirection,
          //   // The _id to return consistent results.
          //   _id: -1,
          // },
        },
      })
    }
  }

  // This is for selecting a random sample from tp_games (see: I'm Feeling Lucky)
  if (samples) {
    aggregation.push({ $sample: { size: samples } })
  }

  // If not searching, or searching without Atlas search, order by.
  if (!search || !shouldUseAtlasSearch) {
    // Adding the _id sort because lack of schema produces unpredictable sorts.
    aggregation.push({ $sort: { [sortIndex]: sortDirection, _id: -1 } })
  }

  if (page > 0 && limit > 0) {
    aggregation.push({ $skip: page * limit })
  }

  if (limit > 0) {
    aggregation.push({ $limit: limit })
  }

  return aggregation
}

export async function getGamesCount({
  category,
  device = 'desktop',
  provider,
  providers,
  search,
  title,
}: Omit<GetTPGames, 'limit'>): Promise<Array<{ count: number }>> {
  const aggregation = await getGamesAggregation({
    category,
    device,
    limit: 0,
    provider,
    providers,
    search,
    title,
  })

  if (!aggregation) {
    return [{ count: 0 }]
  }

  return await TPGamesModel.aggregate([...aggregation, { $count: 'count' }])
}

export async function getGames({
  ascending,
  category,
  device = 'desktop',
  limit,
  orderBy,
  page = 0,
  provider,
  providers,
  samples,
  search,
  title,
}: GetTPGames): Promise<Array<TPGame & { _id: Types.ObjectId }>> {
  const aggregation = await getGamesAggregation({
    ascending,
    category,
    device,
    limit,
    orderBy,
    page,
    provider,
    providers,
    samples,
    search,
    title,
  })

  if (!aggregation) {
    return []
  }

  return await TPGamesModel.aggregate(aggregation)
}

export async function getGameProviders({
  category,
  device = 'desktop',
}: {
  category: string | null
  device: string | null
}): Promise<TPGameProvider[]> {
  const aggregation: PipelineStage[] = [
    { $match: { approvalStatus: 'approved' } },
    await TPBlocks.getMatchDisabledAggregationStage(),
  ]

  if (category) {
    aggregation.push({ $match: { category } })
  }
  if (device) {
    aggregation.push({ $match: { devices: device } })
  }

  aggregation.push({
    $group: {
      _id: '$provider',
      provider: {
        $last: '$provider',
      },
      numGames: {
        $sum: 1,
      },
    },
  })

  aggregation.push({
    $sort: {
      numGames: -1,
    },
  })

  return await TPGamesModel.aggregate(aggregation)
}

export async function getDistinctTPGameMetadata(): Promise<TPGameMetaData> {
  const aggregation: PipelineStage[] = [
    {
      $project: {
        _id: 0,
        category: {
          $cond: {
            if: {
              $or: [
                { $eq: ['$category', null] },
                { $eq: ['$category', ''] },
                { $eq: ['$category', undefined] },
              ],
            },
            then: 'unknown',
            else: '$category',
          },
        },
        aggregators: '$aggregator',
        providers: '$provider',
      },
    },
    {
      $group: {
        _id: null,
        categories: { $addToSet: '$category' },
        aggregators: { $addToSet: '$aggregators' },
        providers: { $addToSet: '$providers' },
      },
    },
    {
      $project: {
        _id: 0,
        categories: 1,
        aggregators: 1,
        providers: 1,
      },
    },
  ]

  const result = await TPGamesModel.aggregate(aggregation)
  const { categories, aggregators, providers } = result[0]

  return {
    categories,
    aggregators,
    providers,
  }
}

export async function getAllApprovedAndEnabledGamesByTagIds(
  tagIds: string[],
): Promise<TPGame[]> {
  return await getAllGames('approved', false, tagIds)
}

export async function getAllApprovedAndEnabledGames() {
  return await getAllGames('approved', false)
}

export async function getAllGames(
  approvalStatus?: string | null,
  disabledGames?: boolean | null,
  tagIds?: string[],
): Promise<TPGame[]> {
  const matchStage: PipelineStage.Match = { $match: {} }
  if (!disabledGames) {
    matchStage.$match = {
      ...matchStage.$match,
      ...(await TPBlocks.getMatchDisabledAggregationStage()).$match,
    }
  }
  if (approvalStatus) {
    matchStage.$match.approvalStatus = approvalStatus
  }
  if (tagIds) {
    matchStage.$match.tags = { $in: tagIds }
  }

  return TPGamesModel.aggregate([matchStage], {
    $hint: HintedIndex,
  })
}

export async function getGamesByIdentifiers(
  identifiers: string[],
  device = 'desktop',
): Promise<TPGame[]> {
  const aggregation: PipelineStage[] = [
    { $match: { devices: device } },
    { $match: { identifier: { $in: identifiers } } },
    { $sort: { popularity: -1 } },
  ]
  const games = await TPGamesModel.aggregate(aggregation)
  games.forEach((game: TPGame) => {
    delete game.payout
  })
  return await TPBlocks.filterOutDisabled(games)
}

export async function getGamesByProvider(provider: string) {
  const games = await TPGamesModel.find({
    provider,
  })
  return await TPBlocks.filterOutDisabled(games)
}

export async function getAllProviders() {
  const result = await TPGamesModel.aggregate([
    {
      $group: {
        _id: '$providerInternal',
      },
    },
  ])

  return result.map(({ _id }) => _id)
}

export const getGameSquareImages = async (
  identifiers: string[],
): Promise<Record<string, string>> => {
  const docs = await TPGamesModel.find(
    {
      identifier: { $in: identifiers },
    },
    { identifier: 1, squareImage: 1 },
  )

  return docs.reduce<Record<string, string>>((images, doc) => {
    if (!doc.identifier || !doc.squareImage) {
      return images
    }

    return {
      ...images,
      [doc.identifier]: doc.squareImage,
    }
  }, {})
}

/* FEEDS */
const tpGameChangeFeed = async () => {
  try {
    await mongoChangeFeedHandler<TPGame>(TPGamesModel, async document => {
      if (
        document.fullDocument &&
        validFastTrackUpdateField(document, FASTTRACK_GAME_FIELDS)
      ) {
        await publishTPGameChangeEvent({
          tpGame: document.fullDocument,
        })
      }
    })
  } catch (error) {
    gamesLogger('tpGameChangeFeed', { userId: null }).error(
      'There was an error in the tp_games change feed',
      {},
      error,
    )
  }
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: TPGamesModel.collection.name,
  feeds: [tpGameChangeFeed],
}
